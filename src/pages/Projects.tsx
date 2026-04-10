import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, FolderKanban, MoreVertical, Edit2, Trash2, LayoutDashboard, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const PLAN_LIMITS: Record<string, number> = {
  free: 2,
  pro: 10,
  enterprise: 9999
};
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Project } from '@/types';

export default function Projects() {
  const { data: projects = [], createProject, updateProject, deleteProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const { agency } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  
  const limit = PLAN_LIMITS[agency?.plan?.toLowerCase() || 'free'] || 2;
  const isOverLimit = projects.length >= limit;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject.mutateAsync({ name, description });
      setOpen(false);
      setName('');
      setDescription('');
      toast({ title: 'Projeto criado!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    try {
      await updateProject.mutateAsync({ 
        id: editingProject.id, 
        name, 
        description 
      });
      setEditOpen(false);
      setEditingProject(null);
      setName('');
      setDescription('');
      toast({ title: 'Projeto atualizado!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProject.mutateAsync(deleteId);
      toast({ title: 'Projeto deletado' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setEditOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meus Projetos</h1>
          <p className="text-muted-foreground">Gerencie seus projetos e as demandas de cada um ({projects.length}/{limit}).</p>
        </div>
        <Button size="lg" className="shadow-sm" onClick={() => isOverLimit ? setUpgradeOpen(true) : setOpen(true)}>
          <Plus className="h-5 w-5 mr-2" /> Novo Projeto
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Novo Projeto</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Projeto</label>
                <Input placeholder="Ex: Projeto E-commerce Beta" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição / Observações</label>
                <Textarea placeholder="Descreva brevemente o perfil ou demandas do projeto..." value={description} onChange={e => setDescription(e.target.value)} rows={4} />
              </div>
              <Button type="submit" className="w-full" disabled={createProject.isPending}>
                {createProject.isPending ? 'Cadastrando...' : 'Criar Projeto'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <FolderKanban className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Nenhum projeto encontrado</h2>
            <p className="text-muted-foreground max-w-xs mb-6">Comece cadastrando seu primeiro projeto para organizar suas tarefas.</p>
            <Button variant="outline" onClick={() => isOverLimit ? setUpgradeOpen(true) : setOpen(true)}>Cadastrar projeto agora</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => (
            <Card key={p.id} className="group hover:ring-2 hover:ring-primary/20 transition-all duration-300">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(p)} className="cursor-pointer">
                        <Edit2 className="h-4 w-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteId(p.id)} className="text-destructive focus:text-destructive cursor-pointer">
                        <Trash2 className="h-4 w-4 mr-2" /> Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{p.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem] mb-6">
                  {p.description || 'Nenhuma descrição fornecida para este projeto.'}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="bg-muted px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Ativo
                  </div>
                  <Button 
                    onClick={() => navigate(`/projetos/${p.id}/kanban`)}
                    className="gap-2 font-medium"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Abrir Kanban
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Projeto</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateProject.isPending}>
                {updateProject.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja deletar este projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto e todas as demandas (tarefas) associadas a ele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Paywall Dialog */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black mx-auto mt-2">Limite Atingido</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
               <AlertCircle className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground font-medium px-4">
              Sua agência atingiu o limite de <strong className="text-foreground">{limit} projetos</strong> do plano atual (<span className="uppercase text-primary font-bold">{agency?.plan || 'Free'}</span>).
            </p>
            <div className="bg-muted/50 p-4 rounded-xl text-sm font-bold text-foreground mx-4">
              Dê o próximo passo! Faça um upgrade para continuar criando novos projetos e escalando suas operações sem limites.
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2 w-full">
            <Button className="w-full font-bold shadow-lg shadow-primary/20" size="lg" onClick={() => {
                 setUpgradeOpen(false);
            }}>
               Fazer Upgrade Agora 🚀
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setUpgradeOpen(false)}>
               Talvez mais tarde
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
