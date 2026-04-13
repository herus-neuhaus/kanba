import { memo, useState, useRef, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import type { Task, KanbanColumn as IKanbanColumn } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, Plus, MoreHorizontal, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  column: IKanbanColumn;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
  onDeleteColumn: (columnId: string) => void;
  onUpdateColumn: (columnId: string, title: string, color?: string, is_done?: boolean) => void;
}

const COLOR_OPTIONS = [
  { label: 'Cinza (Padrão)', value: 'bg-muted' },
  { label: 'Azul', value: 'bg-blue-500/10' },
  { label: 'Amarelo', value: 'bg-amber-500/10' },
  { label: 'Roxo', value: 'bg-purple-500/10' },
  { label: 'Verde', value: 'bg-green-500/10' },
  { label: 'Rosa', value: 'bg-pink-500/10' },
  { label: 'Laranja', value: 'bg-orange-500/10' },
];

export const KanbanColumn = memo(function KanbanColumn({ column, tasks, onTaskClick, onAddTask, onDeleteColumn, onUpdateColumn }: Props) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(column.title);
  }, [column.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleTitleSubmit = () => {
    setIsEditing(false);
    if (title.trim() && title.trim() !== column.title) {
      onUpdateColumn(column.id, title.trim());
    } else {
      setTitle(column.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSubmit();
    if (e.key === 'Escape') {
      setTitle(column.title);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (tasks.length > 0) {
      toast({
        title: "Esvazie a coluna antes de excluí-la",
        description: `Existem ${tasks.length} tarefas nesta coluna.`,
        variant: "destructive"
      });
      return;
    }
    onDeleteColumn(column.id);
  };

  return (
    <div className="flex-shrink-0 w-72">
      <div className={`flex items-center justify-between mb-3 px-2 py-1.5 rounded-md ${column.color || 'bg-muted'}`}>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateColumn(column.id, column.title, undefined, !column.is_done);
                  }}
                  className={cn(
                    "flex-shrink-0 transition-all duration-300 hover:scale-110 outline-none",
                    column.is_done ? "text-green-500" : "text-muted-foreground/30 hover:text-muted-foreground/60"
                  )}
                >
                  <CheckCircle2 className={cn("h-4 w-4", column.is_done && "fill-green-500/20")} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] font-black uppercase tracking-widest bg-popover/90 backdrop-blur-md border-primary/20 text-foreground px-3 py-1.5 shadow-xl">
                {column.is_done ? 'Esta coluna finaliza tarefas' : 'Clique para definir como coluna de conclusão'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isEditing ? (
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              className="bg-background border-none px-1 py-0.5 rounded text-sm font-bold w-full outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          ) : (
            <h3 
              className="font-bold text-sm truncate cursor-text hover:opacity-80 py-0.5 px-1 -ml-1 rounded transition-colors"
              onClick={() => setIsEditing(true)}
              title="Clique para editar"
            >
              {column.title}
            </h3>
          )}
          <span className="text-[10px] font-black text-muted-foreground bg-background/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border/50">{tasks.length}</span>
        </div>
        
        <div className="flex items-center flex-shrink-0 ml-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-background/50" onClick={onAddTask}>
            <Plus className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-background/50">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Cores da Coluna</DropdownMenuLabel>
              <div className="grid grid-cols-4 gap-1 p-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onUpdateColumn(column.id, column.title, c.value)}
                    className={`h-6 w-full rounded-md border ${c.value} ${column.color === c.value ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                    title={c.label}
                  />
                ))}
              </div>
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between px-2 py-2">
                <Label htmlFor={`is-done-${column.id}`} className="text-[11px] font-medium cursor-pointer">
                  Finaliza a tarefa
                </Label>
                <Switch 
                  id={`is-done-${column.id}`} 
                  checked={column.is_done} 
                  onCheckedChange={(checked) => onUpdateColumn(column.id, column.title, undefined, checked)}
                />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash className="h-4 w-4 mr-2" />
                Excluir Coluna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30'}`}
          >
            {tasks.map((task, idx) => (
              <Draggable key={task.id} draggableId={task.id} index={idx}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onTaskClick(task)}
                  >
                    <TaskCard task={task} isDragging={snapshot.isDragging} isColumnDone={column.is_done} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}); // React.memo — column only re-renders when its tasks or meta change
