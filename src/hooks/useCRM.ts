import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { CRMPipeline, CRMClient, CRMDeal } from '@/types';

export function useCRMPipelines() {
  const { agency } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['crm_pipelines', agency?.id],
    queryFn: async () => {
      if (!agency) return [];
      const { data, error } = await supabase
        .from('crm_pipelines')
        .select('*')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CRMPipeline[];
    },
    enabled: !!agency,
  });

  const createPipeline = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      if (!agency) throw new Error('No agency');
      const { data, error } = await supabase
        .from('crm_pipelines')
        .insert({ ...payload, agency_id: agency.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_pipelines'] }),
  });

  const updatePipeline = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('crm_pipelines')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_pipelines'] }),
  });

  const deletePipeline = useMutation({
    mutationFn: async (id: string) => {
      // Deleta deals primeiro para contornar possivel falta de CASCADE
      const { error: errorDeals } = await supabase
        .from('crm_deals')
        .delete()
        .eq('pipeline_id', id);
      if (errorDeals) throw errorDeals;
      
      const { error } = await supabase
        .from('crm_pipelines')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_pipelines'] }),
  });

  return { ...query, createPipeline, updatePipeline, deletePipeline };
}

export function useCRMClients() {
  const { agency } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['crm_clients', agency?.id],
    queryFn: async () => {
      if (!agency) return [];
      const { data, error } = await supabase
        .from('crm_clients')
        .select('*')
        .eq('agency_id', agency.id)
        .order('name');
      
      if (error) throw error;
      return data as CRMClient[];
    },
    enabled: !!agency,
  });

  const createClient = useMutation({
    mutationFn: async (payload: { name: string; status?: string; contact_info?: any }) => {
      if (!agency) throw new Error('No agency');
      const { data, error } = await supabase
        .from('crm_clients')
        .insert({ ...payload, agency_id: agency.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_clients'] }),
  });

  const updateClient = useMutation({
    mutationFn: async ({ clientId, payload }: { clientId: string; payload: Partial<CRMClient> }) => {
      const { data, error } = await supabase
        .from('crm_clients')
        .update(payload)
        .eq('id', clientId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_clients'] }),
  });

  return { ...query, createClient, updateClient };
}

export function useCRMDeals(pipelineId?: string) {
  const { agency } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['crm_deals', agency?.id, pipelineId],
    queryFn: async () => {
      if (!agency || !pipelineId) return [];
      const { data, error } = await supabase
        .from('crm_deals')
        .select(`
          *,
          client:crm_clients (*),
          assignee:profiles!crm_deals_assigned_to_fkey(*)
        `)
        .eq('agency_id', agency.id)
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as CRMDeal[];
    },
    enabled: !!agency && !!pipelineId,
  });

  const createDeal = useMutation({
    mutationFn: async (payload: { pipeline_id: string; client_id: string; title: string; value: number; stage: string; expected_close_date?: string; assigned_to?: string }) => {
      if (!agency) throw new Error('No agency');
      const { data, error } = await supabase
        .from('crm_deals')
        .insert({ ...payload, agency_id: agency.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_deals'] }),
  });

  const updateDealStage = useMutation({
    mutationFn: async ({ dealId, stage, assigned_to, next_action_date, next_action_label }: { dealId: string; stage: string; assigned_to?: string | null; next_action_date?: string | null; next_action_label?: string | null }) => {
      const payload: any = { stage };
      if (assigned_to !== undefined) payload.assigned_to = assigned_to;
      if (next_action_date !== undefined) payload.next_action_date = next_action_date;
      if (next_action_label !== undefined) payload.next_action_label = next_action_label;

      const { data, error } = await supabase
        .from('crm_deals')
        .update(payload)
        .eq('id', dealId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_deals'] }),
  });

  const updateDeal = useMutation({
    mutationFn: async ({ dealId, payload }: { dealId: string; payload: Partial<CRMDeal> }) => {
      const { data, error } = await supabase
        .from('crm_deals')
        .update(payload)
        .eq('id', dealId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_deals'] }),
  });

  const deleteDeal = useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase
        .from('crm_deals')
        .delete()
        .eq('id', dealId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_deals'] }),
  });

  return { ...query, createDeal, updateDealStage, updateDeal, deleteDeal };
}
