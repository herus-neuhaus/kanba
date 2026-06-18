import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuth } from './useAuth';
import type { Space } from '@/types';

export function useSpaces() {
  const { agency } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['spaces', agency?.id],
    queryFn: async () => {
      if (!agency) return [];
      return apiClient<Space[]>('/spaces');
    },
    enabled: !!agency,
  });

  const createSpace = useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      if (!agency) throw new Error('No agency');
      return apiClient<Space>('/spaces', {
        method: 'POST',
        body: JSON.stringify({ name, color }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }),
  });

  const updateSpace = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color?: string }) => {
      return apiClient<Space>(`/spaces/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, color }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }),
  });

  const deleteSpace = useMutation({
    mutationFn: async (id: string) => {
      return apiClient<{ message: string }>(`/spaces/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spaces'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return useMemo(() => ({ 
    ...query, 
    createSpace, 
    updateSpace, 
    deleteSpace 
  }), [query.data, query.isLoading, query.error, createSpace, updateSpace, deleteSpace]);
}
