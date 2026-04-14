import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users, 
  BarChart3, 
  TrendingUp,
  ShieldAlert,
  CalendarCheck,
  Calendar as CalendarIcon,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useAgencyStats } from '@/hooks/useAgencyStats';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const COLORS = ['#FBBF24', '#3B82F6', '#10B981', '#F43F5E', '#8B5CF6', '#EC4899'];

// --- Helpers ---

const formatLeadTime = (days: number) => {
  if (days <= 0) return "0h";
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours}h`;
  }
  return `${days.toFixed(1)} dias`;
};

// --- Custom Components ---

const CustomTooltip = ({ active, payload, label, mode = 'default', total = 0 }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    const name = data.name || label;
    
    // Formatting for Lead Time
    const displayValue = mode === 'leadTime' ? formatLeadTime(value) : value;
    const percentage = mode === 'pie' && total > 0 ? ((value / total) * 100).toFixed(1) : null;

    return (
      <div className="bg-popover/90 border border-border p-3 shadow-2xl rounded-xl backdrop-blur-md ring-1 ring-white/10 animate-in fade-in zoom-in duration-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{name}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-foreground">{displayValue}</span>
          {percentage && (
            <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              {percentage}%
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const KPICard = ({ title, value, icon: Icon, description, variant = 'default', emptyMessage = "Nada aqui ✨" }: any) => {
  const isEmpty = value === 0;
  
  return (
    <Card className="overflow-hidden border-none shadow-lg bg-card/80 backdrop-blur-md ring-1 ring-border group transition-all hover:ring-primary/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-foreground/60 uppercase tracking-[0.2em]">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className={cn(
                "text-4xl font-black tracking-tighter transition-all group-hover:scale-105 origin-left",
                variant === 'destructive' ? 'text-destructive' : 'text-foreground dark:text-white',
                isEmpty && "text-muted-foreground/40"
              )}>
                {isEmpty ? "0" : value}
              </h3>
              {isEmpty && (
                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5 whitespace-nowrap">
                   {emptyMessage}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{description}</p>
          </div>
          <div className={cn(
            "p-4 rounded-2xl transition-all group-hover:rotate-12",
            variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          )}>
            <Icon className="h-7 w-7" />
          </div>
        </div>
      </CardContent>
      <div className={cn(
        "h-1 w-full",
        variant === 'destructive' ? 'bg-destructive' : 'bg-primary'
      )} />
    </Card>
  );
};

// --- Page Component ---

export default function Reports() {
  const { profile } = useAuth();
  
  // Date state default: last 30 days
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const { data: stats, isLoading, isError } = useAgencyStats(dateRange);

  const canAccess = profile?.role === 'owner' || profile?.role === 'manager';

  if (!canAccess && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 animate-fade-in px-4">
        <div className="p-6 rounded-full bg-destructive/10 text-destructive border-2 border-destructive/20 shadow-2xl">
          <ShieldAlert className="h-16 w-16" />
        </div>
        <div className="space-y-2 max-w-md">
            <h1 className="text-3xl font-black tracking-tight">Acesso Restrito</h1>
            <p className="text-muted-foreground font-medium">A área de inteligência é exclusiva para proprietários e gestores.</p>
        </div>
        <Button asChild variant="outline" className="rounded-full px-8">
            <Link to="/dashboard">Voltar para Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header with Date Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tighter decoration-primary/30 underline-offset-8">
             Visão Geral da <span className="text-primary italic text-6xl block sm:inline">Agência</span>
          </h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
             <BarChart3 className="h-4 w-4" /> Inteligência e produtividade operacional
          </p>
        </div>

        <div className="flex flex-col gap-2">
           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Período de Análise</p>
           <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-bold rounded-2xl shadow-sm border-primary/20 h-11 px-4 bg-card",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd LLL", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd LLL", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd LLL", { locale: ptBR })
                  )
                ) : (
                  <span>Selecionar período</span>
                )}
                <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-primary/20" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(val: any) => setDateRange(val)}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoading || !stats ? (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[450px] lg:col-span-2 rounded-3xl" />
            <Skeleton className="h-[450px] rounded-3xl" />
          </div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive opacity-50" />
          <h2 className="text-xl font-bold">Erro ao carregar relatórios</h2>
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard 
              title="Tarefas Ativas" 
              value={stats.kpis.totalActive} 
              icon={Clock} 
              description="No período selecionado"
              emptyMessage="Tudo limpo! ✨"
            />
            <KPICard 
              title="Entregas Realizadas" 
              value={stats.kpis.completed} 
              icon={CheckCircle2} 
              description="Concluídas no período"
              emptyMessage="Bora entregar? 🚀"
            />
            <KPICard 
              title="Tarefas Atrasadas" 
              value={stats.kpis.overdue} 
              icon={AlertCircle} 
              variant="destructive"
              description="Vencidas e sem conclusão"
              emptyMessage="Ótimo trabalho! ✨"
            />
          </div>

          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Workload Chart with Colorful Bars */}
             <Card className="col-span-1 lg:col-span-2 border-none shadow-xl bg-card/50 backdrop-blur-sm ring-1 ring-border border-t-4 border-t-primary">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight">Carga por Equipe</CardTitle>
                    <CardDescription className="text-[11px]">Demandas que estiveram ativas no período</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 h-[300px]">
                {stats.workloadData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                     <Users className="h-8 w-8 opacity-20" />
                     <p className="text-xs font-bold uppercase tracking-widest">Nenhuma atividade registrada</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.workloadData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={120} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: 'currentColor' }}
                      />
                      <Tooltip content={<CustomTooltip unit=" tarefas" />} cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="tasks" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1000}>
                        {stats.workloadData.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
             </Card>

             {/* Lead Time Chart with Formatted Tooltip */}
             <Card className="col-span-1 border-none shadow-xl bg-card/50 backdrop-blur-sm ring-1 ring-border border-t-4 border-t-emerald-500">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight">Performance</CardTitle>
                    <CardDescription className="text-[11px]">Tempo médio de entrega (Lead Time)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 h-[300px]">
                {stats.leadTimeData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                     <Sparkles className="h-8 w-8 opacity-20" />
                     <p className="text-xs font-bold uppercase tracking-widest">Aguardando dados</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.leadTimeData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: 'currentColor' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip mode="leadTime" />} />
                      <Bar dataKey="avgDays" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} activeBar={{ opacity: 0.8 }} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
             </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Bottleneck Pie */}
             <Card className="col-span-1 border-none shadow-xl bg-card/50 backdrop-blur-sm ring-1 ring-border border-t-4 border-t-amber-500">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight">Acúmulo por Projeto</CardTitle>
                    <CardDescription className="text-[11px]">Volume de demandas ativas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 h-[300px]">
                {stats.bottleneckData.length === 0 ? (
                   <div className="h-full flex items-center justify-center text-[10px] font-bold uppercase text-muted-foreground opacity-50">Sem dados no período</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.bottleneckData}
                        cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5}
                        dataKey="value" nameKey="name" stroke="none"
                      >
                        {stats.bottleneckData.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip mode="pie" total={stats.bottleneckData.reduce((a: any, b: any) => a + b.value, 0)} />} />
                      <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[10px] font-bold text-muted-foreground uppercase">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
             </Card>

             {/* Smart Hint */}
             <Card className="lg:col-span-2 border-none shadow-xl bg-primary/5 ring-1 ring-primary/20 flex items-center justify-center p-8 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors pointer-events-none" />
                {stats.bottleneckData.length > 0 ? (
                  <div className="space-y-3 relative z-10">
                    <div className="bg-primary/20 p-3 rounded-full w-fit mx-auto mb-2 animate-bounce">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-black italic tracking-tighter">Insights do Período</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      O projeto <span className="text-primary font-black uppercase">{stats.bottleneckData[0]?.name}</span> representa <span className="text-foreground font-bold">{((stats.bottleneckData[0]?.value / stats.kpis.totalActive) * 100).toFixed(0)}%</span> das demandas ativas. 
                      Considere balancear a equipe para evitar gargalos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 relative z-10">
                    <Sparkles className="h-10 w-10 text-emerald-500 mx-auto" />
                    <h3 className="text-xl font-black italic tracking-tighter">Nada a sugerir ainda</h3>
                    <p className="text-sm text-muted-foreground">Selecione um período com atividade para gerar insights automáticos.</p>
                  </div>
                )}
             </Card>
          </div>
        </>
      )}
    </div>
  );
}

const Zap = ({ className, ...props }: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
