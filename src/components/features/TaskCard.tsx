import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from 'lucide-react';
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
// Moved outside: constant map computed once, not on every render
const PRIORITY_INFO: Record<string, { border: string; text: string; label: string }> = {
  alta:  { border: 'border-l-destructive', text: 'text-destructive', label: 'Alta' },
  media: { border: 'border-l-warning',     text: 'text-warning',     label: 'Média' },
  baixa: { border: 'border-l-accent',      text: 'text-accent',      label: 'Baixa' },
};

export const TaskCard = memo(function TaskCard({ task, isDragging }: Props) {
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && (task as any).status !== 'done';

  const p = PRIORITY_INFO[task.priority || 'baixa'] ?? PRIORITY_INFO.baixa;

  return (
    <Card className={cn(
      'group relative cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 overflow-hidden',
      p.border,
      isOverdue ? 'ring-2 ring-destructive shadow-sm' : '',
      isDragging && 'shadow-xl ring-2 ring-primary/20 scale-[1.02]'
    )}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
           <div className="flex items-center gap-2 truncate">
              {task.labels && task.labels[0] && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                   {task.labels[0]}
                </span>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="h-3.5 px-1 py-0 text-[8px] font-black uppercase animate-pulse">
                   Atrasado
                </Badge>
              )}
           </div>
           
           <div className={cn('text-[9px] font-black uppercase tracking-tight flex items-center gap-1.5 shrink-0', p.text)}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {p.label}
           </div>
        </div>

        <h3 className="font-semibold text-[13px] leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5em] flex items-center">
          {task.title}
        </h3>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {task.due_date ? (
              <div className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-bold',
                isOverdue ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'
              )}>
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), 'dd MMM', { locale: ptBR })}
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground/50 italic font-medium px-2 py-1">Sem data</div>
            )}
          </div>

          <div className="flex items-center gap-1">
             {task.assignees?.map((assignee, i) => (
                <Avatar key={assignee.id} className={cn("h-6 w-6 border border-background shadow-sm ring-1 ring-muted transition-transform group-hover:scale-110", i > 0 && "-ml-2")}>
                  <AvatarFallback className="bg-primary/5 text-primary text-[9px] font-black" title={assignee.full_name || 'Sem nome'}>
                    {assignee.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
             ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}); // React.memo — prevents re-render when siblings update during drag
