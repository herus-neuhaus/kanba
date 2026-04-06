const EVOLUTION_BASE_URL = 'https://evo.overflyia.com.br';
const EVOLUTION_INSTANCE = 'KanbaEasy';

export async function sendWhatsAppNotification(phone: string, message: string): Promise<boolean> {
  try {
    const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;
    if (!apiKey) {
      console.warn('Evolution API key not configured');
      return false;
    }

    const response = await fetch(`${EVOLUTION_BASE_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
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
