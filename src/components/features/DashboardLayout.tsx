import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, Link, useParams } from 'react-router-dom';
import { ChevronRight, Home, Bell, Search, User, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { NotificationBell } from './NotificationBell';
import { cn } from '@/lib/utils';
import { useSpaces } from '@/hooks/useSpaces';
import { useProjects } from '@/hooks/useProjects';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, user, signOut, agency } = useAuth();
  const { pathname } = useLocation();
  const { data: spaces = [] } = useSpaces();
  const { data: projects = [] } = useProjects();
  const params = useParams();

  // Helper to build breadcrumbs
  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean);
    const crumbs = [{ label: 'Início', href: '/dashboard', icon: Home }];

    if (parts[0] === 'espacos' && params.spaceId) {
      const space = spaces.find(s => s.id === params.spaceId);
      if (space) {
        crumbs.push({ label: space.name, href: `/espacos/${space.id}`, icon: null });
        if (parts[2] === 'settings') {
          crumbs.push({ label: 'Configurações', href: `/espacos/${space.id}/settings`, icon: null });
        }
      }
    } else if (parts[0] === 'projetos') {
      if (params.projectId) {
        const project = projects.find(p => p.id === params.projectId);
        if (project) {
          const space = spaces.find(s => s.id === project.space_id);
          if (space) crumbs.push({ label: space.name, href: `/espacos/${space.id}`, icon: null });
          crumbs.push({ label: project.name, href: `/projetos/${project.id}/kanban`, icon: null });
        }
      }
    } else if (parts[0] && parts[0] !== 'dashboard') {
      const labelMap: Record<string, string> = {
        'team': 'Equipe',
        'reports': 'Relatórios',
        'crm': 'CRM',
        'settings': 'Configurações'
      };
      crumbs.push({ label: labelMap[parts[0]] || parts[0], href: `/${parts[0]}`, icon: null });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b px-6 shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-[1px] bg-border/60 mx-1 hidden sm:block" />
              
              <nav className="hidden sm:flex items-center gap-2 overflow-x-auto no-scrollbar">
                {breadcrumbs.map((crumb, idx) => (
                  <div key={crumb.href} className="flex items-center gap-2 shrink-0">
                    {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
                    <Link 
                      to={crumb.href}
                      className={cn(
                        "text-[11px] font-black uppercase tracking-widest transition-colors hover:text-primary",
                        idx === breadcrumbs.length - 1 ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {crumb.icon && <crumb.icon className="h-3 w-3 inline mr-1 opacity-70" />}
                      {crumb.label}
                    </Link>
                  </div>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary transition-colors">
                <Search className="h-4.5 w-4.5" />
              </Button>
              <NotificationBell />
              
              <div className="h-4 w-[1px] bg-border/60 mx-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 gap-2 px-1 hover:bg-transparent group">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/10 transition-transform group-hover:scale-105">
                      <AvatarFallback className="bg-primary text-primary-foreground font-black text-[10px]">
                        {profile?.full_name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start text-left leading-none">
                      <span className="text-[10px] font-black uppercase tracking-tight">{profile?.full_name?.split(' ')[0]}</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter opacity-60">{profile?.role}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-2xl border-border/50 backdrop-blur-xl bg-background/95">
                  <DropdownMenuLabel className="flex flex-col p-4">
                    <span className="text-xs font-black uppercase tracking-widest">{profile?.full_name}</span>
                    <span className="text-[10px] text-muted-foreground font-medium mt-1">{user?.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2 p-3 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      <span className="text-xs font-bold">Configurações</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/team" className="flex items-center gap-2 p-3 cursor-pointer">
                      <User className="h-4 w-4" />
                      <span className="text-xs font-bold">Perfil da Equipe</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 p-3 cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    <span className="text-xs font-bold">Sair da Conta</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
