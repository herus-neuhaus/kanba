import { apiClient } from '@/lib/api/client';

export async function sendWhatsAppNotification(phone: string, message: string, agencyId: string): Promise<boolean> {
  try {
    const response = await apiClient<{ success: boolean }>('/integrations/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ phone, message }),
      // Pass agencyId in headers since it's required for checking activeAgency
      headers: {
        'X-Agency-Id': agencyId,
      }
    });

    return response.success;
  } catch (error) {
    console.error('Failed to send WhatsApp notification via backend:', error);
    return false;
  }
}

