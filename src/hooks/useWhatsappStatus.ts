import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

export function useWhatsappStatus(agencyId: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [instanceName, setInstanceName] = useState<string | null>(null);

  useEffect(() => {
    if (!agencyId) return;

    let isMounted = true;

    const checkStatus = async () => {
      try {
        const data = await apiClient<{ whatsappConnected: boolean; evolutionInstanceName: string | null }>('/integrations/whatsapp/status');
        
        if (isMounted) {
          setInstanceName(data.evolutionInstanceName);
          setIsConnected(!!data.whatsappConnected);
        }
      } catch (err) {
        console.error('Error checking whatsapp status:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Check immediately
    checkStatus();

    // Polling every 5 seconds
    const interval = setInterval(checkStatus, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [agencyId]);

  return { isConnected, loading, instanceName };
}
