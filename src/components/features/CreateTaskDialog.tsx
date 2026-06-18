import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { DEMAND_TYPES } from '@/types';
import { logAndNotify } from '@/lib/notifications';
import { format } from 'date-fns';
import { generateTaskLink } from '@/lib/urls';
import { X, PlusCircle, Type, AlignLeft, UserCircle, Calendar, Clock } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import type { Profile, KanbanColumn } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  defaultColumnId?: string;
  team: Profile[];
  columns: KanbanColumn[];
}

export function CreateTaskDialog({ open, onClose, projectId, defaultColumnId, team, columns }: Props) {
  const { agency } = useAuth();
  const { createTask } = useTasks(projectId);
  const { data: projects = [] } = useProjects();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Set first column ID as default if none given
  const defaultCol = defaultColumnId || columns[0]?.id || '';
  const [columnId, setColumnId] = useState(defaultCol);
  
  const currentDemandTypes = agency?.demand_types || (DEMAND_TYPES as unknown as string[]);
  const [demandType, setDemandType] = useState<string>(currentDemandTypes[0] || 'Geral');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baixa'>('baixa');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setColumnId(defaultColumnId || columns[0]?.id || '');
    }
  }, [open, defaultColumnId, columns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!columnId) {
      toast({ title: 'Aviso', description: 'Por favor, selecione uma coluna.', variant: 'destructive' });
      return;
    }
    if (assigneeIds.length === 0) {
      toast({ title: 'Aviso', description: 'Por favor, atribua pelo menos um responsável.', variant: 'destructive' });
      return;
    }

    try {
      const newTask = await createTask.mutateAsync({
        title,
        description: description || undefined,
        column_id: columnId,
        priority,
        project_id: projectId,
        assignee_ids: assigneeIds,
        due_date: dueDate ? new Date(`${dueDate}T${dueTime || '23:59'}:00`).toISOString() : undefined,
        labels: [demandType],
      });

      // Notifications for all assignees
      if (assigneeIds.length > 0 && newTask) {
        for (const aId of assigneeIds) {
          const assignee = team.find(m => m.id === aId);
          const project = projects.find(p => p.id === projectId);
          if (assignee?.phone) {
            const dateStr = format(new Date(`${dueDate}T${dueTime || '23:59'}:00`), 'dd/MM/yyyy HH:mm');
            const link = generateTaskLink(projectId!, newTask.id);
            const msg = `📋 *Nova Demanda Recebida*\n\nOlá ${assignee.full_name}!\nVocê foi atribuído a uma demanda: *${title}*\nProjeto: *${project?.name || 'Agência'}*\nPrazo: *${dateStr}*\n\n👉 *Acesse direto a tarefa aqui:*\n🔗 ${link}`;
            logAndNotify(newTask.id, 'creation', assignee.phone, msg);
          }
        }
      }

      setTitle(''); setDescription(''); setAssigneeIds([]); setDueDate('');
      onClose();
      toast({ title: 'Demanda criada!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <PlusCircle className="h-5 w-5 text-primary" />
            </div>
            Nova Demanda
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase px-1 text-muted-foreground flex items-center gap-1.5">
              <Type className="h-3 w-3" /> Título
            </label>
            <Input 
              placeholder="Ex: Criativo para Campanha de Verão" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
              className="premium-input"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase px-1 text-muted-foreground">Tipo de Demanda</label>
            <Select value={demandType} onValueChange={setDemandType}>
              <SelectTrigger className="w-full premium-input"><SelectValue /></SelectTrigger>
              <SelectContent>
                {currentDemandTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase px-1 text-muted-foreground">Prioridade</label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger className="w-full premium-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alta" className="text-destructive font-bold">🔴 Alta</SelectItem>
                <SelectItem value="media" className="text-warning font-bold">🟡 Média</SelectItem>
                <SelectItem value="baixa" className="text-accent font-bold">🟢 Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase px-1 text-muted-foreground flex items-center gap-1.5">
              <AlignLeft className="h-3 w-3" /> Descrição
            </label>
            <RichTextEditor 
              content={description} 
              onChange={setDescription} 
              placeholder="Detalhes sobre a demanda..." 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase px-1 text-muted-foreground">Etapa</label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger className="premium-input"><SelectValue placeholder="Coluna" /></SelectTrigger>
                <SelectContent>
                  {columns.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase px-1 text-muted-foreground flex items-center gap-1.5">
                <UserCircle className="h-3 w-3" /> Responsável
              </label>
              <Select onValueChange={(val) => {
                if (!assigneeIds.includes(val)) {
                  setAssigneeIds(prev => [...prev, val]);
                }
              }} value="">
                <SelectTrigger className="premium-input"><SelectValue placeholder="Atribuir..." /></SelectTrigger>
                <SelectContent>
                  {team.filter(m => !assigneeIds.includes(m.id)).map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {assigneeIds.length > 0 && (
            <div className="flex flex-wrap gap-2 py-1">
              {assigneeIds.map(id => {
                const member = team.find(m => m.id === id);
                if (!member) return null;
                return (
                  <div key={id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold shadow-sm transition-all hover:bg-primary/20">
                    <span>{member.full_name}</span>
                    <button type="button" onClick={() => setAssigneeIds(prev => prev.filter(aid => aid !== id))} className="rounded-full hover:bg-primary/30 p-0.5 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-semibold uppercase px-1 text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Prazo de Entrega
              </label>
              <Input 
                type="date" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)} 
                className="premium-input"
              />
            </div>
            <div className="space-y-1.5 w-32">
              <label className="text-xs font-semibold uppercase px-1 text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Hora
              </label>
              <Input 
                type="time" 
                value={dueTime} 
                onChange={e => setDueTime(e.target.value)} 
                className="premium-input"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={createTask.isPending}>Criar Demanda</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
