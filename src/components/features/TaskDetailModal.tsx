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
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { toast as sonnerToast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useTasks } from '@/hooks/useTasks';
import { useComments } from '@/hooks/useComments';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { DEMAND_TYPES } from '@/types';
import { Send, Plus, Trash2, Save, X, Layout, Users, Calendar, AlignLeft, CheckSquare, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sendWhatsAppNotification } from '@/lib/evolution';
import { generateTaskLink } from '@/lib/urls';
import { renderTextWithMentions } from '@/lib/mentions';
import { MentionInput } from './MentionInput';
import { renderTextWithLinks } from '@/lib/linkify';
import { RichTextEditor } from './RichTextEditor';
import type { Task, Profile, ChecklistItem } from '@/types';

interface Props {
  task: Task;
  team: Profile[];
  open: boolean;
  onClose: () => void;
  columns: { id: string; title: string; color?: string }[];
}

export function TaskDetailModal({ task, team, open, onClose, columns }: Props) {
  const { updateTask, deleteTask } = useTasks(task.project_id || undefined);
  const { agency, profile } = useAuth();
  const { data: comments = [], addComment } = useComments(task.id);
  const [commentText, setCommentText] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const { toast } = useToast();
  const qc = useQueryClient();

  const currentDemandTypes = agency?.demand_types || (DEMAND_TYPES as unknown as string[]);

  const [cardData, setCardData] = useState<Task>(task);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  
  const isClient = profile?.role === 'client';

  useEffect(() => {
    setCardData(task);
  }, [task.id]);

  const updateCardLocal = (updates: Partial<Task>) => {
    setCardData(prev => ({ ...prev, ...updates }));
  };

  const handleSaveAndExit = async () => {
    try {
      const { assignees, project, column, comments, created_at, ...payload } = cardData;

      // Combine date and time
      if (payload.due_date && payload.due_date.length === 10) {
        // Find existing time or default to 23:59:59
        const timeInput = (document.getElementById('due-time') as HTMLInputElement)?.value || '23:59';
        payload.due_date = new Date(`${payload.due_date}T${timeInput}:00`).toISOString();
      }

      if (!payload.assignee_ids || payload.assignee_ids.length === 0) {
        toast({ title: 'Aviso', description: 'Por favor, atribua pelo menos um responsável.', variant: 'destructive' });
        return;
      }

      const oldAssignees = task.assignee_ids || [];
      const newAssignees = payload.assignee_ids || [];
      const newlyAssigned = newAssignees.filter(id => !oldAssignees.includes(id));

      await updateTask.mutateAsync(payload as any);

      for (const newAssigneeId of newlyAssigned) {
        const newAssignee = team.find(m => m.id === newAssigneeId);
          const link = generateTaskLink(task.project_id!, task.id);
          const message = `📋 *Nova Demanda Atribuída*\n\nOlá ${newAssignee.full_name}!\nVocê foi atribuído como responsável pela demanda: *${task.title}*.\n\n👉 *Acesse direto a tarefa aqui:*\n🔗 ${link}`;
          sendWhatsAppNotification(newAssignee.phone, message, task.agency_id);
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

    try {
      await addComment.mutateAsync({
        text: commentText,
        task: cardData,
        authorName: profile?.full_name || 'Alguém',
        projectName: task.project?.name || 'Projeto',
      });
      setCommentText('');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    // 1. Prepare for optimistic update
    const queryKey = ['tasks', agency?.id, task.project_id];
    const previousTasks = qc.getQueryData<Task[]>(queryKey);

    // 2. Close modal immediately
    onClose();

    // 3. Optimistic update: remove task from cache
    if (previousTasks) {
      qc.setQueryData<Task[]>(queryKey, old => old?.filter(t => t.id !== task.id));
    }

    // 4. Set timeout for permanent deletion
    const timeoutId = setTimeout(async () => {
      try {
        await deleteTask.mutateAsync(task.id);
      } catch (err: any) {
        // If permanent delete fails, restore the cache
        qc.setQueryData(queryKey, previousTasks);
        sonnerToast.error(`Erro ao excluir permanentemente: ${err.message}`);
      }
    }, 5000);

    // 5. Show toast with Undo action
    sonnerToast.info("Demanda excluída", {
      description: "Você tem 5 segundos para desfazer esta ação.",
      duration: 5000,
      action: {
        label: "Desfazer",
        onClick: () => {
          clearTimeout(timeoutId);
          qc.setQueryData(queryKey, previousTasks);
          sonnerToast.success("Ação desfeita com sucesso!");
        },
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex-1 pr-6">
            {isEditingTitle && !isClient ? (
              <Textarea
                autoFocus
                className="text-xl font-bold bg-muted/30 border-primary/20 p-2 focus-visible:ring-1 focus-visible:ring-primary/30 h-auto min-h-[40px] resize-none"
                value={cardData.title}
                onChange={e => updateCardLocal({ title: e.target.value })}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    setIsEditingTitle(false);
                  }
                }}
              />
            ) : (
              <div 
                onDoubleClick={() => !isClient && setIsEditingTitle(true)}
                className={`text-xl font-bold p-0 border-none bg-transparent cursor-text min-h-[1.5em] leading-tight break-words ${!isClient ? 'hover:bg-muted/30 rounded px-1 -mx-1 transition-colors' : ''}`}
                title={!isClient ? "Clique duas vezes para editar" : ""}
              >
                {cardData.title}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">
          {/* Tipo, Prioridade, Status & Assignee */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase px-1">Tipo</label>
              <Select
                disabled={isClient}
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
              <Select disabled={isClient} value={cardData.priority || 'baixa'} onValueChange={(v: any) => updateCardLocal({ priority: v })}>
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
              <label className="text-xs font-semibold text-muted-foreground uppercase px-1 flex items-center gap-1.5">
                <Layout className="h-3 w-3" /> Coluna
              </label>
              <Select disabled={isClient} value={cardData.column_id || ''} onValueChange={v => updateCardLocal({ column_id: v })}>
                <SelectTrigger className="w-full premium-input"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {columns.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 min-h-[70px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase px-1 flex items-center gap-1.5">
                <Users className="h-3 w-3" /> Responsável
              </label>
              {!isClient && (
                <Select value="" onValueChange={v => {
                   const currentIds = cardData.assignee_ids || [];
                   if (!currentIds.includes(v)) {
                     updateCardLocal({ assignee_ids: [...currentIds, v] });
                   }
                }}>
                  <SelectTrigger className="w-full premium-input"><SelectValue placeholder="Adicionar..." /></SelectTrigger>
                  <SelectContent>
                     {team.filter(m => !(cardData.assignee_ids || []).includes(m.id)).map(m => (
                       <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                     ))}
                  </SelectContent>
                </Select>
              )}
              
              {(cardData.assignee_ids || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(cardData.assignee_ids || []).map(id => {
                    const member = team.find(m => m.id === id);
                    if (!member) return null;
                    return (
                      <div key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold shadow-sm">
                        <span className="truncate max-w-[80px]">{member.full_name?.split(' ')[0]}</span>
                        {!isClient && (
                          <button type="button" onClick={() => updateCardLocal({ assignee_ids: (cardData.assignee_ids || []).filter(aid => aid !== id) })} className="rounded-full hover:bg-primary/30 p-0.5 transition-colors">
                            <X className="h-[10px] w-[10px]" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase px-1 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Data de Entrega
              </label>
              <Input disabled={isClient} type="date" className="w-full premium-input" value={cardData.due_date ? cardData.due_date.substring(0, 10) : ''} onChange={e => updateCardLocal({ due_date: e.target.value || null })} />
            </div>
            <div className="space-y-1.5 w-32">
              <label className="text-xs font-semibold text-muted-foreground uppercase px-1 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Hora
              </label>
              <Input 
                id="due-time"
                disabled={isClient} 
                type="time" 
                className="w-full premium-input" 
                defaultValue={cardData.due_date ? format(new Date(cardData.due_date), 'HH:mm') : '23:59'} 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase px-1 flex items-center gap-1.5">
              <AlignLeft className="h-3 w-3" /> Descrição
            </label>
            {isEditingDescription && !isClient ? (
              <div className="flex flex-col gap-2">
                <RichTextEditor
                  content={cardData.description || ''}
                  onChange={(html) => updateCardLocal({ description: html })}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setIsEditingDescription(false)}>
                    Concluir Edição
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                onDoubleClick={() => !isClient && setIsEditingDescription(true)}
                className={`text-sm leading-relaxed p-2 min-h-[80px] rounded-md transition-colors break-words prose prose-sm dark:prose-invert max-w-none ${!isClient ? 'hover:bg-muted/30 cursor-text' : 'bg-muted/10'}`}
                title={!isClient ? "Clique duas vezes para editar" : ""}
              >
                {cardData.description ? (
                  <div dangerouslySetInnerHTML={{ __html: cardData.description }} />
                ) : (
                  <span className="text-muted-foreground italic">Nenhuma descrição fornecida...</span>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Checklist */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold flex items-center gap-2 underline decoration-primary/30 underline-offset-4">
              <CheckSquare className="h-4 w-4 text-primary" /> Checklist
            </h4>
            <div className="space-y-1">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-3 group px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
                  <Checkbox disabled={isClient} checked={item.done} onCheckedChange={() => toggleCheckItem(item.id)} />

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
                      onClick={() => { if (!isClient) setEditingItemId(item.id); }}
                      className={`flex-1 text-sm ${!isClient && 'cursor-pointer'} ${item.done ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {renderTextWithLinks(item.text)}
                    </span>
                  )}

                  {!isClient && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                      onClick={() => removeCheckItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {!isClient && (
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
              )}
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
                    {/* Render comment with highlighted @mentions */}
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {renderTextWithMentions(c.text).map((part, i) =>
                        part.type === 'mention' ? (
                          <span
                            key={i}
                            className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold"
                          >
                            {part.value}
                          </span>
                        ) : (
                          <span key={i}>{renderTextWithLinks(part.value)}</span>
                        )
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment input with @mention autocomplete */}
            <div className="flex gap-2 bg-muted/50 p-2 rounded-xl border border-border/60 items-end">
              <MentionInput
                value={commentText}
                onChange={setCommentText}
                team={team}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleComment();
                  }
                }}
                className="bg-transparent border-none focus-visible:ring-0 px-1"
              />
              <Button
                size="sm"
                className="shrink-0 h-8 w-8 p-0 shadow-md"
                onClick={handleComment}
                disabled={addComment.isPending || !commentText.trim()}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 px-1">
              Use <kbd className="px-1 py-0.5 rounded bg-muted border text-xs">@</kbd> para mencionar membros · <kbd className="px-1 py-0.5 rounded bg-muted border text-xs">Enter</kbd> para enviar
            </p>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/40 border-t flex flex-row items-center justify-between w-full sm:justify-between">
          {!isClient ? (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" /> Excluir Demanda
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita após o período de 5 segundos. 
                      A demanda "<strong>{task.title}</strong>" será removida permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sim, excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex justify-end gap-2 shrink-0">
                 <Button variant="outline" size="sm" onClick={onClose}>
                    Cancelar
                 </Button>
                 <Button onClick={handleSaveAndExit} disabled={updateTask.isPending} className="shadow-md shrink-0">
                    <Save className="h-4 w-4 mr-2" /> {updateTask.isPending ? 'Salvando...' : 'Salvar e Sair'}
                 </Button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
               <Button variant="outline" size="sm" onClick={onClose}>
                  Fechar
               </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

