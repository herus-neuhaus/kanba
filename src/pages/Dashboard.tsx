import { useEffect, useState, useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useSpaces } from '@/hooks/useSpaces';
import { useTasks } from '@/hooks/useTasks';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import type { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  FolderKanban, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Zap,
  Activity,
  User,
  ChevronRight,
  ClipboardList,
  Settings
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { format, isPast, isToday, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { agency, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { spaceId } = useParams<{ spaceId: string }>();
  
  const [showAllTasks, setShowAllTasks] = useState(false);
  const isManagerOrOwner = profile?.role === 'manager' || profile?.role === 'owner';
  
  // Use tasks filtering
  const { data: allTasks = [] } = useTasks(undefined, spaceId);
  const { data: spaces = [] } = useSpaces();
  const { data: projects = [] } = useProjects(spaceId);
  const { data: team = [] } = useTeam();

  const currentSpace = spaces.find(s => s.id === spaceId);
  const tasks = (isManagerOrOwner && showAllTasks) 
    ? allTasks 
    : allTasks.filter(t => t.assignee_ids?.includes(user?.id || '') || (t as any).assigned_to === user?.id);

  // O Dashboard Global agora é permitido para ver as métricas gerais da agência

  const now = new Date();
  
  // Dynamic Categorization
  const isDone = (t: Task) => !!t.completed_at || t.column?.is_done === true;
  const isBacklog = (t: Task) => !isDone(t) && t.column?.order_index === 0;

  // Dynamic Categorization - Memoized to prevent browser freezing
  const categorizedTasks = useMemo(() => {
    const overdue = tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)) && !isDone(t));
    const today = tasks.filter(t => t.due_date && isToday(parseISO(t.due_date)) && !isDone(t));
    const done = tasks.filter(t => isDone(t));
    const inProgress = tasks.filter(t => !isBacklog(t) && !isDone(t));
    
    const approval = tasks.filter(t => !isDone(t) && (t.column?.title?.toLowerCase().includes('aprovação') || (t as any).status === 'approval'));
    
    const stale = tasks.filter(t => {
       if (isDone(t)) return false;
       const lastAction = (t as any).updated_at ? new Date((t as any).updated_at) : 
                         ((t as any).last_notified_at ? new Date((t as any).last_notified_at) : 
                         (t.created_at ? new Date(t.created_at) : now));
       const daysSinceAction = differenceInDays(now, lastAction);
       if (!t.due_date && daysSinceAction > 5) return true;
       if (t.due_date) {
          const dueDate = parseISO(t.due_date);
          const daysToDue = differenceInDays(dueDate, now);
          if (daysToDue <= 7 && daysSinceAction > 3) return true; 
       }
       return false;
    });

    const progress = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0;

    return { overdue, today, done, inProgress, approval, stale, progress };
  }, [tasks, now]);

  const stats = useMemo(() => [
    { label: 'Projetos', value: projects.length, icon: FolderKanban, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Em Produção', value: categorizedTasks.inProgress.length, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/5' },
    { label: 'Atrasadas', value: categorizedTasks.overdue.length, icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/5' },
    { label: 'Hoje', value: categorizedTasks.today.length, icon: Clock, color: 'text-warning', bg: 'bg-warning/5' },
    { label: 'Aprovadas', value: categorizedTasks.done.length, icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/5' },
  ], [projects.length, categorizedTasks]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {currentSpace && (
            <div 
              className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-xl shrink-0 animate-in zoom-in duration-300"
              style={{ backgroundColor: currentSpace.color || '#64748b' }}
            >
              {currentSpace.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            {spaceId && (
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                  Ambiente Ativo
                </span>
                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                  {projects.length} Projetos Vinculados
                </span>
              </div>
            )}
            <h1 className="text-4xl font-black tracking-tighter text-foreground flex items-center gap-3">
              {currentSpace ? currentSpace.name : 'Dashboard Executivo'}
            </h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              {currentSpace ? (
                <>
                  <div className="h-1 w-4 rounded-full bg-primary/30" />
                  Gestão Centralizada de Projetos
                </>
              ) : agency?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {currentSpace ? (
             <Button variant="outline" size="sm" onClick={() => navigate(`/espacos/${spaceId}/settings`)} className="gap-2 font-bold uppercase tracking-widest text-[10px]">
                <Settings className="h-3.5 w-3.5" /> Configurações
             </Button>
           ) : (
             <Badge variant="outline" className="px-3 py-1 font-bold text-[10px] uppercase tracking-widest border-primary/20 text-primary">
                Agência Ativa
             </Badge>
           )}
           <span className="text-[10px] font-bold text-muted-foreground uppercase">{format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
        </div>
      </div>

      {isManagerOrOwner && (
        <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border w-max">
          <Switch 
            id="view-all-tasks" 
            checked={showAllTasks} 
            onCheckedChange={setShowAllTasks} 
          />
          <label htmlFor="view-all-tasks" className="text-sm font-medium leading-none cursor-pointer">
            Ver tarefas de todos
          </label>
        </div>
      )}

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="border-none shadow-sm ring-1 ring-border/50 hover:ring-primary/20 transition-all overflow-hidden group">
            <CardContent className="p-4 flex flex-col items-start gap-4">
              <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300", s.bg)}>
                <s.icon className={cn("h-5 w-5", s.color)} />
              </div>
              <div className="space-y-0.5">
                <p className="text-2xl font-black tracking-tighter">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-80">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Prioridades do Dia */}
          <Card className="border-none shadow-xl ring-1 ring-border/60 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3 border-b">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-foreground/80">
                <Zap className="h-4 w-4 text-warning fill-warning" /> Prioridades do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[350px] w-full">
                <div className="divide-y divide-border/40">
                  {[...categorizedTasks.overdue, ...categorizedTasks.today].length === 0 && (
                    <div className="py-16 text-center space-y-3">
                      <div className="bg-accent/10 h-12 w-12 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-6 w-6 text-accent" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium italic">Tudo sob controle. Nenhuma prioridade crítica agora.</p>
                    </div>
                  )}
                  
                  {/* Overdue Task List */}
                  {categorizedTasks.overdue.sort((a,b) => (a.due_date && b.due_date) ? a.due_date.localeCompare(b.due_date) : 0).map(t => {
                    const daysAgo = t.due_date ? differenceInDays(now, parseISO(t.due_date)) : 0;
                    return (
                      <div key={t.id} className="group p-5 flex items-center justify-between hover:bg-destructive/[0.02] transition-colors pr-4">
                        <div className="flex gap-4 items-start">
                          <div className="mt-1 h-3 w-3 rounded-full bg-destructive animate-pulse" />
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-destructive tracking-widest">
                              {daysAgo} {daysAgo === 1 ? 'dia' : 'dias'} atrasada • {(t.project as any)?.name}
                            </p>
                            <h4 className="font-extrabold text-base tracking-tight">{t.title}</h4>
                            <div className="flex items-center gap-3 mt-2">
                               <div className="flex -space-x-2">
                                 {(t.assignee_ids && t.assignee_ids.length > 0) ? (
                                   t.assignee_ids.map(id => {
                                     const member = team.find(m => m.id === id);
                                     if (!member) return null;
                                     return (
                                       <Avatar key={id} className="h-6 w-6 border-2 border-background ring-1 ring-border/50">
                                         <AvatarImage src={member.avatar_url || undefined} alt={member.full_name || ''} />
                                         <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">
                                           {member.full_name?.charAt(0) || '?'}
                                         </AvatarFallback>
                                       </Avatar>
                                     );
                                   })
                                 ) : (
                                   <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center border-2 border-background ring-1 ring-border/50">
                                     <User className="h-3 w-3 text-muted-foreground/50" />
                                   </div>
                                 )}
                               </div>
                               <span className="h-1 w-1 rounded-full bg-border" />
                               <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Prazo: {t.due_date ? format(parseISO(t.due_date), 'dd/MM') : 'S/D'}</span>
                            </div>
                          </div>
                        </div>
                        <Link to={`/projetos/${t.project_id}/kanban`}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 font-bold text-[10px] uppercase">Ver No Quadro</Button>
                        </Link>
                      </div>
                    );
                  })}

                  {/* Today Task List */}
                  {categorizedTasks.today.map(t => (
                    <div key={t.id} className="group p-5 flex items-center justify-between hover:bg-warning/[0.02] transition-colors pr-4">
                      <div className="flex gap-4 items-start">
                        <div className="mt-1 h-3 w-3 rounded-full bg-warning" />
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-warning tracking-widest">
                            Entregar Hoje • {(t.project as any)?.name}
                          </p>
                          <h4 className="font-extrabold text-base tracking-tight">{t.title}</h4>
                          <div className="flex items-center gap-3 mt-2">
                             <div className="flex -space-x-2">
                               {(t.assignee_ids && t.assignee_ids.length > 0) ? (
                                 t.assignee_ids.map(id => {
                                   const member = team.find(m => m.id === id);
                                   if (!member) return null;
                                   return (
                                     <Avatar key={id} className="h-6 w-6 border-2 border-background ring-1 ring-border/50">
                                       <AvatarImage src={member.avatar_url || undefined} alt={member.full_name || ''} />
                                       <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">
                                         {member.full_name?.charAt(0) || '?'}
                                       </AvatarFallback>
                                     </Avatar>
                                   );
                                 })
                               ) : (
                                 <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center border-2 border-background ring-1 ring-border/50">
                                   <User className="h-3 w-3 text-muted-foreground/50" />
                                 </div>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>
                      <Link to={`/projetos/${t.project_id}/kanban`}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 font-bold text-[10px] uppercase text-warning">Ver No Quadro</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Aguardando Aprovação */}
            <Card className="border-none shadow-lg ring-1 ring-border/50">
              <CardHeader className="pb-3 border-b mb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                   <Activity className="h-4 w-4 text-primary" /> Aguardando Aprovação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                 {categorizedTasks.approval.length === 0 && <p className="text-xs text-center py-8 text-muted-foreground/60 italic">Nenhuma demanda sob análise.</p>}
                 {categorizedTasks.approval.map(t => {
                   const days = differenceInDays(now, new Date(t.created_at || Date.now()));
                   return (
                     <div key={t.id} className="group relative p-4 rounded-xl border border-primary/10 bg-primary/[0.01] hover:bg-primary/[0.03] transition-all">
                        <p className="text-[9px] font-black text-primary uppercase tracking-tighter mb-1">{(t.project as any)?.name}</p>
                        <p className="font-bold text-sm text-foreground mb-2">{t.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={cn("px-2 py-0 h-4 text-[8px] font-black uppercase tracking-widest", days >= 2 ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary")}>
                             {days} {days === 1 ? 'dia' : 'dias'} parado
                          </Badge>
                        </div>
                     </div>
                   );
                 })}
              </CardContent>
            </Card>

            {/* Sem Atualização (Esquecidas) */}
            <Card className="border-none shadow-lg ring-1 ring-border/50">
              <CardHeader className="pb-3 border-b mb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground/80">
                   <ClipboardList className="h-4 w-4" /> Demandas Esquecidas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <ScrollArea className="h-[350px] w-full p-4">
                   <div className="space-y-3 pr-3">
                     {categorizedTasks.stale.length === 0 && <p className="text-xs text-center py-8 text-muted-foreground/60 italic">Fluxo saudável! Nenhuma demanda parada.</p>}
                     {categorizedTasks.stale.map(t => {
                       const lastA = (t as any).last_notified_at ? new Date((t as any).last_notified_at) : ((t as any).updated_at ? new Date((t as any).updated_at) : (t.created_at ? new Date(t.created_at) : now));
                       const days = differenceInDays(now, lastA);
                       return (
                         <div key={t.id} className="p-4 rounded-xl border border-dashed hover:border-solid hover:bg-muted/20 transition-all">
                            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">{(t.project as any)?.name}</p>
                            <p className="font-bold text-sm text-foreground/80 mb-2">{t.title}</p>
                            <p className="text-[9px] font-black uppercase inline-flex items-center gap-1 text-destructive/70">
                               <Clock className="h-3 w-3" /> Inativa há {days} dias
                            </p>
                         </div>
                       );
                     })}
                   </div>
                 </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Content Column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Projetos Status */}
          <Card className="border-none shadow-lg ring-1 ring-border/50 bg-background/50">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-between">
                 Saúde dos Projetos
                 <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pt-2 pb-4">
              {projects.length === 0 && <p className="p-8 text-center text-xs text-muted-foreground italic">Nenhum projeto ativo.</p>}
              <div className="space-y-4">
                {spaces.map(space => {
                  const spaceProjects = projects.filter(p => p.space_id === space.id);
                  if (spaceProjects.length === 0) return null;

                  return (
                    <div key={space.id} className="space-y-1">
                      <div className="px-3 py-1 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: space.color || '#64748b' }} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">{space.name}</span>
                      </div>
                      <div className="space-y-0.5">
                        {spaceProjects.map(p => {
                          const clientTasks = tasks.filter(t => t.project_id === p.id);
                          const activeT = clientTasks.filter(t => !isDone(t)).length;
                          const overdueT = clientTasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && !isDone(t)).length;

                          return (
                            <Link to={`/projetos/${p.id}/kanban`} key={p.id} className="group flex items-center justify-between p-3.5 rounded-xl hover:bg-primary/[0.03] transition-all">
                              <div className="space-y-1">
                                <p className="font-extrabold text-sm group-hover:text-primary transition-colors">{p.name}</p>
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <Activity className="h-3 w-3" /> {activeT} ativas
                                  </span>
                                  {overdueT > 0 && (
                                    <span className="flex items-center gap-1 text-[9px] text-destructive font-black uppercase tracking-wider">
                                       <AlertCircle className="h-3 w-3" /> {overdueT} atrasadas
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline" className="opacity-0 group-hover:opacity-100 text-[10px]">&rarr;</Badge>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Projects without Space */}
                {projects.filter(p => !p.space_id).length > 0 && (
                  <div className="space-y-1">
                    <div className="px-3 py-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Sem Espaço</span>
                    </div>
                    {projects.filter(p => !p.space_id).map(p => {
                       // ... same rendering logic ...
                       const clientTasks = tasks.filter(t => t.project_id === p.id);
                       const activeT = clientTasks.filter(t => !isDone(t)).length;
                       return (
                        <Link to={`/projetos/${p.id}/kanban`} key={p.id} className="group flex items-center justify-between p-3.5 rounded-xl hover:bg-primary/[0.03] transition-all">
                           <p className="font-extrabold text-sm group-hover:text-primary transition-colors">{p.name}</p>
                           <span className="text-[9px] font-bold text-muted-foreground uppercase">{activeT} ativas</span>
                        </Link>
                       );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Productivity Widget */}
          <Card className="border-none shadow-lg ring-1 ring-border/50 bg-accent/[0.03]">
             <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent">Taxa de Sucesso</p>
                     <p className="text-3xl font-black">{categorizedTasks.progress}%</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <Progress value={categorizedTasks.progress} className="h-1.5 bg-accent/10" />
                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-4 text-center tracking-widest">
                   Performance Global da Agência
                </p>
             </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

