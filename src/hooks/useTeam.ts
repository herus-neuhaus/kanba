import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import type { Profile } from '@/types';
import { apiClient } from '@/lib/api/client';

export function useTeam() {
  const { agency } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['team', agency?.id],
    queryFn: async () => {
      if (!agency) return [];
      const data = await apiClient('/team');
      return data as Profile[];
    },
    enabled: !!agency,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      if (!agency) throw new Error("No active agency");
      await apiClient(`/team/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      if (!agency) throw new Error("No active agency");
      await apiClient(`/team/${userId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });

  return { ...query, updateStatus, removeMember };
}
