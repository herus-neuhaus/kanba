import { Link } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderKanban, Activity, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ClientDashboard() {
  const { profile } = useAuth();
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: permissions = [], isLoading: isLoadingPermissions } = useProjectPermissions(profile?.id);

  const isLoading = isLoadingProjects || isLoadingPermissions;

  // Se o cliente for de fato restrito, cruzamos os projects com as permissões dele
  const allowedProjects = projects.filter(p => permissions.some(perm => perm.project_id === p.id));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight uppercase italic">Seus <span className="text-primary not-italic inline-block">Projetos</span></h1>
        <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest opacity-60">Selecione um projeto para acompanhar o andamento</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allowedProjects.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-4">
               <div className="mx-auto w-16 h-16 bg-muted/20 rounded-3xl flex items-center justify-center grayscale opacity-50">
                  <FolderKanban className="h-8 w-8" />
               </div>
               <div>
                  <p className="font-black uppercase tracking-[0.3em] text-xs text-muted-foreground">Nenhum projeto liberado</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1">Aguarde a agência conceder acesso a um projeto</p>
               </div>
            </div>
          ) : (
            allowedProjects.map(project => (
              <Link to={`/cliente/projetos/${project.id}/kanban`} key={project.id}>
                <Card className="border-none shadow-lg ring-1 ring-border/50 bg-background/60 backdrop-blur-xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group cursor-pointer h-full">
                  <CardHeader className="pb-3 border-b border-border/50 bg-muted/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-background/50 backdrop-blur-sm border-primary/20 text-primary">
                        Ativo
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h3 className="font-black text-lg tracking-tight group-hover:text-primary transition-colors">{project.name}</h3>
                      {project.description && (
                        <p className="text-xs text-muted-foreground font-medium mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                      <span className="flex items-center gap-1.5 opacity-60">
                         <Activity className="h-3 w-3" /> Visualizar Quadro
                      </span>
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
