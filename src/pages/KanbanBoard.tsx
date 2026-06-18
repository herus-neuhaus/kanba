import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useTeam } from '@/hooks/useTeam';
import { useProjects } from '@/hooks/useProjects';
import { useColumns } from '@/hooks/useColumns';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { KanbanColumn } from '@/components/features/KanbanColumn';
import { TaskDetailModal } from '@/components/features/TaskDetailModal';
import { CreateTaskDialog } from '@/components/features/CreateTaskDialog';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, FolderKanban, Activity, AlertCircle, ListTodo, BookOpen, CalendarDays, LayoutDashboard, Calendar, List, Settings } from 'lucide-react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { isPast } from 'date-fns';
import { useMemo } from 'react';
import { logAndNotify } from '@/lib/notifications';
import { generateTaskLink } from '@/lib/urls';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectWiki } from '@/components/features/ProjectWiki';
import { ProjectCalendar } from '@/components/features/ProjectCalendar';
import { ProjectListView } from '@/components/features/ProjectListView';
import { EnvironmentSettings } from '@/components/features/EnvironmentSettings';

export default function KanbanBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: projects = [] } = useProjects();
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'kanban' | 'wiki' | 'calendar' | 'list' | 'settings'>('kanban');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const isManagerOrOwner = authProfile?.role === 'manager' || authProfile?.role === 'owner';
  const [showAllTasks, setShowAllTasks] = useState(false);

  const { data: columns = [], createColumn, updateColumn, deleteColumn } = useColumns(projectId);
  const { data: team = [] } = useTeam();
  const currentClient = projects.find(p => p.id === projectId);
  const [searchParams, setSearchParams] = useSearchParams();
  const taskIdParam = searchParams.get('task');

  const { data: allTasks = [], updateTask } = useTasks(projectId);
  const tasks = useMemo(() => {
    return (isManagerOrOwner && showAllTasks) 
      ? allTasks 
      : allTasks.filter(t => t.assignee_ids?.includes(user?.id || '') || (t as any).assigned_to === user?.id);
  }, [allTasks, isManagerOrOwner, showAllTasks, user?.id]);

  // Memoize tasks grouped by column and enriched with assignees
  const tasksByColumn = useMemo(() => {
    const map: Record<string, any[]> = {};
    columns.forEach(col => {
      map[col.id] = tasks
        .filter(t => t.column_id === col.id)
        .map(t => ({
          ...t,
          assignees: team.filter(m => (t.assignee_ids || []).includes(m.id))
        }))
        .sort((a, b) => {
          const posA = a.position ?? 0;
          const posB = b.position ?? 0;
          if (posA !== posB) return posA - posB;
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        });
    });
    return map;
  }, [tasks, columns, team]);

  useEffect(() => {
    if (taskIdParam) {
      setSelectedTaskId(taskIdParam);
    }
  }, [taskIdParam]);

  // Set default tab based on role
  useEffect(() => {
    if (authProfile?.role === 'client') {
      setActiveTab('calendar');
    }
  }, [authProfile]);

  const handleCloseModal = () => {
    setSelectedTaskId(null);
    if (searchParams.has('task')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('task');
      setSearchParams(newParams, { replace: true });
    }
  };
  const [createOpen, setCreateOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState<string | undefined>(undefined);

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  const totalTasks = tasks.length;
  // If no columns yet, we can't properly filter backlog/done
  const firstColId = columns[0]?.id;
  const lastColId = columns[columns.length - 1]?.id;

  const inProgressTasks = tasks.filter(t => {
     const col = columns.find(c => c.id === t.column_id);
     return t.column_id !== firstColId && !col?.is_done;
  }).length;

  const overdueTasks = tasks.filter(t => {
    const col = columns.find(c => c.id === t.column_id);
    return t.due_date && isPast(new Date(t.due_date)) && !col?.is_done;
  }).length;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newColumnId = result.destination.droppableId;
    const destinationIndex = result.destination.index;
    const sourceColumnId = result.source.droppableId;
    const sourceIndex = result.source.index;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const destTasks = tasksByColumn[newColumnId] || [];
    let newPosition: number;

    if (sourceColumnId === newColumnId) {
       if (sourceIndex === destinationIndex) return; // Didn't move

       const listWithoutItem = Array.from(destTasks);
       listWithoutItem.splice(sourceIndex, 1);
       
       const prevTask = listWithoutItem[destinationIndex - 1];
       const nextTask = listWithoutItem[destinationIndex];

       if (!prevTask) {
          newPosition = (nextTask?.position ?? 0) - 1000;
       } else if (!nextTask) {
          newPosition = (prevTask?.position ?? 0) + 1000;
       } else {
          newPosition = ((prevTask.position ?? 0) + (nextTask.position ?? 0)) / 2;
       }
    } else {
       const prevTask = destTasks[destinationIndex - 1];
       const nextTask = destTasks[destinationIndex];

       if (!prevTask && !nextTask) {
          newPosition = 1000; // First item in column
       } else if (!prevTask) {
          newPosition = (nextTask?.position ?? 0) - 1000;
       } else if (!nextTask) {
          newPosition = (prevTask?.position ?? 0) + 1000;
       } else {
          newPosition = ((prevTask.position ?? 0) + (nextTask.position ?? 0)) / 2;
       }
    }

    const destCol = columns.find(c => c.id === newColumnId);
    const updates: any = { id: taskId, column_id: newColumnId, position: newPosition };

    if (task.column_id === firstColId && newColumnId !== firstColId && !task.started_at) {
      updates.started_at = new Date().toISOString();
    }

    if (destCol?.is_done) {
      updates.completed_at = new Date().toISOString();
    } else {
      updates.completed_at = null;
    }
    
    updateTask.mutate(updates);

    if (destCol?.title?.toLowerCase().includes('aprov') && task.column_id !== newColumnId) {
      const aIds = task.assignee_ids || [];
      for (const aId of aIds) {
        const assignee = team.find(m => m.id === aId);
        if (assignee?.phone) {
          const link = generateTaskLink(projectId!, taskId);
          const msg = `✅ *Demanda em ${destCol.title}*\n\nOlá ${assignee.full_name}!\nA demanda *${task.title}* do projeto *${currentClient?.name || 'Agência'}* foi movida para *${destCol.title}*.\n\n👉 *Acesse direto a tarefa aqui:*\n🔗 ${link}`;
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
            {currentClient?.space && (
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                  Ambiente: {(currentClient.space as any).name}
                </span>
                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                  Projeto Ativo
                </span>
              </div>
            )}
            <h1 className="text-4xl font-black tracking-tighter text-foreground">
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
            {isManagerOrOwner && (
              <div className="flex items-center space-x-2 bg-muted/30 px-3 py-1.5 rounded-full border w-max ml-1">
                <Switch 
                  id="kanban-view-all" 
                  checked={showAllTasks} 
                  onCheckedChange={setShowAllTasks} 
                  className="scale-75"
                />
                <label htmlFor="kanban-view-all" className="text-[10px] font-bold uppercase tracking-tight cursor-pointer">
                  Todos
                </label>
              </div>
            )}
            <Button size="sm" className="ml-2 shadow-lg" onClick={() => { setCreateColumnId(firstColId); setCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Nova Demanda
            </Button>
          </div>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as any)}
        className="w-full"
      >
        <TabsList className="mb-6 bg-muted/50 p-1 rounded-lg inline-flex items-center gap-1 overflow-x-auto justify-start w-full sm:w-auto border-none">
          <TabsTrigger value="kanban" className="rounded-md gap-2 px-4 py-2 transition-all duration-200 text-muted-foreground bg-transparent border-none hover:text-foreground hover:cursor-pointer data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
            <span className="font-semibold whitespace-nowrap">Quadro Kanban</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="rounded-md gap-2 px-4 py-2 transition-all duration-200 text-muted-foreground bg-transparent border-none hover:text-foreground hover:cursor-pointer data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <List className="h-4 w-4 flex-shrink-0" />
            <span className="font-semibold whitespace-nowrap">Lista</span>
          </TabsTrigger>
          <TabsTrigger value="wiki" className="rounded-md gap-2 px-4 py-2 transition-all duration-200 text-muted-foreground bg-transparent border-none hover:text-foreground hover:cursor-pointer data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <BookOpen className="h-4 w-4 flex-shrink-0" />
            <span className="font-semibold whitespace-nowrap">Wiki do Projeto</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-md gap-2 px-4 py-2 transition-all duration-200 text-muted-foreground bg-transparent border-none hover:text-foreground hover:cursor-pointer data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="font-semibold whitespace-nowrap">Calendário</span>
          </TabsTrigger>
          {isManagerOrOwner && (
            <TabsTrigger value="settings" className="rounded-md gap-2 px-4 py-2 transition-all duration-200 text-muted-foreground bg-transparent border-none hover:text-foreground hover:cursor-pointer data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="font-semibold whitespace-nowrap">Configurações</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="kanban" className="mt-0 outline-none">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-1 items-start min-h-[50vh] touch-pan-x snap-x snap-mandatory sm:snap-none">
              {columns.map(col => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  tasks={tasksByColumn[col.id] || []}
                  onTaskClick={(task) => setSelectedTaskId(task.id)}
                  onAddTask={() => { setCreateColumnId(col.id); setCreateOpen(true); }}
                  onDeleteColumn={(id) => deleteColumn.mutate(id)}
                  onUpdateColumn={(id, title, color, is_done) => updateColumn.mutate({ id, title, color, is_done })}
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

        <TabsContent value="list" className="mt-0 outline-none">
          <ProjectListView projectId={projectId} />
        </TabsContent>

        <TabsContent value="settings" className="mt-0 outline-none">
          <EnvironmentSettings projectId={projectId} />
        </TabsContent>
      </Tabs>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          team={team}
          open={!!selectedTaskId}
          onClose={handleCloseModal}
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
