import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuth } from './useAuth';
import { useWorkspace } from './useWorkspace';
import type { Project } from '@/types';

export function useProjects(spaceIdOverride?: string) {
  const { agency } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const qc = useQueryClient();

  const spaceId = spaceIdOverride !== undefined ? spaceIdOverride : activeWorkspaceId;

  const query = useQuery({
    queryKey: ['projects', agency?.id, spaceId],
    queryFn: async () => {
      if (!agency) return [];
      
      const queryParams = new URLSearchParams();
      if (spaceId) {
        queryParams.append('spaceId', spaceId);
      }
      
      return apiClient<Project[]>(`/projects?${queryParams.toString()}`);
    },
    enabled: !!agency,
  });

  const createProject = useMutation({
    mutationFn: async ({ name, description, space_id }: { name: string; description?: string; space_id?: string }) => {
      if (!agency) throw new Error('No agency');
      return apiClient<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify({ name, description, space_id }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      return apiClient<Project>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, description }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      return apiClient<{ message: string }>(`/projects/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return useMemo(() => ({ 
    ...query, 
    createProject, 
    updateProject, 
    deleteProject 
  }), [query.data, query.isLoading, query.error, createProject, updateProject, deleteProject]);
}
