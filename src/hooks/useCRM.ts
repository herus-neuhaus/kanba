import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuth } from './useAuth';
import type { CRMPipeline, CRMClient, CRMDeal } from '@/types';
import { useWorkspace } from './useWorkspace';

export function useCRMPipelines(spaceIdOverride?: string) {
  const { agency } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const qc = useQueryClient();

  const spaceId = spaceIdOverride !== undefined ? spaceIdOverride : activeWorkspaceId;

  const query = useQuery({
    queryKey: ['crm_pipelines', agency?.id, spaceId],
    queryFn: async () => {
      if (!agency) return [];
      const queryStr = spaceId ? `?spaceId=${spaceId}` : '';
      return await apiClient<CRMPipeline[]>(`/crm/pipelines${queryStr}`);
    },
    enabled: !!agency,
  });

  const createPipeline = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      if (!agency) throw new Error('No agency');
      return await apiClient<CRMPipeline>('/crm/pipelines', {
        method: 'POST',
        body: JSON.stringify({ ...payload, spaceId }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_pipelines'] }),
  });

  const updatePipeline = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return await apiClient<CRMPipeline>(`/crm/pipelines/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_pipelines'] }),
  });

  const deletePipeline = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient(`/crm/pipelines/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_pipelines'] }),
  });

  return { ...query, createPipeline, updatePipeline, deletePipeline };
}

export function useCRMClients(spaceIdOverride?: string) {
  const { agency } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const qc = useQueryClient();

  const spaceId = spaceIdOverride !== undefined ? spaceIdOverride : activeWorkspaceId;

  const query = useQuery({
    queryKey: ['crm_clients', agency?.id, spaceId],
    queryFn: async () => {
      if (!agency) return [];
      const queryStr = spaceId ? `?spaceId=${spaceId}` : '';
      return await apiClient<CRMClient[]>(`/crm/clients${queryStr}`);
    },
    enabled: !!agency,
  });

  const createClient = useMutation({
    mutationFn: async (payload: { name: string; status?: string; contact_info?: any }) => {
      if (!agency) throw new Error('No agency');
      return await apiClient<CRMClient>('/crm/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          status: payload.status,
          contactInfo: payload.contact_info,
          spaceId,
        }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_clients'] }),
  });

  const updateClient = useMutation({
    mutationFn: async ({ clientId, payload }: { clientId: string; payload: Partial<CRMClient> }) => {
      return await apiClient<CRMClient>(`/crm/clients/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
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
      return await apiClient<CRMDeal[]>(`/crm/deals?pipelineId=${pipelineId}`);
    },
    enabled: !!agency && !!pipelineId,
  });

  const createDeal = useMutation({
    mutationFn: async (payload: { pipeline_id: string; client_id: string; title: string; value: number; stage: string; expected_close_date?: string; assigned_to?: string }) => {
      if (!agency) throw new Error('No agency');
      return await apiClient<CRMDeal>('/crm/deals', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_deals'] }),
  });

  const updateDealStage = useMutation({
    mutationFn: async ({ dealId, stage, assigned_to, next_action_date, next_action_label }: { dealId: string; stage: string; assigned_to?: string | null; next_action_date?: string | null; next_action_label?: string | null }) => {
      const payload: any = { stage };
      if (assigned_to !== undefined) payload.assigned_to = assigned_to;
      if (next_action_date !== undefined) payload.next_action_date = next_action_date;
      if (next_action_label !== undefined) payload.next_action_label = next_action_label;

      return await apiClient<CRMDeal>(`/crm/deals/${dealId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_deals'] }),
  });

  const updateDeal = useMutation({
    mutationFn: async ({ dealId, payload }: { dealId: string; payload: Partial<CRMDeal> }) => {
      return await apiClient<CRMDeal>(`/crm/deals/${dealId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_deals'] }),
  });

  const deleteDeal = useMutation({
    mutationFn: async (dealId: string) => {
      return await apiClient(`/crm/deals/${dealId}`, { method: 'DELETE' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_deals'] }),
  });

  return { ...query, createDeal, updateDealStage, updateDeal, deleteDeal };
}
