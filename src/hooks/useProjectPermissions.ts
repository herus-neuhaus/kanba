import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await (supabase
        .from('project_permissions' as any) as any)
        .select('*')
        .eq('profile_id', profileId);
      
      if (error) throw error;
      return data as ProjectPermission[];
    },
    enabled: !!profileId,
  });

  const updatePermission = useMutation({
    mutationFn: async ({ projectId, level }: { projectId: string, level: PermissionLevel | null }) => {
      if (!profileId) throw new Error('No profile ID provided');

      if (level === null) {
        // Remove permission
        const { error } = await (supabase
          .from('project_permissions' as any) as any)
          .delete()
          .eq('profile_id', profileId)
          .eq('project_id', projectId);
        if (error) throw error;
      } else {
        // Upsert permission
        const { error } = await (supabase
          .from('project_permissions' as any) as any)
          .upsert({
            profile_id: profileId,
            project_id: projectId,
            permission_level: level,
          }, { onConflict: 'profile_id,project_id' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project_permissions', profileId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return { ...query, updatePermission };
}
