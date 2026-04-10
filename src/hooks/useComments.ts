import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logAndNotifyMention } from '@/lib/notifications';
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
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:profiles!comments_user_id_fkey(id, full_name, phone)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as (Comment & { user: Profile })[];
    },
    enabled: !!taskId,
  });

  const addComment = useMutation({
    mutationFn: async ({ text, task, authorName, projectName }: AddCommentPayload) => {
      if (!user || !taskId) throw new Error('Missing context');

      // Insert the comment and get back its generated ID
      const { data: inserted, error } = await supabase
        .from('comments')
        .insert({ task_id: taskId, user_id: user.id, text })
        .select('id')
        .single();
      if (error) throw error;

      const commentId = inserted.id;

      // Fetch team members for mention resolution
      const { data: teamData } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('agency_id', task.agency_id);

      const team = (teamData || []) as Profile[];
      const mentionedUsers = extractMentions(text, team);

      // Fire-and-forget notifications for each mentioned user
      for (const member of mentionedUsers) {
        // Don't notify the author if they mention themselves
        if (member.id === user.id) continue;
        if (!member.phone) continue;

        const message =
          `💬 *Você foi mencionado!*\n\n` +
          `👤 *Por:* ${authorName}\n` +
          `📋 *Tarefa:* ${task.title}\n` +
          `🗂️ *Projeto:* ${projectName}\n\n` +
          `_"${text.replace(/_/g, ' ')}"_\n\n` +
          `Acesse o Kanba para responder.`;

        // Non-blocking — don't await to keep UI snappy
        logAndNotifyMention(commentId, taskId, member.phone, message).catch(
          (err) => console.error('[mention notification]', err)
        );
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', taskId] }),
  });

  return { ...query, addComment };
}
