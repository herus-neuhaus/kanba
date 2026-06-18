import { db } from '../db';
import { tasks, projects, profiles, kanbanColumns } from '../db/schema';
import { eq, isNotNull, and, ne } from 'drizzle-orm';
import { NotificationService } from '../services/notifications/NotificationService';
import { env } from '../config/env';
import { isToday, isBefore, startOfDay, parseISO, differenceInDays } from 'date-fns';

export async function checkTaskAutomations(agencyId: string) {
  try {
    const now = new Date();

    const tasksList = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        projectId: tasks.projectId,
        createdAt: tasks.createdAt,
        lastNotifiedAt: tasks.lastNotifiedAt,
        columnId: tasks.columnId,
        projectName: projects.name,
        columnIsDone: kanbanColumns.isDone,
        assigneeId: tasks.assigneeIds, // This is an array, we'll just check the first one for simplicity or we can do a proper join later if needed
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(kanbanColumns, eq(tasks.columnId, kanbanColumns.id))
      .where(and(eq(tasks.agencyId, agencyId), isNotNull(tasks.assigneeIds)));

    if (!tasksList || tasksList.length === 0) return;

    for (const task of tasksList) {
      if (task.columnIsDone) continue; // Skip completed tasks

      const assigneeIds = task.assigneeId as string[] | null;
      if (!assigneeIds || assigneeIds.length === 0) continue;

      // Get first assignee phone
      const [assigneeObj] = await db
        .select({ phone: profiles.phone, fullName: profiles.fullName })
        .from(profiles)
        .where(eq(profiles.id, assigneeIds[0]));

      if (!assigneeObj?.phone) continue;
      
      const phone = assigneeObj.phone;
      const clientName = task.projectName || 'Agência';
      const lastUpdate = task.lastNotifiedAt ? new Date(task.lastNotifiedAt) : new Date(task.createdAt || Date.now());
      const daysSinceUpdate = differenceInDays(now, lastUpdate);
      const link = `${env.CORS_ORIGIN}/t/${task.id}`;

      // 1. Due Today
      if (task.dueDate && isToday(new Date(task.dueDate))) {
        const msg = `⏰ *Lembrete de Prazo*\n\nOlá ${assigneeObj.fullName}!\nHoje é o prazo final da demanda: *${task.title}*\nProjeto: *${clientName}*\n\n👉 *Acesse direto a tarefa aqui:*\n🔗 ${link}`;
        await NotificationService.logAndNotify(task.id, 'due_date', phone, msg);
      }

      // 2. Overdue
      if (task.dueDate && isBefore(new Date(task.dueDate), startOfDay(now))) {
        const msg = `⚠️ *URGENTE: Demanda Atrasada*\n\nOlá ${assigneeObj.fullName}!\nA demanda *${task.title}* do projeto *${clientName}* está atrasada desde *${new Date(task.dueDate).toLocaleDateString('pt-BR')}*.\n\n👉 *Acesse direto a tarefa aqui:*\n🔗 ${link}`;
        await NotificationService.logAndNotify(task.id, 'overdue', phone, msg);
      }

      // 3. Stale in Approval (2 days)
      // We don't have a direct 'status' column anymore if we use kanbanColumns, we'd check if the column title is 'Aprovação' or similar. For now we skip unless it's strictly a status.
      // If there's no status column, we'll just check "No update"
      if (daysSinceUpdate >= 2) {
        const msg = `🔄 *Demanda Parada*\n\nOlá ${assigneeObj.fullName}!\nA demanda *${task.title}* do projeto *${clientName}* está sem atualizações há mais de 2 dias.\n\n👉 *Acesse direto a tarefa aqui:*\n🔗 ${link}`;
        await NotificationService.logAndNotify(task.id, 'no_update', phone, msg);
      }
    }
  } catch (err) {
    console.error('Error in task automations:', err);
  }
}
