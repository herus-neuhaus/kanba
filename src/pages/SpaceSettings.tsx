import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpaces } from '@/hooks/useSpaces';
import { useTeam } from '@/hooks/useTeam';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Users, ArrowLeft, Save, Trash2, Plus, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SpaceSettings() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { data: spaces = [], updateSpace, deleteSpace } = useSpaces();
  const { data: team = [] } = useTeam();
  const space = spaces.find(s => s.id === spaceId);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState(space?.name || '');
  const [color, setColor] = useState(space?.color || '#64748b');

  const handleUpdate = async () => {
    if (!spaceId) return;
    try {
      await updateSpace.mutateAsync({ id: spaceId, name, color });
      toast({ title: 'Configurações atualizadas!' });
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!spaceId || !confirm('Deseja realmente excluir este espaço e todos os seus projetos?')) return;
    try {
      await deleteSpace.mutateAsync(spaceId);
      toast({ title: 'Espaço excluído com sucesso' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
    }
  };

  if (!space) return <div className="p-8 text-center">Espaço não encontrado.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="space-y-0.5">
          <h1 className="text-3xl font-black tracking-tight">Configurações do Espaço</h1>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">{space.name}</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 border-none gap-1">
          <TabsTrigger value="general" className="gap-2 font-bold px-4 py-2 data-[state=active]:bg-background">
            <Settings className="h-4 w-4" /> Geral
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2 font-bold px-4 py-2 data-[state=active]:bg-background">
            <Users className="h-4 w-4" /> Membros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-border/50 shadow-xl shadow-primary/5 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-8">
              <CardTitle className="text-xl font-black uppercase tracking-tight">Dados do Espaço</CardTitle>
              <CardDescription>Personalize a identidade visual e o nome do seu ambiente de trabalho.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest opacity-70">Nome do Espaço</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} className="h-12 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color" className="text-[10px] font-black uppercase tracking-widest opacity-70">Cor de Identificação</Label>
                  <div className="flex gap-3">
                    <Input id="color" type="color" value={color} onChange={e => setColor(e.target.value)} className="h-12 w-20 p-1 cursor-pointer" />
                    <div className="flex-1 h-12 rounded-lg border flex items-center px-4 text-xs font-bold bg-muted/20" style={{ color }}>
                      Preview da cor
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t flex items-center justify-between">
                <Button variant="destructive" onClick={handleDelete} className="gap-2 font-black uppercase tracking-widest text-[10px]">
                  <Trash2 className="h-4 w-4" /> Excluir Espaço
                </Button>
                <Button onClick={handleUpdate} className="gap-2 font-black uppercase tracking-widest text-[10px] px-8 shadow-lg shadow-primary/20">
                  <Save className="h-4 w-4" /> Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card className="border-border/50 shadow-xl shadow-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Membros do Espaço</CardTitle>
                  <CardDescription>Gerencie quem pode visualizar e interagir com os projetos deste espaço.</CardDescription>
                </div>
                <Button size="sm" className="gap-2 font-bold uppercase tracking-widest text-[10px]">
                  <Plus className="h-3.5 w-3.5" /> Convidar Membro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/40">
                {team.map(member => (
                  <div key={member.id} className="py-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/5">
                        <AvatarFallback className="bg-muted text-xs font-black uppercase">
                          {member.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-black tracking-tight">{member.full_name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{(member as any).email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-primary/20 text-primary bg-primary/5">
                        {member.role === 'admin' ? <Shield className="h-3 w-3 mr-1 inline" /> : null}
                        {member.role || 'Membro'}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
