import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { useTeam } from '@/hooks/useTeam';
import { KANBAN_COLUMNS } from '@/types';
import { KanbanColumn } from '@/components/features/KanbanColumn';
import { TaskDetailModal } from '@/components/features/TaskDetailModal';
import { CreateTaskDialog } from '@/components/features/CreateTaskDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import type { Task } from '@/types';

export default function KanbanBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: tasks = [], updateTask } = useTasks(projectId);
  const { data: team = [] } = useTeam();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState('todo');

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    updateTask.mutate({ id: taskId, status: newStatus });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kanban</h1>
        <Button onClick={() => { setCreateStatus('todo'); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nova Tarefa
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasks.filter(t => (t.status || 'todo') === col.id)}
              onTaskClick={setSelectedTask}
              onAddTask={() => { setCreateStatus(col.id); setCreateOpen(true); }}
            />
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          team={team}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
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
