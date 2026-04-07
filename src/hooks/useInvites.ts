import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Profile } from '@/types';

export function useInvites() {
  const { agency, user } = useAuth();
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
      
      // 1. Get invite details
      const { data: invite, error: fetchError } = await supabase.from('invites').select('*').eq('token', token).single();
      if (fetchError || !invite) throw new Error('Convite inválido ou expirado');
      if (invite.used) throw new Error('Este convite já foi utilizado');

      // 2. Update user profile with agency_id and role
      const { error: profileError } = await supabase.from('profiles').update({ 
        agency_id: invite.agency_id, 
        role: invite.role,
        status: 'active'
      }).eq('id', user.id);
      
      if (profileError) throw profileError;

      // 3. Mark invite as used
      await supabase.from('invites').update({ used: true }).eq('id', invite.id);

      return invite;
    },
    onSuccess: () => {
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
