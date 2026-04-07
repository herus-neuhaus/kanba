import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { sendWhatsAppNotification } from '@/lib/evolution';
import type { Comment, Profile } from '@/types';

export function useComments(taskId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase.from('comments').select('*, user:profiles!comments_user_id_fkey(id, full_name, phone)').eq('task_id', taskId).order('created_at', { ascending: true });
      if (error) throw error;
      return data as (Comment & { user: Profile })[];
    },
    enabled: !!taskId,
  });

  const addComment = useMutation({
    mutationFn: async ({ text, mentionedUsers }: { text: string; mentionedUsers?: Profile[] }) => {
      if (!user || !taskId) throw new Error('Missing context');
      const { error } = await supabase.from('comments').insert({ task_id: taskId, user_id: user.id, text });
      if (error) throw error;

      // Send WhatsApp notifications for @mentions
      if (mentionedUsers?.length) {
        for (const u of mentionedUsers) {
          if (u.phone) {
            await sendWhatsAppNotification(u.phone, `📋 Kanba: Você foi mencionado em um comentário:\n\n"${text}"`);
          }
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', taskId] }),
  });

  return { ...query, addComment };
}
