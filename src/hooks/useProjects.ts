import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Project } from '@/types';

export function useProjects() {
  const { agency } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['projects', agency?.id],
    queryFn: async () => {
      if (!agency) return [];
      const { data, error } = await supabase.from('projects').select('*').eq('agency_id', agency.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!agency,
  });

  const createProject = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!agency) throw new Error('No agency');
      const { data, error } = await supabase.from('projects').insert({ name, description, agency_id: agency.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      const { data, error } = await supabase.from('projects').update({ name, description }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      // 1. Get all task IDs for this project
      const { data: tasks, error: fetchError } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', id);
      
      if (fetchError) throw fetchError;
      const taskIds = tasks?.map(t => t.id) || [];

      if (taskIds.length > 0) {
        // 2. Delete ALL comments associated with these tasks
        // Supabase/PostgREST delete returns an error if failed
        const { error: commentsError } = await supabase
          .from('comments')
          .delete()
          .in('task_id', taskIds);
        
        if (commentsError) throw commentsError;

        // 3. Delete the tasks themselves
        const { error: tasksError } = await supabase
          .from('tasks')
          .delete()
          .in('id', taskIds);
        
        if (tasksError) throw tasksError;
      }

      // 4. Finally delete the project
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (projectError) throw projectError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return { ...query, createProject, updateProject, deleteProject };
}
