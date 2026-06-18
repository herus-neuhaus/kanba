import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import type { AgencyRole } from '@/types';

export function useRoles() {
  const { agency } = useAuth();
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      const data = await apiClient<AgencyRole[]>('/roles');
      return data;
    },
    enabled: !!agency?.id,
  });

  const updateRolePermissions = useMutation({
    mutationFn: async ({ id, permissions }: { id: string; permissions: any }) => {
      await apiClient(`/roles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ permissions }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', agency?.id] });
    },
  });

  const createRole = useMutation({
    mutationFn: async ({ name, permissions, role_type = 'internal' }: { name: string; permissions: any; role_type?: 'internal' | 'client' }) => {
      if (!agency?.id) throw new Error("No agency present");
      const data = await apiClient<AgencyRole>('/roles', {
        method: 'POST',
        body: JSON.stringify({ name, permissions, role_type }),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', agency?.id] });
    },
  });

  const deleteRole = useMutation({
    mutationFn: async (id: string) => {
      await apiClient(`/roles/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', agency?.id] });
    },
  });

  const updateRoleName = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await apiClient(`/roles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', agency?.id] });
    },
  });

  return {
    roles,
    isLoading,
    updateRolePermissions,
    createRole,
    deleteRole,
    updateRoleName,
  };
}
