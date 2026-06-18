import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuth } from './useAuth';
// keep logic to notify via client for now to avoid breaking changes, since we just setup an empty extension point in the backend
import { logAndNotifyMention } from '@/lib/notifications';
import { generateTaskLink } from '@/lib/urls';
import { extractMentions } from '@/lib/mentions';
import type { Comment, Profile, Task } from '@/types';

interface AddCommentPayload {
  text: string;
  task: Task;
  authorName: string;
  projectName: string;
}

export function useComments(taskId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      // Backend now performs the join with profiles
      const comments = await apiClient<(Comment & { user: Profile })[]>(`/tasks/${taskId}/comments`);
      
      return comments;
    },
    enabled: !!taskId,
  });

  const addComment = useMutation({
    mutationFn: async ({ text, task, authorName, projectName }: AddCommentPayload) => {
      if (!user || !taskId) throw new Error('Missing context');

      // Use our backend API
      const inserted = await apiClient<{ id: string }>(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text, authorName, projectName }),
      });

      const commentId = inserted.id;

      // Mantivemos a notificação no frontend conforme instrução:
      // "Preparar ponto de extensão... mas não disparar ainda se isso aumentar risco."
      // Fetch team data from our backend
      const team = await apiClient<Profile[]>('/team');
      const mentionedUsers = extractMentions(text, team);

      for (const member of mentionedUsers) {
        if (member.id === user.id) continue;
        if (!member.phone) continue;

        const link = generateTaskLink(task.project_id!, task.id);
        const message =
          `💬 *Você foi mencionado!*\n\n` +
          `👤 *Por:* ${authorName}\n` +
          `📋 *Tarefa:* ${task.title}\n` +
          `🗂️ *Projeto:* ${projectName}\n\n` +
          `_"${text.replace(/_/g, ' ')}"_\n\n` +
          `👉 *Acesse direto a tarefa aqui:*\n🔗 ${link}`;

        logAndNotifyMention(commentId, taskId, member.phone, message).catch(
          (err) => console.error('[mention notification]', err)
        );
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', taskId] }),
  });

  return { ...query, addComment };
}
