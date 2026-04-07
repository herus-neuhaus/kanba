import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Task } from '@/types';
import type { Json } from '@/integrations/supabase/types';

export function useTasks(projectId?: string) {
  const { agency } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['tasks', agency?.id, projectId],
    queryFn: async () => {
      if (!agency) return [];
      let q = supabase.from('tasks').select('*, project:projects(name), assignee:profiles!tasks_assignee_id_fkey(id, full_name, phone)').eq('agency_id', agency.id);
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Task[];
    },
    enabled: !!agency,
  });

  const createTask = useMutation({
    mutationFn: async (task: { title: string; project_id?: string; status?: string; priority?: string; description?: string; assignee_id?: string; due_date?: string; labels?: string[] }) => {
      if (!agency) throw new Error('No agency');
      const { data, error } = await supabase.from('tasks').insert({ ...task, agency_id: agency.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, checklist, ...updates }: { id: string; checklist?: any; [key: string]: any }) => {
      const payload: Record<string, any> = { ...updates };
      if (checklist !== undefined) payload.checklist = checklist as Json;
      const { error } = await supabase.from('tasks').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      // Delete comments for this task first to avoid foreign key violation
      await supabase.from('comments').delete().eq('task_id', id);

      // Finally delete the task
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return { ...query, createTask, updateTask, deleteTask };
}
