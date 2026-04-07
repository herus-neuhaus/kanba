import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { useTeam } from '@/hooks/useTeam';
import { useProjects } from '@/hooks/useProjects';
import { KANBAN_COLUMNS } from '@/types';
import { KanbanColumn } from '@/components/features/KanbanColumn';
import { TaskDetailModal } from '@/components/features/TaskDetailModal';
import { CreateTaskDialog } from '@/components/features/CreateTaskDialog';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, FolderKanban, Activity, AlertCircle, ListTodo } from 'lucide-react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { isPast } from 'date-fns';
import { logAndNotify } from '@/lib/notifications';
import type { Task } from '@/types';

export default function KanbanBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [], updateTask } = useTasks(projectId);
  const { data: team = [] } = useTeam();
  
  const currentClient = projects.find(p => p.id === projectId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState('backlog');

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status !== 'backlog' && t.status !== 'done').length;
  const overdueTasks = tasks.filter(t => 
    t.due_date && 
    isPast(new Date(t.due_date)) && 
    t.status !== 'done'
  ).length;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const task = tasks.find(t => t.id === taskId);
    
    updateTask.mutate({ id: taskId, status: newStatus });

    // Notification for "Em Aprovação"
    if (newStatus === 'approval' && task && task.status !== 'approval') {
      const assignee = team.find(m => m.id === task.assignee_id);
      if (assignee?.phone) {
        const msg = `✅ *Demanda em Aprovação*\n\nOlá ${assignee.full_name}!\nA demanda *${task.title}* do cliente *${currentClient?.name || 'Agência'}* foi movida para *Em Aprovação*.`;
        logAndNotify(taskId, 'pending_approval', assignee.phone, msg);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4">
        {/* Breadcrumb & Summary Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
               <Link to="/projects" className="hover:text-primary transition-colors flex items-center gap-1">
                 <FolderKanban className="h-3 w-3" /> Clientes
               </Link>
               <ChevronRight className="h-3 w-3" />
               <span className="text-foreground">Quadro Kanban</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {currentClient?.name || 'Carregando...'}
            </h1>
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
            <Button size="sm" className="ml-2 shadow-lg" onClick={() => { setCreateStatus('backlog'); setCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Nova Demanda
            </Button>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasks.filter(t => (t.status || 'backlog') === col.id)}
              onTaskClick={(task) => setSelectedTaskId(task.id)}
              onAddTask={() => { setCreateStatus(col.id); setCreateOpen(true); }}
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
        />
      )}

      <CreateTaskDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={projectId}
        defaultStatus={createStatus}
        team={team}
      />
    </div>
  );
}
