import { LayoutDashboard, FolderKanban, Settings, LogOut, Users, Zap, ShieldCheck, HelpCircle, BarChart3, Lock } from 'lucide-react';
import { PLANS, type PlanType } from '@/config/plans';
import { NavLink } from '@/components/NavLink';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Projetos',  url: '/projetos',  icon: FolderKanban },
  { title: 'Equipe',    url: '/team',      icon: Users },
  { title: 'Relatórios', url: '/reports',   icon: BarChart3 },
  { title: 'CRM',       url: '/crm',       icon: Zap, badge: 'Novo' },
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile, agency, signOut } = useAuth();
  const location = useLocation();

  const currentPlanType = (agency?.plan_type?.toLowerCase() || 'trial') as PlanType;
  const planConfig = PLANS[currentPlanType] || PLANS.trial;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-background/50 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center shrink-0">
            <img
              src="/K transparante.png"
              alt="Kanba"
              style={{ height: 36, width: 'auto', filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.4))' }}
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                fontSize: '1.3rem',
                letterSpacing: '0.14em',
                background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 35%, #FBBF24 75%, #FDE047 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}>KANBA</span>
              <span style={{ fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.2em', color: '#64748b', textTransform: 'uppercase', marginTop: 3 }}>Gestão Inteligente</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems
                .filter(item => {
                  if (item.title === 'Relatórios') {
                    return profile?.role === 'owner' || profile?.role === 'manager';
                  }
                  return true;
                })
                .map(item => {
                  const isLocked = (item.title === 'Relatórios' && !planConfig.has_reports) || 
                                   (item.title === 'CRM' && !planConfig.has_whatsapp);
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={cn("h-11", isLocked && "opacity-50 cursor-not-allowed")}
                        disabled={isLocked}
                      >
                        {isLocked ? (
                          <div className="flex items-center gap-3 px-3 w-full text-muted-foreground/60 select-none">
                            <div className="p-1.5 rounded-md bg-transparent">
                              <item.icon className="h-4.5 w-4.5" />
                            </div>
                            {!collapsed && <span className="text-sm tracking-tight">{item.title}</span>}
                            {!collapsed && <Lock className="h-3 w-3 ml-auto opacity-50" />}
                          </div>
                        ) : (
                          <NavLink 
                            to={item.url} 
                            end={item.url === '/dashboard'} 
                            className="group flex items-center gap-3 px-3 rounded-lg transition-all duration-300 hover:bg-primary/10" 
                            activeClassName="bg-primary/15 text-primary font-bold shadow-sm ring-1 ring-primary/20"
                          >
                            <div className={cn(
                              "p-1.5 rounded-md transition-colors",
                              location.pathname === item.url ? "bg-primary/20" : "bg-transparent group-hover:bg-primary/10"
                            )}>
                              <item.icon className="h-4.5 w-4.5" />
                            </div>
                            {!collapsed && <span className="text-sm tracking-tight">{item.title}</span>}
                            {!collapsed && item.badge && (
                              <Badge className="ml-auto bg-primary text-primary-foreground border-none h-4 px-1.5 text-[8px] font-black uppercase tracking-tighter shadow-lg shadow-primary/20">
                                {item.badge}
                              </Badge>
                            )}
                          </NavLink>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mt-auto px-6 py-8">
             <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 ring-1 ring-border/50 space-y-3 shadow-xl shadow-primary/5">
                 <div className="flex items-center gap-2 text-primary">
                  <Zap className="h-3.5 w-3.5 fill-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Plano {planConfig.name}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold leading-tight">Métricas e Fluxos</p>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">
                    {planConfig.has_whatsapp ? 'WhatsApp e Relatórios Ativos.' : 'Upgrade para liberar WhatsApp.'}
                  </p>
                </div>
                <Button variant="ghost" className="w-full h-7 text-[9px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors">
                  Ver Relatórios
                </Button>
             </div>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/40 bg-muted/20">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-1">
            <Avatar className="h-10 w-10 ring-2 ring-primary/10 ring-offset-2 ring-offset-background transition-transform hover:scale-105 cursor-pointer shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary-foreground text-primary-foreground font-black text-sm uppercase">
                {profile?.full_name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate tracking-tight">{profile?.full_name}</p>
                <div className="flex items-center gap-1.5">
                   <Badge variant="outline" className="h-4 px-1 text-[8px] border-primary/20 text-primary uppercase font-black tracking-tighter">{planConfig.name}</Badge>
                   <p className="text-[9px] text-muted-foreground truncate italic">{agency?.name}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-1">
             <Button 
                variant="ghost" 
                size="icon" 
                className={cn("text-muted-foreground hover:text-primary hover:bg-primary/10", !collapsed && "flex-1 h-9 gap-2 justify-center font-bold text-[10px] uppercase tracking-widest")}
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && 'Sair da Conta'}
              </Button>
              {!collapsed && (
                <Link to="/settings" className="w-9 h-9 flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted transition-colors">
                   <Settings className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
