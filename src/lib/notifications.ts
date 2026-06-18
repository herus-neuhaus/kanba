import { apiClient } from './api/client';

type NotificationType = 'creation' | 'due_date' | 'overdue' | 'pending_approval' | 'stale_approval' | 'no_update' | 'mention';

export async function logAndNotify(taskId: string, type: NotificationType, phone: string, message: string) {
  if (!phone || !message) return;

  try {
    await apiClient('/notifications/notify', {
      method: 'POST',
      body: JSON.stringify({
        taskId,
        type,
        phone,
        message,
      }),
    });
  } catch (err) {
    console.error('Failed to send/log notification via API:', err);
  }
}

/**
 * Envia e registra uma notificação de menção (@) com deduplicação por comment_id.
 * Garante que o mesmo comentário não gera múltiplos disparos para o mesmo usuário.
 */
export async function logAndNotifyMention(
  commentId: string,
  taskId: string,
  phone: string,
  message: string
): Promise<void> {
  if (!phone || !message || !commentId) return;

  try {
    await apiClient('/notifications/mention', {
      method: 'POST',
      body: JSON.stringify({
        commentId,
        taskId,
        phone,
        message,
      }),
    });
  } catch (err) {
    console.error('Failed to send/log mention notification via API:', err);
  }
}

