import { supabase } from '@/integrations/supabase/client';

const EVOLUTION_BASE_URL = import.meta.env.VITE_EVOLUTION_BASE_URL || 'https://evo.overflyia.com.br';

export async function sendWhatsAppNotification(phone: string, message: string): Promise<boolean> {
  try {
    const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;
    if (!apiKey) {
      console.warn('Evolution API key not configured');
      return false;
    }

    const { data: agency } = await supabase
      .from('agencies')
      .select('evolution_instance_name, whatsapp_connected')
      .limit(1)
      .single();

    if (!agency?.whatsapp_connected || !agency?.evolution_instance_name) {
      console.warn('WhatsApp is not connected or instance name is missing');
      return false;
    }

    const response = await fetch(`${EVOLUTION_BASE_URL}/message/sendText/${agency.evolution_instance_name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        number: phone.replace(/\D/g, ''),
        text: message,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
    return false;
  }
}
