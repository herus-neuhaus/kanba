import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  isPast,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTasks } from '@/hooks/useTasks';
import { ChevronLeft, ChevronRight, CalendarDays, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TaskDetailModal } from '@/components/features/TaskDetailModal';
import { useTeam } from '@/hooks/useTeam';
import { useColumns } from '@/hooks/useColumns';
import type { Task } from '@/types';

interface ProjectCalendarProps {
  projectId: string | undefined;
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const PRIORITY_STYLES: Record<string, string> = {
  alta: 'bg-destructive/15 text-destructive border-destructive/30',
  media: 'bg-warning/15 text-warning border-warning/30',
  baixa: 'bg-primary/10 text-primary border-primary/20',
};

export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useTasks(projectId);
  const { data: team = [] } = useTeam();
  const { data: columns = [] } = useColumns(projectId);

  // Filter tasks that have a due_date
  const tasksWithDueDate = useMemo(
    () => tasks.filter((t): t is Task & { due_date: string } => !!t.due_date),
    [tasks]
  );

  // Build the grid days (6 weeks × 7 days = 42 cells)
  const gridDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { locale: ptBR });
    const calEnd = endOfWeek(monthEnd, { locale: ptBR });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  // Index tasks by day string yyyy-MM-dd for quick lookup
  const tasksByDay = useMemo(() => {
    const map: Record<string, typeof tasksWithDueDate> = {};
    for (const task of tasksWithDueDate) {
      const key = task.due_date.slice(0, 10); // "yyyy-MM-dd"
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    return map;
  }, [tasksWithDueDate]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  const goToPrev = () => setCurrentDate((d) => subMonths(d, 1));
  const goToNext = () => setCurrentDate((d) => addMonths(d, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Count tasks in the current month view
  const monthTaskCount = useMemo(() => {
    return tasksWithDueDate.filter((t) =>
      isSameMonth(parseISO(t.due_date), currentDate)
    ).length;
  }, [tasksWithDueDate, currentDate]);

  const overdueCount = useMemo(() => {
    return tasksWithDueDate.filter((t) => {
      const d = parseISO(t.due_date);
      const lastColId = columns[columns.length - 1]?.id;
      return isPast(d) && t.column_id !== lastColId;
    }).length;
  }, [tasksWithDueDate, columns]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center border border-border rounded-xl bg-card">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-xl px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <p className="text-xs text-muted-foreground">
              {monthTaskCount} {monthTaskCount === 1 ? 'entrega' : 'entregas'} neste mês
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/5 rounded-full border border-destructive/20 text-destructive text-xs font-bold animate-pulse">
              <AlertCircle className="h-3.5 w-3.5" />
              {overdueCount} atrasada{overdueCount > 1 ? 's' : ''}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs font-semibold">
            Hoje
          </Button>
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={goToPrev}
              className="p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="h-5 w-px bg-border" />
            <button
              onClick={goToNext}
              className="p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="py-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground select-none border-r border-border last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {gridDays.map((day, idx) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDay[key] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const isLastCol = idx % 7 === 6;
            const isLastRow = idx >= gridDays.length - 7;

            return (
              <div
                key={key}
                className={cn(
                  'min-h-[100px] p-2 border-r border-b border-border flex flex-col gap-1 transition-colors',
                  isLastCol && 'border-r-0',
                  isLastRow && 'border-b-0',
                  !isCurrentMonth && 'bg-muted/20 opacity-60',
                  isCurrentMonth && 'hover:bg-muted/30'
                )}
              >
                {/* Day number */}
                <div className="flex items-center justify-end">
                  <span
                    className={cn(
                      'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full select-none transition-colors',
                      isCurrentDay
                        ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                        : isCurrentMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Tasks */}
                <div className="flex flex-col gap-0.5">
                  {dayTasks.slice(0, 3).map((task) => {
                    const priorityClass =
                      PRIORITY_STYLES[task.priority || ''] ||
                      'bg-primary/10 text-primary border-primary/20';
                    const isOverdue =
                      isPast(parseISO(task.due_date)) &&
                      task.column_id !== columns[columns.length - 1]?.id;

                    return (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        title={task.title}
                        className={cn(
                          'w-full text-left text-[11px] font-medium rounded-md px-2 py-0.5 border truncate leading-5 transition-all hover:brightness-110 hover:scale-[1.02] focus:outline-none focus:ring-1 focus:ring-ring',
                          isOverdue
                            ? 'bg-destructive/15 text-destructive border-destructive/30'
                            : priorityClass
                        )}
                      >
                        {task.title}
                      </button>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <span className="text-[10px] text-muted-foreground font-medium pl-1">
                      +{dayTasks.length - 3} mais
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-[11px] text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-destructive/20 border border-destructive/30 inline-block" />
          Atrasada / Alta prioridade
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-warning/20 border border-warning/30 inline-block" />
          Média prioridade
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-primary/15 border border-primary/20 inline-block" />
          Baixa prioridade
        </div>
      </div>

      {/* Task detail modal */}
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
