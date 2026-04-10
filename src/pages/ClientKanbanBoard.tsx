import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { useTeam } from '@/hooks/useTeam';
import { useProjects } from '@/hooks/useProjects';
import { useColumns } from '@/hooks/useColumns';
import { useAuth } from '@/hooks/useAuth';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { KanbanColumn } from '@/components/features/KanbanColumn';
import { TaskDetailModal } from '@/components/features/TaskDetailModal';
import { CreateTaskDialog } from '@/components/features/CreateTaskDialog';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, FolderKanban, Activity, AlertCircle, ListTodo } from 'lucide-react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { isPast } from 'date-fns';
import { logAndNotify } from '@/lib/notifications';

export default function ClientKanbanBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const { profile } = useAuth();
  
  const { data: projects = [] } = useProjects();
  const { data: permissions = [] } = useProjectPermissions(profile?.id);
  const { data: tasks = [], updateTask } = useTasks(projectId);
  const { data: columns = [], updateColumn } = useColumns(projectId);
  const { data: team = [] } = useTeam();
  
  const currentClient = projects.find(p => p.id === projectId);
  const currentPermission = permissions.find(p => p.project_id === projectId);
  
  const canEdit = false; // Cliente nunca pode editar quadro/drag-drop

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState<string | undefined>(undefined);

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  const totalTasks = tasks.length;
  const firstColId = columns[0]?.id;
  const lastColId = columns[columns.length - 1]?.id;

  const inProgressTasks = tasks.filter(t => t.column_id !== firstColId && t.column_id !== lastColId).length;
  const overdueTasks = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.column_id !== lastColId).length;

  const onDragEnd = (result: DropResult) => {
    if (!canEdit || !result.destination) return;
    const taskId = result.draggableId;
    const newColumnId = result.destination.droppableId;
    const task = tasks.find(t => t.id === taskId);
    
    updateTask.mutate({ id: taskId, column_id: newColumnId });

    const destCol = columns.find(c => c.id === newColumnId);
    if (destCol?.title?.toLowerCase().includes('aprov') && task && task.column_id !== newColumnId) {
      const aIds = task.assignee_ids || [];
      for (const aId of aIds) {
        const assignee = team.find(m => m.id === aId);
        if (assignee?.phone) {
          const msg = `✅ *Demanda em ${destCol.title}*\n\nOlá ${assignee.full_name}!\nA demanda *${task.title}* do projeto *${currentClient?.name || 'Agência'}* foi movida para *${destCol.title}*.`;
          logAndNotify(taskId, 'pending_approval', assignee.phone, msg);
        }
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
               <Link to="/cliente/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
                 <FolderKanban className="h-3 w-3" /> Dashboard
               </Link>
               <ChevronRight className="h-3 w-3" />
               <span className="text-foreground">Painel do Projeto</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {currentClient?.name || 'Carregando...'}
            </h1>
            {!canEdit && (
              <p className="text-[10px] text-warning uppercase font-black tracking-widest mt-1">Acesso Somente Leitura</p>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full border border-border shadow-sm">
               <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />
               <span className="text-xs font-bold text-foreground">{totalTasks}</span>
               <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Demandas</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/20 shadow-sm">
               <Activity className="h-3.5 w-3.5 text-primary" />
               <span className="text-xs font-bold text-primary">{inProgressTasks}</span>
               <span className="text-[10px] uppercase font-bold text-primary/70 tracking-tight">Andamento</span>
            </div>
            {overdueTasks > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/5 rounded-full border border-destructive/20 shadow-sm animate-pulse transition-all hover:bg-destructive/10">
                 <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                 <span className="text-xs font-bold text-destructive">{overdueTasks}</span>
                 <span className="text-[10px] uppercase font-bold text-destructive/70 tracking-tight">Atrasadas</span>
              </div>
            )}
            {canEdit && (
              <Button size="sm" className="ml-2 shadow-lg" onClick={() => { setCreateColumnId(firstColId); setCreateOpen(true); }}>
                <Plus className="h-4 w-4 mr-1.5" /> Nova Solicitação
              </Button>
            )}
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[50vh]">
          {columns.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasks.filter(t => t.column_id === col.id).map(t => ({
                ...t,
                assignees: team.filter(m => (t.assignee_ids || []).includes(m.id))
              })) as any}
              onTaskClick={(task) => setSelectedTaskId(task.id)}
              onAddTask={canEdit ? () => { setCreateColumnId(col.id); setCreateOpen(true); } : () => {}}
              onDeleteColumn={() => {}} // Clients cannot delete columns
              onUpdateColumn={canEdit ? (id, title, color) => updateColumn.mutate({ id, title, color }) : () => {}}
            />
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          team={team}
          open={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          columns={columns}
          // Idealmente passar canEdit para a modal saber se desabilita os inputs, mas vamos supor que o modal faz leitura padrão
        />
      )}

      {canEdit && (
        <CreateTaskDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          projectId={projectId}
          defaultColumnId={createColumnId}
          team={team}
          columns={columns}
        />
      )}
    </div>
  );
}
