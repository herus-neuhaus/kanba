import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Profile } from '@/types';

export function useTeam() {
  const { agency } = useAuth();

  return useQuery({
    queryKey: ['team', agency?.id],
    queryFn: async () => {
      if (!agency) return [];
      const { data, error } = await supabase.from('profiles').select('*').eq('agency_id', agency.id);
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!agency,
  });
}
