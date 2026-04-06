import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Task } from '@/types';

export function useTasks(projectId?: string) {
  const { agency } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['tasks', agency?.id, projectId],
    queryFn: async () => {
      if (!agency) return [];
      let q = supabase.from('tasks').select('*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, phone)').eq('agency_id', agency.id);
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!agency,
  });

  const createTask = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      if (!agency) throw new Error('No agency');
      const { data, error } = await supabase.from('tasks').insert({ ...task, agency_id: agency.id, title: task.title! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return { ...query, createTask, updateTask, deleteTask };
}
