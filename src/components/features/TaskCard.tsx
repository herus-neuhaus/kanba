import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, MessageSquare } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface Props {
  task: Task;
  isDragging?: boolean;
}

const labelColors: Record<string, string> = {
  urgente: 'bg-destructive/20 text-destructive',
  design: 'bg-primary/20 text-primary',
  copy: 'bg-warning/20 text-warning',
  social: 'bg-accent/20 text-accent',
};

export function TaskCard({ task, isDragging }: Props) {
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done';

  return (
    <Card className={cn('cursor-pointer hover:border-primary/30 transition-all', isDragging && 'shadow-lg ring-2 ring-primary/30')}>
      <CardContent className="p-3 space-y-2">
        <p className="font-medium text-sm leading-tight">{task.title}</p>

        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.map(l => (
              <Badge key={l} variant="secondary" className={cn('text-[10px] px-1.5 py-0', labelColors[l.toLowerCase()] || '')}>
                {l}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {task.due_date && (
              <span className={cn('flex items-center gap-1', isOverdue && 'text-destructive')}>
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), 'dd MMM', { locale: ptBR })}
              </span>
            )}
          </div>
          {task.assignee && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                {task.assignee.full_name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
