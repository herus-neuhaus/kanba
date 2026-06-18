import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useSpaces } from '@/hooks/useSpaces';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderKanban, MoreVertical, Edit2, Trash2, LayoutDashboard, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from '@/types';

export default function SpaceProjects() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { data: allProjects = [], createProject } = useProjects();
  const { data: spaces = [] } = useSpaces();
  const space = spaces.find(s => s.id === spaceId);
  const projects = allProjects.filter(p => p.space_id === spaceId);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const handleCreateProject = async () => {
    try {
      const name = prompt('Nome do projeto:');
      if (!name) return;
      await createProject.mutateAsync({ name, space_id: spaceId });
      toast({ title: 'Projeto criado com sucesso!' });
    } catch (err: any) {
      toast({ title: 'Erro ao criar projeto', description: err.message, variant: 'destructive' });
    }
  };

  if (!space) return <div className="p-8 text-center">Espaço não encontrado.</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div 
              className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-black text-white shadow-lg"
              style={{ backgroundColor: space.color || '#64748b' }}
            >
              {space.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-3xl font-black tracking-tight">{space.name}</h1>
          </div>
          <p className="text-muted-foreground font-medium">Visualizando todos os projetos deste espaço.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/espacos/${spaceId}/settings`)} className="gap-2 font-bold uppercase tracking-widest text-[10px]">
            <Settings className="h-3.5 w-3.5" /> Gerenciar Espaço
          </Button>
          <Button onClick={handleCreateProject} className="gap-2 font-bold shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Novo Projeto
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-background p-4 rounded-full mb-4 shadow-sm">
              <FolderKanban className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-bold mb-2">Este espaço está vazio</h2>
            <p className="text-muted-foreground max-w-xs mb-6">Crie seu primeiro projeto dentro de {space.name} para começar.</p>
            <Button variant="outline" onClick={handleCreateProject}>Cadastrar projeto</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => (
            <Card key={p.id} className="group hover:ring-2 hover:ring-primary/20 transition-all duration-300 overflow-hidden border-border/50">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary/10 p-2.5 rounded-xl text-primary shadow-inner">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem className="gap-2 font-medium cursor-pointer">
                        <Edit2 className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 font-medium text-destructive focus:text-destructive cursor-pointer">
                        <Trash2 className="h-4 w-4" /> Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-black text-xl mb-2 group-hover:text-primary transition-colors truncate">{p.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] mb-6 font-medium leading-relaxed">
                  {p.description || 'Sem descrição.'}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Ativo</span>
                  </div>
                  <Button 
                    onClick={() => navigate(`/projetos/${p.id}/kanban`)}
                    className="h-9 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 border-none shadow-none"
                  >
                    Abrir Quadro <LayoutDashboard className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
