import { db } from '../../db';
import { notificationLogs, tasks, agencies, profiles, inAppNotifications } from '../../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { env } from '../../config/env';

type NotificationType = 'creation' | 'due_date' | 'overdue' | 'pending_approval' | 'stale_approval' | 'no_update' | 'mention';

export class NotificationService {
  static async sendWhatsAppNotification(phone: string, message: string, agencyId: string): Promise<boolean> {
    try {
      const [agency] = await db
        .select({
          evolutionInstanceName: agencies.evolutionInstanceName,
          whatsappConnected: agencies.whatsappConnected,
        })
        .from(agencies)
        .where(eq(agencies.id, agencyId));

      if (!agency?.whatsappConnected || !agency?.evolutionInstanceName) {
        return false;
      }

      const response = await fetch(`${env.EVOLUTION_BASE_URL}/message/sendText/${agency.evolutionInstanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: phone.replace(/\D/g, ''),
          text: message,
        }),
      });

      return response.ok;
    } catch (err) {
      console.error('Failed to send WhatsApp message via Evolution API:', err);
      return false;
    }
  }

  static getTitleForType(type: NotificationType): string {
    switch (type) {
      case 'creation': return 'Nova Tarefa Criada';
      case 'due_date': return 'Prazo de Entrega Próximo';
      case 'overdue': return 'Tarefa Atrasada';
      case 'pending_approval': return 'Aprovação Pendente';
      case 'stale_approval': return 'Lembrete de Aprovação';
      case 'no_update': return 'Tarefa Sem Atualização';
      case 'mention': return 'Você foi Mencionado';
      default: return 'Nova Notificação';
    }
  }

  static async logAndNotify(taskId: string, type: NotificationType, phone: string, message: string) {
    if (!phone || !message) return;

    const existing = await db.query.notificationLogs.findFirst({
      where: and(
        eq(notificationLogs.taskId, taskId),
        eq(notificationLogs.type, type),
        eq(notificationLogs.recipientPhone, phone)
      ),
    });

    if (existing && (type === 'creation' || type === 'pending_approval')) {
      return;
    }

    if (existing && ['due_date', 'overdue', 'stale_approval', 'no_update'].includes(type)) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recent = await db.query.notificationLogs.findFirst({
        where: and(
          eq(notificationLogs.taskId, taskId),
          eq(notificationLogs.type, type),
          eq(notificationLogs.recipientPhone, phone),
          gt(notificationLogs.sentAt, twentyFourHoursAgo)
        ),
      });

      if (recent) return;
    }

    const [taskData] = await db
      .select({ agencyId: tasks.agencyId, projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (!taskData?.agencyId) return;

    // Criar Notificação In-App
    try {
      const [profile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.phone, phone));
      if (profile) {
        await db.insert(inAppNotifications).values({
          agencyId: taskData.agencyId,
          recipientId: profile.id,
          type: type,
          title: this.getTitleForType(type),
          content: message,
          link: taskData.projectId ? `/projetos/${taskData.projectId}/kanban?taskId=${taskId}` : undefined,
        });
      }
    } catch (err) {
      console.error('Failed to create in-app notification:', err);
    }

    try {
      const success = await this.sendWhatsAppNotification(phone, message, taskData.agencyId);
      if (success) {
        await db.insert(notificationLogs).values({
          taskId,
          type,
          recipientPhone: phone,
        });

        await db
          .update(tasks)
          .set({ lastNotifiedAt: new Date() })
          .where(eq(tasks.id, taskId));
      }
    } catch (err) {
      console.error('Failed to send/log notification:', err);
    }
  }

  static async logAndNotifyMention(commentId: string, taskId: string, phone: string, message: string) {
    if (!phone || !message || !commentId) return;

    const existing = await db.query.notificationLogs.findFirst({
      where: and(
        eq(notificationLogs.commentId, commentId),
        eq(notificationLogs.recipientPhone, phone),
        eq(notificationLogs.type, 'mention')
      ),
    });

    if (existing) return;

    const [taskData] = await db
      .select({ agencyId: tasks.agencyId, projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (!taskData?.agencyId) return;

    // Criar Notificação In-App para menção
    try {
      const [profile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.phone, phone));
      if (profile) {
        await db.insert(inAppNotifications).values({
          agencyId: taskData.agencyId,
          recipientId: profile.id,
          type: 'mention',
          title: 'Você foi mencionado',
          content: message,
          link: taskData.projectId ? `/projetos/${taskData.projectId}/kanban?taskId=${taskId}` : undefined,
        });
      }
    } catch (err) {
      console.error('Failed to create in-app mention notification:', err);
    }

    try {
      const success = await this.sendWhatsAppNotification(phone, message, taskData.agencyId);
      if (success) {
        await db.insert(notificationLogs).values({
          taskId,
          commentId,
          type: 'mention',
          recipientPhone: phone,
        });
      }
    } catch (err) {
      console.error('Failed to send/log mention notification:', err);
    }
  }
}
