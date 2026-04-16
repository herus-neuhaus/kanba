import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useWhatsappStatus(agencyId: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [instanceName, setInstanceName] = useState<string | null>(null);

  useEffect(() => {
    if (!agencyId) return;

    const checkStatus = async () => {
      try {
        // Obter o status local rapidamente
        const { data: localData } = await supabase
          .from('agencies')
          .select('whatsapp_connected, evolution_instance_name')
          .eq('id', agencyId)
          .single();

        setInstanceName(localData?.evolution_instance_name || null);
        setIsConnected(!!localData?.whatsapp_connected);

        // Real-time API check removed as we rely on database status and webhooks

      } catch (err) {
        console.error('Error checking whatsapp status:', err);
      } finally {
        setLoading(false);
      }
    };

    // Check immediately
    checkStatus();

    // Polling every 5 seconds
    const interval = setInterval(checkStatus, 5000);

    // Also subscribe to changes for immediate update
    const channel = supabase
      .channel(`agency-status-${agencyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agencies',
          filter: `id=eq.${agencyId}`,
        },
        (payload) => {
          if (payload.new) {
            setIsConnected(!!payload.new.whatsapp_connected);
            if (payload.new.evolution_instance_name) {
               setInstanceName(payload.new.evolution_instance_name);
            }
            setLoading(false);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [agencyId]);

  return { isConnected, loading, instanceName };
}
