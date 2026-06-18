import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuth } from './useAuth';

export function useInvites() {
  const { agency, user, refreshProfile } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['invites', agency?.id],
    queryFn: async () => {
      if (!agency) return [];
      return apiClient<any[]>('/invites');
    },
    enabled: !!agency,
  });

  const createInvite = useMutation({
    mutationFn: async ({ email, role, role_id, project_id }: { email?: string; role?: string; role_id?: string; project_id?: string }) => {
      if (!agency) throw new Error('No agency');
      return apiClient<any>('/invites', {
        method: 'POST',
        body: JSON.stringify({ email, role, role_id, project_id })
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invites'] }),
  });

  const acceptInvite = useMutation({
    mutationFn: async (token: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const result = await apiClient<{ success: boolean; message?: string; agency_id?: string }>(`/invites/${token}/accept`, {
        method: 'POST'
      });
      
      if (!result.success) throw new Error(result.message);

      return result;
    },
    onSuccess: async () => {
      await refreshProfile();
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['agency'] });
    },
  });

  const deleteInvite = useMutation({
    mutationFn: async (id: string) => {
      return apiClient<{ message: string }>(`/invites/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invites'] }),
  });

  return { ...query, createInvite, acceptInvite, deleteInvite };
}
