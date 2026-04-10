import { supabase } from '@/integrations/supabase/client';
import { logAndNotify } from './notifications';
import { isToday, isBefore, subDays, startOfDay, parseISO, differenceInDays } from 'date-fns';

export async function checkTaskAutomations(agencyId: string) {
  try {
    // Get all incomplete tasks for the agency
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*, project:projects(name), assignee:profiles!tasks_assignee_id_fkey(*)')
      .eq('agency_id', agencyId)
      .not('assignee_id', 'is', null);

    if (error) throw error;
    if (!tasks || tasks.length === 0) return;

    const now = new Date();

    for (const task of tasks) {
      if (!task.assignee?.phone) continue;
      
      const phone = task.assignee.phone;
      const clientName = (task.project as any)?.name || 'Agência';
      const lastUpdate = (task as any).last_notified_at ? new Date((task as any).last_notified_at) : new Date(task.created_at || Date.now());
      const daysSinceUpdate = differenceInDays(now, lastUpdate);

      // 1. Due Today
      if (task.due_date && isToday(parseISO(task.due_date))) {
        const msg = `⏰ *Lembrete de Prazo*\n\nOlá ${task.assignee.full_name}!\nHoje é o prazo final da demanda: *${task.title}*\nProjeto: *${clientName}*\n\nNão esqueça de atualizar!`;
        await logAndNotify(task.id, 'due_date', phone, msg);
      }

      // 2. Overdue
      if (task.due_date && isBefore(parseISO(task.due_date), startOfDay(now))) {
        const msg = `⚠️ *URGENTE: Demanda Atrasada*\n\nOlá ${task.assignee.full_name}!\nA demanda *${task.title}* do projeto *${clientName}* está atrasada desde *${task.due_date}*.\n\nPor favor, prioritize essa entrega!`;
        await logAndNotify(task.id, 'overdue', phone, msg);
      }

      // 3. Stale in Approval (2 days)
      if ((task as any).status === 'approval' && daysSinceUpdate >= 2) {
        const msg = `⏳ *Aguardando Aprovação*\n\nOlá ${task.assignee.full_name}!\nA demanda *${task.title}* do projeto *${clientName}* está pronta para aprovação há 2 dias.\n\nPodemos cobrar o parceiro?`;
        await logAndNotify(task.id, 'stale_approval', phone, msg);
      }

      // 4. No Update (2 days)
      if ((task as any).status !== 'approval' && daysSinceUpdate >= 2) {
        const msg = `🔄 *Demanda Parada*\n\nOlá ${task.assignee.full_name}!\nA demanda *${task.title}* do projeto *${clientName}* está sem atualizações há mais de 2 dias.\n\nComo está o progresso?`;
        await logAndNotify(task.id, 'no_update', phone, msg);
      }
    }
  } catch (err) {
    console.error('Error in task automations:', err);
  }
}
