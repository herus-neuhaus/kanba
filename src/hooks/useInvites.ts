import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Profile } from '@/types';

export function useInvites() {
  const { agency, user, refreshProfile } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['invites', agency?.id],
    queryFn: async () => {
      if (!agency) return [];
      const { data, error } = await supabase.from('invites').select('*').eq('agency_id', agency.id).eq('used', false).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!agency,
  });

  const createInvite = useMutation({
    mutationFn: async ({ email, role }: { email?: string; role: string }) => {
      if (!agency) throw new Error('No agency');
      const { data, error } = await supabase.from('invites').insert({ agency_id: agency.id, email, role }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invites'] }),
  });

  const acceptInvite = useMutation({
    mutationFn: async (token: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase.rpc('accept_agency_invitation', { p_token: token });
      
      if (error) throw error;
      
      const result = data as { success: boolean; message?: string; agency_id?: string };
      if (result && !result.success) throw new Error(result.message);

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
      const { error } = await supabase.from('invites').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invites'] }),
  });

  return { ...query, createInvite, acceptInvite, deleteInvite };
}
