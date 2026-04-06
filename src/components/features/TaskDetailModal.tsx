import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useTasks } from '@/hooks/useTasks';
import { useComments } from '@/hooks/useComments';
import { useToast } from '@/hooks/use-toast';
import { KANBAN_COLUMNS } from '@/types';
import { Send, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Task, Profile, ChecklistItem } from '@/types';

interface Props {
  task: Task;
  team: Profile[];
  open: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ task, team, open, onClose }: Props) {
  const { updateTask, deleteTask } = useTasks(task.project_id || undefined);
  const { data: comments = [], addComment } = useComments(task.id);
  const [commentText, setCommentText] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const { toast } = useToast();

  const handleUpdate = (updates: Record<string, any>) => {
    updateTask.mutate({ id: task.id, ...updates });
  };

  const checklist: ChecklistItem[] = (task.checklist as ChecklistItem[]) || [];

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    const item: ChecklistItem = { id: crypto.randomUUID(), text: newCheckItem, done: false };
    handleUpdate({ checklist: [...checklist, item] });
    setNewCheckItem('');
  };

  const toggleCheckItem = (itemId: string) => {
    handleUpdate({ checklist: checklist.map(i => i.id === itemId ? { ...i, done: !i.done } : i) });
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    // Parse @mentions
    const mentionRegex = /@(\w+)/g;
    const mentions = [...commentText.matchAll(mentionRegex)].map(m => m[1]);
    const mentionedUsers = team.filter(t => mentions.some(m => t.full_name?.toLowerCase().includes(m.toLowerCase())));

    try {
      await addComment.mutateAsync({ text: commentText, mentionedUsers });
      setCommentText('');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    await deleteTask.mutateAsync(task.id);
    onClose();
    toast({ title: 'Tarefa excluída' });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status & Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <Select value={task.status || 'todo'} onValueChange={v => handleUpdate({ status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KANBAN_COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={task.assignee_id || ''} onValueChange={v => handleUpdate({ assignee_id: v })}>
              <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
              <SelectContent>
                {team.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Due date */}
          <Input type="date" value={task.due_date || ''} onChange={e => handleUpdate({ due_date: e.target.value || null })} />

          {/* Description */}
          <Textarea
            placeholder="Adicione uma descrição..."
            defaultValue={task.description || ''}
            onBlur={e => handleUpdate({ description: e.target.value })}
          />

          {/* Labels */}
          <div className="flex flex-wrap gap-1">
            {task.labels?.map(l => <Badge key={l} variant="secondary">{l}</Badge>)}
          </div>

          <Separator />

          {/* Checklist */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Checklist</h4>
            <div className="space-y-2">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox checked={item.done} onCheckedChange={() => toggleCheckItem(item.id)} />
                  <span className={item.done ? 'line-through text-muted-foreground' : ''}>{item.text}</span>
                </div>
              ))}
              <div className="flex gap-2">
                <Input placeholder="Novo item" value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCheckItem())} />
                <Button variant="outline" size="icon" onClick={addCheckItem}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Comments */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Comentários</h4>
            <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                      {c.user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">{c.user?.full_name}</span>
                      {c.created_at && <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), 'dd MMM HH:mm', { locale: ptBR })}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Escreva um comentário... use @nome para mencionar" value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleComment())} />
              <Button variant="outline" size="icon" onClick={handleComment} disabled={addComment.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />
          <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-2" /> Excluir Tarefa</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
