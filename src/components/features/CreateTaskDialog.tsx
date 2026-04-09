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
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
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

    try {
      const newTask = await createTask.mutateAsync({
        title,
        description: description || undefined,
        column_id: columnId,
        priority,
        project_id: projectId,
        assignee_id: assigneeId || undefined,
        due_date: dueDate || undefined,
        labels: [demandType],
      });

      // Notification
      if (assigneeId && newTask) {
        const assignee = team.find(m => m.id === assigneeId);
        const project = projects.find(p => p.id === projectId);
        if (assignee?.phone) {
          const dateStr = dueDate ? format(new Date(dueDate), 'dd/MM/yyyy') : 'Sem data';
          const msg = `📋 *Nova Demanda Recebida*\n\nOlá ${assignee.full_name}!\nVocê recebeu uma nova demanda: *${title}*\nCliente: *${project?.name || 'Agência'}*\nPrazo: *${dateStr}*\n\nConfira no painel!`;
          logAndNotify(newTask.id, 'creation', assignee.phone, msg);
        }
      }

      setTitle(''); setDescription(''); setAssigneeId(''); setDueDate('');
      onClose();
      toast({ title: 'Demanda criada!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Demanda</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Título da demanda" value={title} onChange={e => setTitle(e.target.value)} required />
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase px-1 text-muted-foreground">Tipo de Demanda</label>
            <Select value={demandType} onValueChange={setDemandType}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {currentDemandTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase px-1 text-muted-foreground">Prioridade</label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alta" className="text-destructive font-bold">🔴 Alta</SelectItem>
                <SelectItem value="media" className="text-warning font-bold">🟡 Média</SelectItem>
                <SelectItem value="baixa" className="text-accent font-bold">🟢 Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea placeholder="Descrição (opcional)" value={description} onChange={e => setDescription(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Select value={columnId} onValueChange={setColumnId}>
              <SelectTrigger><SelectValue placeholder="Coluna" /></SelectTrigger>
              <SelectContent>
                {columns.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
              <SelectContent>
                {team.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          <Button type="submit" className="w-full" disabled={createTask.isPending}>Criar Demanda</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
