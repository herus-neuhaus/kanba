import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { useTeam } from '@/hooks/useTeam';
import { useProjects } from '@/hooks/useProjects';
import { useColumns } from '@/hooks/useColumns';
import { KanbanColumn } from '@/components/features/KanbanColumn';
import { TaskDetailModal } from '@/components/features/TaskDetailModal';
import { CreateTaskDialog } from '@/components/features/CreateTaskDialog';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, FolderKanban, Activity, AlertCircle, ListTodo, BookOpen, CalendarDays } from 'lucide-react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { isPast } from 'date-fns';
import { logAndNotify } from '@/lib/notifications';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectWiki } from '@/components/features/ProjectWiki';
import { ProjectCalendar } from '@/components/features/ProjectCalendar';

export default function KanbanBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [], updateTask } = useTasks(projectId);
  const { data: columns = [], createColumn, updateColumn, deleteColumn } = useColumns(projectId);
  const { data: team = [] } = useTeam();
  
  const currentClient = projects.find(p => p.id === projectId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState<string | undefined>(undefined);

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  const totalTasks = tasks.length;
  // If no columns yet, we can't properly filter backlog/done
  const firstColId = columns[0]?.id;
  const lastColId = columns[columns.length - 1]?.id;

  const inProgressTasks = tasks.filter(t => t.column_id !== firstColId && t.column_id !== lastColId).length;
  const overdueTasks = tasks.filter(t => 
    t.due_date && 
    isPast(new Date(t.due_date)) && 
    t.column_id !== lastColId
  ).length;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newColumnId = result.destination.droppableId;
    const task = tasks.find(t => t.id === taskId);
    
    updateTask.mutate({ id: taskId, column_id: newColumnId });

    // Notification for "Em Aprovação" logic based on index (assuming index 3 or just checking title for legacy logic)
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

  const handleAddColumn = () => {
    const nextOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order_index)) + 1 : 0;
    createColumn.mutate({
      title: 'Nova Coluna',
      color: 'bg-muted',
      order_index: nextOrder
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4">
        {/* Breadcrumb & Summary Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
               <Link to="/projetos" className="hover:text-primary transition-colors flex items-center gap-1">
                 <FolderKanban className="h-3 w-3" /> Projetos
               </Link>
               <ChevronRight className="h-3 w-3" />
               <span className="text-foreground">Painel do Projeto</span>
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
            <Button size="sm" className="ml-2 shadow-lg" onClick={() => { setCreateColumnId(firstColId); setCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Nova Demanda
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="mb-6 bg-muted/50 w-full justify-start rounded-xl p-1 h-auto overflow-x-auto">
          <TabsTrigger value="kanban" className="rounded-lg gap-2 px-4 py-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FolderKanban className="h-4 w-4" />
            <span className="font-semibold">Quadro Kanban</span>
          </TabsTrigger>
          <TabsTrigger value="wiki" className="rounded-lg gap-2 px-4 py-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <BookOpen className="h-4 w-4" />
            <span className="font-semibold">Wiki / Ideias</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-lg gap-2 px-4 py-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <CalendarDays className="h-4 w-4" />
            <span className="font-semibold">Calendário</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-0 outline-none">
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
                  onAddTask={() => { setCreateColumnId(col.id); setCreateOpen(true); }}
                  onDeleteColumn={(id) => deleteColumn.mutate(id)}
                  onUpdateColumn={(id, title, color) => updateColumn.mutate({ id, title, color })}
                />
              ))}
              
              <Button
                variant="outline"
                className="flex-shrink-0 w-72 h-12 border-dashed flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                onClick={handleAddColumn}
              >
                <Plus className="h-4 w-4" />
                Adicionar Coluna
              </Button>
            </div>
          </DragDropContext>
        </TabsContent>

        <TabsContent value="wiki" className="mt-0 outline-none">
          <ProjectWiki projectId={projectId} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0 outline-none">
          <ProjectCalendar projectId={projectId} />
        </TabsContent>
      </Tabs>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          team={team}
          open={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          columns={columns}
        />
      )}

      <CreateTaskDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={projectId}
        defaultColumnId={createColumnId}
        team={team}
        columns={columns}
      />
    </div>
  );
}
