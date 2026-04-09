import { supabase } from '@/integrations/supabase/client';
import { sendWhatsAppNotification } from './evolution';

type NotificationType = 'creation' | 'due_date' | 'overdue' | 'pending_approval' | 'stale_approval' | 'no_update' | 'mention';

export async function logAndNotify(taskId: string, type: NotificationType, phone: string, message: string) {
  if (!phone || !message) return;

  // Check if we already sent this specific notification for this task today (or at all for 'creation')
  const { data: existing } = await (supabase
    .from('notification_logs' as any) as any)
    .select('id')
    .eq('task_id', taskId)
    .eq('type', type)
    .eq('recipient_phone', phone)
    .maybeSingle();

  // If it's a creation or pending_approval, we only notify once
  if (existing && (type === 'creation' || type === 'pending_approval')) {
    return;
  }

  // For others, we might want to check the date (e.g. only once per day)
  if (existing && ['due_date', 'overdue', 'stale_approval', 'no_update'].includes(type)) {
     // Check if sent in the last 24h
     const { data: recent } = await (supabase
       .from('notification_logs' as any) as any)
       .select('sent_at')
       .eq('task_id', taskId)
       .eq('type', type)
       .gt('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
       .maybeSingle();
     
     if (recent) return;
  }

  try {
    const success = await sendWhatsAppNotification(phone, message);
    if (success) {
      await (supabase.from('notification_logs' as any) as any).insert({
        task_id: taskId,
        type,
        recipient_phone: phone,
      });
      
      // Update task's last_notified_at
      await (supabase.from('tasks' as any) as any).update({ last_notified_at: new Date().toISOString() } as any).eq('id', taskId);
    }
  } catch (err) {
    console.error('Failed to send/log notification:', err);
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

  // Anti-spam: verifica se já notificamos este usuário para este comentário específico
  const { data: existing } = await (supabase
    .from('notification_logs' as any) as any)
    .select('id')
    .eq('comment_id', commentId)
    .eq('recipient_phone', phone)
    .eq('type', 'mention')
    .maybeSingle();

  if (existing) return; // Já enviado, pula silenciosamente

  try {
    const success = await sendWhatsAppNotification(phone, message);
    if (success) {
      await (supabase.from('notification_logs' as any) as any).insert({
        task_id: taskId,
        comment_id: commentId,
        type: 'mention',
        recipient_phone: phone,
      });
    }
  } catch (err) {
    console.error('Failed to send/log mention notification:', err);
  }
}
