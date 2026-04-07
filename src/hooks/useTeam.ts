import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Profile } from '@/types';

export function useTeam() {
  const { agency } = useAuth();

  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['team', agency?.id],
    queryFn: async () => {
      if (!agency) return [];
      const { data, error } = await supabase.from('profiles').select('*').eq('agency_id', agency.id);
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!agency,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('profiles').update({ agency_id: null, role: 'member', status: 'inactive' }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });

  return { ...query, updateStatus, removeMember };
}
