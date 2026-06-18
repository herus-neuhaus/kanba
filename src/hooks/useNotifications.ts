import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuth } from './useAuth';
import type { InAppNotification } from '@/types';

export function useNotifications() {
  const { session } = useAuth();
  const qc = useQueryClient();

  // Polling a cada 30 segundos
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!session) return [];
      return apiClient<InAppNotification[]>('/notifications');
    },
    enabled: !!session,
    refetchInterval: 30000,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/notifications/${id}/read`, { method: 'PATCH' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      return apiClient('/notifications/read-all', { method: 'PATCH' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = query.data?.filter(n => !n.isRead).length || 0;

  return { ...query, markAsRead, markAllAsRead, unreadCount };
}
