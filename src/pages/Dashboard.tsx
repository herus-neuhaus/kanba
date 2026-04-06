import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FolderKanban, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { agency } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();

  const overdueTasks = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.status !== 'done');
  const doneTasks = tasks.filter(t => t.status === 'done');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const overallProgress = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  const stats = [
    { label: 'Projetos', value: projects.length, icon: FolderKanban, color: 'text-primary' },
    { label: 'Em Andamento', value: inProgressTasks.length, icon: Clock, color: 'text-warning' },
    { label: 'Atrasadas', value: overdueTasks.length, icon: AlertCircle, color: 'text-destructive' },
    { label: 'Concluídas', value: doneTasks.length, icon: CheckCircle2, color: 'text-accent' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">{agency?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progresso Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={overallProgress} className="flex-1" />
            <span className="text-sm font-medium">{overallProgress}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projetos Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 && <p className="text-sm text-muted-foreground">Nenhum projeto ainda. Crie um para começar!</p>}
            {projects.slice(0, 5).map(p => (
              <Link to={`/projects/${p.id}`} key={p.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.description || 'Sem descrição'}</p>
                </div>
                <Badge variant="secondary">{p.progress ?? 0}%</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tarefas Atrasadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueTasks.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa atrasada 🎉</p>}
            {overdueTasks.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-md bg-destructive/10">
                <div>
                  <p className="font-medium text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.assignee?.full_name || 'Sem responsável'}</p>
                </div>
                {t.due_date && (
                  <Badge variant="destructive" className="text-xs">
                    {format(new Date(t.due_date), 'dd MMM', { locale: ptBR })}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
