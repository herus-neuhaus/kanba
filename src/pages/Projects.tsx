import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function Projects() {
  const { data: projects = [], createProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Projeto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input placeholder="Nome do projeto" value={name} onChange={e => setName(e.target.value)} required />
              <Textarea placeholder="Descrição (opcional)" value={description} onChange={e => setDescription(e.target.value)} />
              <Button type="submit" className="w-full" disabled={createProject.isPending}>Criar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum projeto ainda. Crie o primeiro!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <Link to={`/projects/${p.id}`} key={p.id}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-1">{p.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.description || 'Sem descrição'}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
