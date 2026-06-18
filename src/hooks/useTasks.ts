import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuth } from './useAuth';
import type { Task } from '@/types';
import type { Json } from '@/integrations/supabase/types';

export function useTasks(projectId?: string, spaceId?: string) {
  const { agency } = useAuth();
  const qc = useQueryClient();

  const queryKey = ['tasks', agency?.id, projectId, spaceId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!agency) return [];
      
      const queryParams = new URLSearchParams();
      if (projectId) queryParams.append('projectId', projectId);
      if (spaceId) queryParams.append('spaceId', spaceId);

      return apiClient<Task[]>(`/tasks?${queryParams.toString()}`);
    },
    enabled: !!agency,
  });

  const createTask = useMutation({
    mutationFn: async (task: { title: string; project_id?: string; column_id?: string; priority?: string; description?: string; assignee_ids?: string[]; due_date?: string; labels?: string[]; position?: number }) => {
      if (!agency) throw new Error('No agency');
      return apiClient<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, checklist, ...updates }: { id: string; checklist?: any; [key: string]: any }) => {
      const payload: Record<string, any> = { ...updates };
      if (checklist !== undefined) payload.checklist = checklist as Json;

      return apiClient<Task>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    // Optimistic UI updates
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey });
      const previousTasks = qc.getQueryData<Task[]>(queryKey);

      if (previousTasks) {
        qc.setQueryData<Task[]>(queryKey, old => 
          old?.map(task => 
            task.id === variables.id 
              ? { ...task, ...variables } // Aplica as mudanças instantaneamente
              : task
          )
        );
      }
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // Reverte se a API falhar
      if (context?.previousTasks) {
        qc.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      // Sincroniza o estado final com o servidor silenciosamente
      qc.invalidateQueries({ queryKey });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      return apiClient<{ message: string }>(`/tasks/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  return useMemo(() => ({ 
    ...query, 
    createTask, 
    updateTask, 
    deleteTask 
  }), [query.data, query.isLoading, query.error, createTask, updateTask, deleteTask]);
}
