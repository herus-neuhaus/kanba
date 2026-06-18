import { useState, useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  getGroupedRowModel,
  GroupingState,
} from '@tanstack/react-table';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Search, 
  Users, 
  Calendar as CalendarIcon, 
  MoreHorizontal,
  ArrowUpDown,
  Filter,
  Layers
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useTasks } from '@/hooks/useTasks';
import { useTeam } from '@/hooks/useTeam';
import { useColumns } from '@/hooks/useColumns';
import { TaskDetailModal } from '@/components/features/TaskDetailModal';
import { cn } from '@/lib/utils';
import type { Task, Profile, KanbanColumn } from '@/types';

interface ProjectListViewProps {
  projectId: string | undefined;
}

export function ProjectListView({ projectId }: ProjectListViewProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const { data: tasks = [], isLoading, createTask, updateTask } = useTasks(projectId);
  const { data: team = [] } = useTeam();
  const { data: columns = [] } = useColumns(projectId);

  const handleCreateTask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await createTask.mutateAsync({
        title: newTaskTitle,
        project_id: projectId,
        column_id: columns[0]?.id,
        priority: 'media'
      });
      setNewTaskTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const tableColumns = useMemo(() => [
    {
      accessorKey: 'title',
      header: ({ column }: any) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="-ml-3 gap-2 font-bold uppercase tracking-tight text-[10px]">
          Título da Tarefa <ArrowUpDown className="h-3 w-3" />
        </Button>
      ),
      cell: ({ row }: any) => {
        const task = row.original as Task;
        const isCompleted = columns.find(c => c.id === task.column_id)?.is_done;
        return (
          <div className="flex items-center gap-3 py-1 group cursor-pointer" onClick={() => setSelectedTaskId(task.id)}>
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-primary transition-colors" />
            )}
            <span className={cn(
              "font-bold text-sm truncate max-w-[300px]",
              isCompleted && "text-muted-foreground line-through decoration-2"
            )}>
              {task.title}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'assignee_ids',
      header: () => <span className="font-bold uppercase tracking-tight text-[10px] text-muted-foreground">Responsável</span>,
      cell: ({ row }: any) => {
        const ids = row.getValue('assignee_ids') as string[] || [];
        const assignees = team.filter(m => ids.includes(m.id));
        return (
          <div className="flex -space-x-2">
            {assignees.length > 0 ? (
              assignees.slice(0, 3).map((m) => (
                <Avatar key={m.id} className="h-7 w-7 border-2 border-background">
                  <AvatarImage src={m.avatar_url || ''} />
                  <AvatarFallback className="text-[9px] font-black">{m.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
              ))
            ) : (
              <div className="h-7 w-7 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                <Users className="h-3 w-3 text-muted-foreground/30" />
              </div>
            )}
            {assignees.length > 3 && (
              <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] font-bold">
                +{assignees.length - 3}
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'priority',
      header: () => <span className="font-bold uppercase tracking-tight text-[10px] text-muted-foreground">Prioridade</span>,
      cell: ({ row }: any) => {
        const priority = row.getValue('priority') as string;
        const variants: Record<string, any> = {
          alta: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Alta' },
          media: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Média' },
          baixa: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Baixa' }
        };
        const config = variants[priority] || variants.media;
        return (
          <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-tighter", config.color)}>
            {config.label}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'due_date',
      header: () => <span className="font-bold uppercase tracking-tight text-[10px] text-muted-foreground">Entrega</span>,
      cell: ({ row }: any) => {
        const dateStr = row.getValue('due_date') as string;
        const date = dateStr ? new Date(dateStr) : null;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-medium gap-2 text-muted-foreground hover:text-foreground">
                <CalendarIcon className="h-3.5 w-3.5" />
                {date ? format(date, 'dd MMM', { locale: ptBR }) : 'Definir'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date || undefined}
                onSelect={(newDate) => {
                  if (newDate) {
                    updateTask.mutate({ id: row.original.id, due_date: newDate.toISOString() });
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      }
    },
    {
      accessorKey: 'column_id',
      header: () => <span className="font-bold uppercase tracking-tight text-[10px] text-muted-foreground">Status</span>,
      cell: ({ row }: any) => {
        const columnId = row.getValue('column_id') as string;
        const column = columns.find(c => c.id === columnId);
        return (
          <Select
            value={columnId}
            onValueChange={(val) => updateTask.mutate({ id: row.original.id, column_id: val })}
          >
            <SelectTrigger className="h-8 border-none bg-transparent hover:bg-muted/50 transition-colors w-[140px] px-2 font-bold text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: column?.color || '#ccc' }} />
                <SelectValue>{column?.title}</SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {columns.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.title}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
    }
  ], [team, columns, updateTask]);

  const table = useReactTable({
    data: tasks,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      grouping,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGroupingChange: setGrouping,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
  });

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Table Filters/Controls */}
      <div className="flex items-center justify-between bg-card/50 border border-border/50 p-3 rounded-xl shadow-sm gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input 
              placeholder="Buscar tarefa..." 
              className="pl-9 h-9 border-none bg-muted/30 focus-visible:ring-primary/20 font-medium"
              value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
              onChange={(event) => table.getColumn('title')?.setFilterValue(event.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 font-bold uppercase tracking-tight text-[10px] border-border/50">
                <Users className="h-3.5 w-3.5" /> Filtrar Responsável
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Equipe</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => table.getColumn('assignee_ids')?.setFilterValue(undefined)}>
                Todos
              </DropdownMenuItem>
              {team.map(member => (
                <DropdownMenuItem 
                  key={member.id} 
                  onClick={() => table.getColumn('assignee_ids')?.setFilterValue([member.id])}
                  className="gap-2"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={member.avatar_url || ''} />
                    <AvatarFallback className="text-[8px]">{member.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{member.full_name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant={grouping.includes('column_id') ? 'secondary' : 'outline'} 
            size="sm" 
            className="h-9 gap-2 font-bold uppercase tracking-tight text-[10px] border-border/50"
            onClick={() => setGrouping(prev => prev.includes('column_id') ? [] : ['column_id'])}
          >
            <Layers className="h-3.5 w-3.5" /> Agrupar por Status
          </Button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-card border border-border/50 rounded-xl shadow-xl shadow-primary/5 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border/40">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-10">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                if (row.getIsGrouped()) {
                  const colId = row.getValue('column_id') as string;
                  const column = columns.find(c => c.id === colId);
                  return (
                    <TableRow key={row.id} className="bg-muted/20 hover:bg-muted/20 border-b border-border/40">
                      <TableCell colSpan={tableColumns.length} className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: column?.color || '#ccc' }} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {column?.title} ({row.subRows.length})
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/30 transition-colors border-b border-border/30 last:border-b-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2 px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-24 text-center text-muted-foreground font-medium italic">
                  Nenhuma tarefa encontrada.
                </TableCell>
              </TableRow>
            )}
            
            {/* Quick Creation Row (Notion style) */}
            <TableRow className="hover:bg-muted/50 border-t border-border/30 bg-muted/10">
              <TableCell colSpan={tableColumns.length} className="p-0">
                <form onSubmit={handleCreateTask} className="flex items-center w-full px-4 h-11">
                  <Plus className="h-4 w-4 text-muted-foreground mr-3 shrink-0" />
                  <input
                    placeholder="Adicionar nova tarefa... (Pressione Enter)"
                    className="bg-transparent border-none focus:ring-0 text-sm font-medium w-full h-full placeholder:text-muted-foreground/50 outline-none"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                  />
                </form>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          team={team}
          open={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          columns={columns}
        />
      )}
    </div>
  );
}
