import { useState } from 'react';
import { 
  LayoutDashboard, FolderKanban, Settings, LogOut, Users, 
  BarChart3, Lock, Plus, Wallet, BookOpen, Building2,
  ChevronsUpDown, Check
} from 'lucide-react';
import { PLANS, type PlanType } from '@/config/plans';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CreateSpaceModal } from '@/components/features/CreateSpaceModal';

const globalMenuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Projetos',  url: '/projetos',  icon: FolderKanban },
  { title: 'Equipe',    url: '/team',      icon: Users },
  { title: 'Relatórios', url: '/reports',   icon: BarChart3 },
  { title: 'CRM Vendas', url: '/crm',       icon: Wallet },
  { title: 'Wiki / Docs', url: '/wiki',    icon: BookOpen },
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  
  const { profile, agency, signOut } = useAuth();
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId } = useWorkspace();
  
  const location = useLocation();
  const navigate = useNavigate();

  const currentPlanType = (agency?.plan_type?.toLowerCase() || 'trial') as PlanType;
  const planConfig = PLANS[currentPlanType] || PLANS.trial;
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-background/50 backdrop-blur-xl">
      <SidebarHeader className="p-4 flex flex-col gap-4">
        {/* Logo */}
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

        {/* Workspace Switcher Dropdown */}
        {profile?.agency_role?.role_type !== 'client' && (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton 
                    size="lg" 
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-border/50 shadow-sm"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                      {activeWorkspace ? activeWorkspace.name.charAt(0).toUpperCase() : <Building2 className="h-4 w-4" />}
                    </div>
                    {!collapsed && (
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold text-foreground">
                          {activeWorkspace ? activeWorkspace.name : "Visão Global"}
                        </span>
                        <span className="truncate text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                          {activeWorkspace ? "Workspace" : "Inbox & Resumo"}
                        </span>
                      </div>
                    )}
                    {!collapsed && <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border-border/50 shadow-xl"
                  align="start"
                  side={collapsed ? "right" : "bottom"}
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contexto Atual</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveWorkspaceId(null);
                      navigate('/dashboard');
                    }}
                    className={cn("gap-3 p-2 cursor-pointer", activeWorkspaceId === null && "bg-primary/10")}
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Building2 className="size-3.5 shrink-0" />
                    </div>
                    <span className="font-semibold text-sm">Visão Global</span>
                    {activeWorkspaceId === null && <Check className="ml-auto h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Workspaces</DropdownMenuLabel>
                  {workspaces.map((workspace) => (
                    <DropdownMenuItem
                      key={workspace.id}
                      onClick={() => {
                        setActiveWorkspaceId(workspace.id);
                        navigate('/dashboard');
                      }}
                      className={cn("gap-3 p-2 cursor-pointer", activeWorkspaceId === workspace.id && "bg-primary/10")}
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border bg-primary/20 text-primary font-bold text-xs">
                        {workspace.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm">{workspace.name}</span>
                      {activeWorkspaceId === workspace.id && <Check className="ml-auto h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem className="gap-3 p-2 cursor-pointer text-primary" onClick={() => setCreateSpaceOpen(true)}>
                    <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
                      <Plus className="size-3.5" />
                    </div>
                    <span className="font-bold text-sm">Novo Workspace</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3">
          {activeWorkspaceId !== null && !collapsed && (
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                Menu do Workspace
              </span>
            </div>
          )}
          
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              
              {activeWorkspaceId === null ? (
                // GLOBAL VIEW MENU
                <SidebarMenuItem>
                  <NavLink 
                    to="/dashboard" 
                    end
                    className="group flex items-center gap-3 px-3 h-11 rounded-lg transition-all duration-300 hover:bg-primary/10" 
                    activeClassName="bg-primary/15 text-primary font-bold shadow-sm ring-1 ring-primary/20"
                  >
                    <div className={cn(
                      "p-1.5 rounded-md transition-colors",
                      location.pathname === '/dashboard' ? "bg-primary/20 text-primary" : "text-muted-foreground bg-transparent group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      <LayoutDashboard className="h-4.5 w-4.5" />
                    </div>
                    {!collapsed && <span className="text-sm font-semibold tracking-tight">Dashboard Global</span>}
                  </NavLink>
                </SidebarMenuItem>
              ) : (
                // WORKSPACE MENU
                globalMenuItems
                  .filter(item => {
                    if (profile?.agency_role?.role_type === 'client') {
                      return ['Dashboard', 'Projetos', 'Wiki / Docs'].includes(item.title);
                    }
                    if (item.title === 'Relatórios') return profile?.agency_role?.permissions?.view_reports || profile?.role === 'owner';
                    if (item.title === 'CRM Vendas') return profile?.agency_role?.permissions?.crm_access || profile?.role === 'owner';
                    if (item.title === 'Equipe') return profile?.agency_role?.permissions?.manage_roles || profile?.role === 'owner';
                    if (item.title === 'Configurações') {
                      return profile?.agency_role?.permissions?.agency_settings || profile?.role === 'owner';
                    }
                    return true;
                  })
                  .map(item => {
                    const isLocked = (item.title === 'Relatórios' && !planConfig.has_reports) || 
                                     (item.title === 'CRM Vendas' && !planConfig.has_whatsapp);
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={cn("h-11 transition-all duration-300", isLocked && "opacity-50 cursor-not-allowed")}
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
                              className="group flex items-center gap-3 px-3 rounded-lg hover:bg-primary/10" 
                              activeClassName="bg-primary/15 text-primary font-bold shadow-sm ring-1 ring-primary/20"
                            >
                              <div className={cn(
                                "p-1.5 rounded-md transition-colors",
                                location.pathname.startsWith(item.url) && item.title !== 'Dashboard' ? "bg-primary/20 text-primary" : "text-muted-foreground bg-transparent group-hover:bg-primary/10 group-hover:text-primary"
                              )}>
                                <item.icon className="h-4.5 w-4.5" />
                              </div>
                              {!collapsed && <span className="text-sm tracking-tight">{item.title}</span>}
                            </NavLink>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })
              )}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/40 bg-muted/20">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-1">
            <Avatar className="h-10 w-10 ring-2 ring-primary/10 ring-offset-2 ring-offset-background transition-transform hover:scale-105 cursor-pointer shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary-foreground text-primary-foreground font-black text-sm uppercase">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate tracking-tight text-foreground">{profile?.full_name}</p>
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
          </div>
        </div>
      </SidebarFooter>
      <CreateSpaceModal 
        open={createSpaceOpen} 
        onOpenChange={setCreateSpaceOpen} 
      />
    </Sidebar>
  );
}
