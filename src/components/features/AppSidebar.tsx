import { LayoutDashboard, FolderKanban, Settings, LogOut, Users, Zap, ShieldCheck, HelpCircle } from 'lucide-react';
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

import LogoImg from '@/img/K logo 512z512.png';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Projetos', url: '/projetos', icon: FolderKanban },
  { title: 'Equipe', url: '/team', icon: Users },
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile, agency, signOut } = useAuth();
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-background/50 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 overflow-hidden shadow-inner shrink-0">
            <img src={LogoImg} alt="Kanba logo" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter leading-none italic">KANBA</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 leading-tight mt-1">Gestão Inteligente</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11">
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/'} 
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
                      {!collapsed && item.title === 'Atrasadas' && (
                        <Badge className="ml-auto bg-destructive/10 text-destructive border-none h-5 text-[10px] font-black">3</Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mt-auto px-6 py-8">
             <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 ring-1 ring-border/50 space-y-3 shadow-xl shadow-primary/5">
                <div className="flex items-center gap-2 text-primary">
                  <Zap className="h-3.5 w-3.5 fill-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Nível Pro</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold leading-tight">Métricas Avançadas</p>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">Suas automações de WhatsApp estão ativas para este ciclo.</p>
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
                   <Badge variant="outline" className="h-4 px-1 text-[8px] border-primary/20 text-primary uppercase font-black tracking-tighter">Owner</Badge>
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
