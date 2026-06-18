import { memo, useState, useRef, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import type { Task, KanbanColumn as IKanbanColumn } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, Plus, MoreHorizontal, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface Props {
  column: IKanbanColumn;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
  onDeleteColumn: (columnId: string) => void;
  onUpdateColumn: (columnId: string, title: string, color?: string, is_done?: boolean) => void;
}

const COLOR_OPTIONS = [
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Verde', value: '#22c55e' },
  { label: 'Amarelo', value: '#eab308' },
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Roxo', value: '#a855f7' },
  { label: 'Cinzento', value: '#6b7280' },
];

const resolveColor = (colorStr?: string | null) => {
  if (!colorStr) return '#6b7280';
  if (colorStr.startsWith('#')) return colorStr;
  if (colorStr.includes('blue')) return '#3b82f6';
  if (colorStr.includes('green')) return '#22c55e';
  if (colorStr.includes('amber') || colorStr.includes('yellow')) return '#eab308';
  if (colorStr.includes('red') || colorStr.includes('pink')) return '#ef4444';
  if (colorStr.includes('purple')) return '#a855f7';
  if (colorStr.includes('orange')) return '#f97316';
  return '#6b7280';
};

export const KanbanColumn = memo(function KanbanColumn({ column, tasks, onTaskClick, onAddTask, onDeleteColumn, onUpdateColumn }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

    // 1. Prepare for optimistic update
    const queryKey = ['columns', column.project_id];
    const previousColumns = qc.getQueryData<IKanbanColumn[]>(queryKey);

    // 2. Optimistic update: remove column from cache
    if (previousColumns) {
      qc.setQueryData<IKanbanColumn[]>(queryKey, old => old?.filter(c => c.id !== column.id));
    }

    // 3. Set timeout for permanent deletion
    const timeoutId = setTimeout(async () => {
      try {
        await onDeleteColumn(column.id);
      } catch (err: any) {
        // If permanent delete fails, restore the cache
        qc.setQueryData(queryKey, previousColumns);
        sonnerToast.error(`Erro ao excluir coluna: ${err.message}`);
      }
    }, 5000);

    // 4. Show toast with Undo action
    sonnerToast.info("Coluna excluída", {
      description: "Você tem 5 segundos para desfazer esta ação.",
      duration: 5000,
      action: {
        label: "Desfazer",
        onClick: () => {
          clearTimeout(timeoutId);
          qc.setQueryData(queryKey, previousColumns);
          sonnerToast.success("Coluna restaurada!");
        },
      },
    });
  };

  return (
    <div className="flex-shrink-0 w-72 snap-center sm:snap-none">
      <div 
        className="flex items-center justify-between mb-3 px-2 py-2 rounded-t-md rounded-b bg-muted/20 border-t-4 shadow-sm"
        style={{ borderTopColor: resolveColor(column.color) }}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Popover>
            <PopoverTrigger asChild>
              <button 
                className="w-3.5 h-3.5 rounded-full flex-shrink-0 border shadow-sm transition-transform hover:scale-110 focus:outline-none"
                style={{ backgroundColor: resolveColor(column.color), borderColor: 'rgba(0,0,0,0.1)' }}
                title="Alterar cor da coluna"
              />
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2" side="bottom" align="start">
              <div className="grid grid-cols-3 gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onUpdateColumn(column.id, column.title, c.value)}
                    className={cn(
                      "h-8 w-8 rounded-full border shadow-sm flex items-center justify-center transition-transform hover:scale-110",
                      resolveColor(column.color) === c.value ? "ring-2 ring-offset-2 ring-primary" : ""
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

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
              style={{ color: resolveColor(column.color) }}
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
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                    <Trash className="h-4 w-4 mr-2" />
                    Excluir Coluna
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir coluna "{column.title}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso removerá a coluna permanentemente após 5 segundos. 
                      Certifique-se de que não há tarefas importantes aqui.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirmar Exclusão
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border/50 rounded-lg text-muted-foreground/60 bg-muted/5 opacity-80">
                <span className="text-xs font-semibold">Solte demandas aqui</span>
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}); // React.memo — column only re-renders when its tasks or meta change
