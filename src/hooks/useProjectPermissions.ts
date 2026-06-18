import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export type PermissionLevel = 'view' | 'edit';

export interface ProjectPermission {
  id: string;
  profile_id: string;
  project_id: string;
  permission_level: PermissionLevel;
  created_at?: string;
}

export function useProjectPermissions(profileId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['project_permissions', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const data = await apiClient(`/project-permissions?profileId=${profileId}`);
      return data as ProjectPermission[];
    },
    enabled: !!profileId,
  });

  const updatePermission = useMutation({
    mutationFn: async ({ projectId, level }: { projectId: string, level: PermissionLevel | null }) => {
      if (!profileId) throw new Error('No profile ID provided');

      await apiClient('/project-permissions', {
        method: 'PUT',
        body: JSON.stringify({
          profile_id: profileId,
          project_id: projectId,
          permission_level: level,
        })
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project_permissions', profileId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return { ...query, updatePermission };
}
