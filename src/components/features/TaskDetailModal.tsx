import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
import { useAuth } from '@/hooks/useAuth';
import { KANBAN_COLUMNS, DEMAND_TYPES } from '@/types';
import { Send, Plus, Trash2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sendWhatsAppNotification } from '@/lib/evolution';
import type { Task, Profile, ChecklistItem } from '@/types';

interface Props {
  task: Task;
  team: Profile[];
  open: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ task, team, open, onClose }: Props) {
  const { updateTask, deleteTask } = useTasks(task.project_id || undefined);
  const { agency } = useAuth();
  const { data: comments = [], addComment } = useComments(task.id);
  const [commentText, setCommentText] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const { toast } = useToast();

  const currentDemandTypes = agency?.demand_types || (DEMAND_TYPES as unknown as string[]);

  // Local state for the task to make editing feel instant and support "Save and Exit"
  const [cardData, setCardData] = useState<Task>(task);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    setCardData(task);
  }, [task.id]); // Update if id changes, but keep local for edits

  const updateCardLocal = (updates: Partial<Task>) => {
    setCardData(prev => ({ ...prev, ...updates }));
  };

  const handleSaveAndExit = async () => {
    try {
      const { assignee, project, comments, created_at, ...payload } = cardData;
      
      // Convert unassigned back to null
      let newAssigneeId = payload.assignee_id;
      if (newAssigneeId === 'unassigned') {
        newAssigneeId = null;
        payload.assignee_id = null;
      }

      const hasAssigneeChanged = task.assignee_id !== newAssigneeId;

      await updateTask.mutateAsync(payload as any);
      
      // Notify new assignee
      if (hasAssigneeChanged && newAssigneeId) {
        const newAssignee = team.find(m => m.id === newAssigneeId);
        if (newAssignee?.phone) {
          const message = `📋 *Nova Demanda Atribuída*\n\nOlá ${newAssignee.full_name}!\nVocê foi atribuído como responsável pela demanda: *${task.title}*.\n\nConfira no Painel da Agência.`;
          sendWhatsAppNotification(newAssignee.phone, message);
        }
      }

      toast({ title: 'Alterações salvas' });
      onClose();
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    }
  };

  const checklist: ChecklistItem[] = (cardData.checklist as ChecklistItem[]) || [];

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    const item: ChecklistItem = { id: crypto.randomUUID(), text: newCheckItem, done: false };
    updateCardLocal({ checklist: [...checklist, item] });
    setNewCheckItem('');
  };

  const toggleCheckItem = (itemId: string) => {
    updateCardLocal({ 
      checklist: checklist.map(i => i.id === itemId ? { ...i, done: !i.done } : i) 
    });
  };

  const updateCheckItemText = (itemId: string, newText: string) => {
    updateCardLocal({ 
      checklist: checklist.map(i => i.id === itemId ? { ...i, text: newText } : i) 
    });
    setEditingItemId(null);
  };

  const removeCheckItem = (itemId: string) => {
    updateCardLocal({ 
      checklist: checklist.filter(i => i.id !== itemId) 
    });
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
    try {
      await deleteTask.mutateAsync(task.id);
      onClose();
      toast({ title: 'Demanda excluída' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-xl pr-6 font-bold">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">
          {/* Tipo, Prioridade, Status & Assignee */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase px-1">Tipo</label>
              <Select 
                value={cardData.labels?.[0] || (currentDemandTypes[0] || 'Geral')} 
                onValueChange={v => updateCardLocal({ labels: [v, ...(cardData.labels?.slice(1) || [])] })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currentDemandTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase px-1">Prioridade</label>
              <Select value={cardData.priority || 'baixa'} onValueChange={(v: any) => updateCardLocal({ priority: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta" className="text-destructive font-bold text-xs">🔴 Alta</SelectItem>
                  <SelectItem value="media" className="text-warning font-bold text-xs">🟡 Média</SelectItem>
                  <SelectItem value="baixa" className="text-accent font-bold text-xs">🟢 Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase px-1">Status</label>
              <Select value={cardData.status || 'backlog'} onValueChange={v => updateCardLocal({ status: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KANBAN_COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase px-1">Responsável</label>
              <Select value={cardData.assignee_id || ''} onValueChange={v => updateCardLocal({ assignee_id: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sem responsável" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="unassigned">Sem responsável</SelectItem>
                   {team.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase px-1">Data de Entrega</label>
              <Input type="date" className="w-full" value={cardData.due_date || ''} onChange={e => updateCardLocal({ due_date: e.target.value || null })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase px-1">Descrição</label>
            <BalanceTextarea
              placeholder="Adicione uma descrição mais detalhada para esta demanda..."
              value={cardData.description || ''}
              onChange={e => updateCardLocal({ description: e.target.value })}
              rows={3}
            />
          </div>

          <Separator />

          {/* Checklist */}
          <div className="space-y-3">
            <h4 className="font-bold flex items-center gap-2">Checklist</h4>
            <div className="space-y-1">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-3 group px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
                  <Checkbox checked={item.done} onCheckedChange={() => toggleCheckItem(item.id)} />
                  
                  {editingItemId === item.id ? (
                    <Input 
                      className="h-8 flex-1"
                      autoFocus
                      defaultValue={item.text} 
                      onBlur={(e) => updateCheckItemText(item.id, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && updateCheckItemText(item.id, e.currentTarget.value)}
                    />
                  ) : (
                    <span 
                      onClick={() => setEditingItemId(item.id)}
                      className={`flex-1 text-sm cursor-pointer ${item.done ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {item.text}
                    </span>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10" 
                    onClick={() => removeCheckItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 pt-2 px-1">
                <Input 
                  placeholder="Adicionar novo item..." 
                  className="h-9 flex-1"
                  value={newCheckItem} 
                  onChange={e => setNewCheckItem(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCheckItem())} 
                />
                <Button variant="outline" size="sm" onClick={addCheckItem} className="h-9 px-3">
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Comments */}
          <div className="space-y-3">
            <h4 className="font-bold">Comentários</h4>
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
              {comments.length === 0 && <p className="text-sm text-muted-foreground italic px-2">Nenhum comentário ainda.</p>}
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                      {c.user?.full_name?.substring(0, 2)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted/30 p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold">{c.user?.full_name}</span>
                      {c.created_at && <span className="text-[10px] text-muted-foreground">
                        {format(new Date(c.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>}
                    </div>
                    <p className="text-sm text-foreground/90">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 bg-muted p-2 rounded-lg border">
              <Input 
                placeholder="Escreva algo..." 
                className="flex-1 bg-background border-none focus-visible:ring-0" 
                value={commentText} 
                onChange={e => setCommentText(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleComment())} 
              />
              <Button size="sm" onClick={handleComment} disabled={addComment.isPending || !commentText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/40 border-t flex items-center justify-between sm:justify-between w-full">
          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" /> Excluir Demanda
          </Button>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={onClose}>
                Cancelar
             </Button>
             <Button onClick={handleSaveAndExit} disabled={updateTask.isPending} className="shadow-md">
                <Save className="h-4 w-4 mr-2" /> {updateTask.isPending ? 'Salvando...' : 'Salvar e Sair'}
             </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Utility to handle textareas without jumping
function BalanceTextarea({ className, onChange, ...props }: any) {
  return (
    <Textarea 
      className={`resize-none min-h-[100px] ${className}`}
      onChange={onChange}
      {...props}
    />
  );
}
