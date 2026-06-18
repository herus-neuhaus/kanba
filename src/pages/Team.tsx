import { useState } from 'react';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { useInvites } from '@/hooks/useInvites';
import { useRoles } from '@/hooks/useRoles';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Copy, Check, Trash2, Mail, Clock, MoreVertical, Shield, ShieldCheck, UserMinus, UserCheck, UserX, Folder, Globe, ShieldAlert, Plus, Edit2, Zap, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ProjectAccessDialog } from '@/components/features/ProjectAccessDialog';
import { PLANS, type PlanType } from '@/config/plans';

const MODULES = [
  {
    category: 'Projetos',
    permissions: [
      { key: 'projects_view', label: 'Ver Projetos' },
      { key: 'projects_create', label: 'Criar Projetos' },
      { key: 'projects_delete', label: 'Excluir Projetos' },
    ]
  },
  {
    category: 'Tarefas',
    permissions: [
      { key: 'tasks_edit', label: 'Editar e Excluir Quaisquer Tarefas' },
      { key: 'tasks_create', label: 'Criar Tarefas' },
    ]
  },
  {
    category: 'Agência e Relatórios',
    permissions: [
      { key: 'view_reports', label: 'Ver Relatórios Financeiros/Produtividade' },
      { key: 'crm_access', label: 'Acesso ao CRM e Leads' },
      { key: 'agency_settings', label: 'Configurações Administrativas' },
      { key: 'manage_roles', label: 'Gerenciar Cargos e Permissões' },
    ]
  }
];

export default function Team() {
  const { data: team = [], updateStatus, removeMember } = useTeam();
  const { data: invites = [], createInvite, deleteInvite } = useInvites();
  const { roles, updateRolePermissions, createRole: createRoleMutation, deleteRole, updateRoleName } = useRoles();
  const { user, profile, agency } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Membros Tab States
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [roleToInvite, setRoleToInvite] = useState('member');
  const [inviteTab, setInviteTab] = useState<'team' | 'client'>('team');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Cargos Tab States
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleType, setNewRoleType] = useState<'internal' | 'client'>('internal');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const { data: projects = [] } = useProjects();
  const currentPlanType = (agency?.plan_type?.toLowerCase() || 'trial') as PlanType;
  const planConfig = PLANS[currentPlanType] || PLANS.trial;
  const userLimit = planConfig.max_users;
  const isOverLimit = team.length >= userLimit;
  const isOwner = profile?.role === 'owner';

  // Handlers
  const handleOpenAccess = (user: { id: string, name: string }) => {
    setSelectedUser(user);
    setAccessDialogOpen(true);
  };

  const handleCreateInvite = async () => {
    try {
      const isClientInvite = inviteTab === 'client';
      const clientRole = roles.find(r => r.role_type === 'client' && r.is_default);
      
      const payload: any = { 
        email: email || undefined,
        role: isClientInvite ? 'cliente' : undefined 
      };

      if (isClientInvite) {
        if (!selectedProjectId) {
          toast({ title: 'Atenção', description: 'Selecione um projeto para o cliente', variant: 'destructive' });
          return;
        }
        payload.role_id = clientRole?.id;
        payload.project_id = selectedProjectId;
      } else {
        const selectedRoleObj = roles.find(r => r.id === roleToInvite);
        if (selectedRoleObj) {
          payload.role_id = selectedRoleObj.id;
          payload.role = selectedRoleObj.name.toLowerCase();
        } else {
          payload.role = roleToInvite;
        }
      }

      await createInvite.mutateAsync(payload);
      setInviteOpen(false);
      setEmail('');
      setRoleToInvite('member');
      setSelectedProjectId('');
      toast({ title: 'Convite criado!', description: 'Agora você pode copiar o link e enviar.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.protocol}//${window.location.host}/join/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    toast({ title: 'Link copiado!' });
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleTogglePermission = async (role: any, key: string, currentValue: boolean) => {
    const newPermissions = { ...role.permissions, [key]: !currentValue };
    try {
      await updateRolePermissions.mutateAsync({ id: role.id, permissions: newPermissions });
      toast({ title: 'Permissão atualizada' });
    } catch (e) {
      toast({ title: 'Erro ao atualizar permissão', variant: 'destructive' });
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      await createRoleMutation.mutateAsync({ 
        name: newRoleName.trim(), 
        role_type: newRoleType,
        permissions: { projects_view: true, tasks_create: true }
      });
      setNewRoleName('');
      setIsCreateRoleOpen(false);
      toast({ title: 'Cargo criado com sucesso!' });
    } catch (e) {
      toast({ title: 'Erro ao criar cargo', variant: 'destructive' });
    }
  };

  const handleSaveRoleName = async (id: string) => {
    if (!editNameValue.trim()) return;
    try {
      await updateRoleName.mutateAsync({ id, name: editNameValue.trim() });
      setEditingNameId(null);
      toast({ title: 'Nome do cargo atualizado' });
    } catch (e) {
      toast({ title: 'Erro ao atualizar nome', variant: 'destructive' });
    }
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const isEditingSelfRole = selectedRole?.id === profile?.role_id;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic">Gestão Estratégica <span className="text-primary not-italic inline-block">Equipe</span></h1>
          <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest opacity-60">Controle de Membros, Clientes e Autoridade</p>
        </div>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="bg-muted/20 p-1 rounded-2xl border border-border/50 h-auto mb-8">
          <TabsTrigger value="members" className="data-[state=active]:bg-background data-[state=active]:shadow-lg rounded-xl px-8 py-3 font-black uppercase text-xs tracking-widest gap-2">
            <Users className="w-4 h-4" /> Membros e Clientes
          </TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-background data-[state=active]:shadow-lg rounded-xl px-8 py-3 font-black uppercase text-xs tracking-widest gap-2">
            <ShieldCheck className="w-4 h-4" /> Cargos e Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <div className="flex justify-end">
            {isOwner && (
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="shadow-lg shadow-primary/20 gap-2 font-black uppercase tracking-widest text-xs h-12" onClick={(e) => { if (isOverLimit) { e.preventDefault(); setUpgradeOpen(true); } }}>
                    <UserPlus className="h-4 w-4" /> Novo Acesso
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md border-none shadow-2xl bg-background/95 backdrop-blur-xl rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Expedição de Convite</DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-widest">Defina o nível de acesso para o novo integrante.</DialogDescription>
                  </DialogHeader>
                  <Tabs value={inviteTab} onValueChange={(v) => setInviteTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="team" className="font-bold uppercase text-[10px] tracking-widest">Equipe Interna</TabsTrigger>
                      <TabsTrigger value="client" className="font-bold uppercase text-[10px] tracking-widest">Cliente Externo</TabsTrigger>
                    </TabsList>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Email do Convidado</label>
                        <Input placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} className="h-11 bg-muted/20 border-none ring-1 ring-border focus-visible:ring-primary font-bold" />
                      </div>
                      <TabsContent value="team" className="space-y-4 m-0 border-none p-0 shadow-none">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Cargo do Time</label>
                          <Select value={roleToInvite} onValueChange={setRoleToInvite}>
                            <SelectTrigger className="h-11 bg-muted/20 border-none ring-1 ring-border focus-visible:ring-primary font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent className="border-none shadow-2xl bg-background/95 backdrop-blur-xl font-bold">
                              {roles.filter(r => r.role_type === 'internal').map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name} {r.is_immutable && r.name.toLowerCase() === 'dono' ? '(Master)' : ''}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>
                      <TabsContent value="client" className="space-y-4 m-0 border-none p-0 shadow-none">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Projeto do Cliente</label>
                          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                            <SelectTrigger className="h-11 bg-muted/20 border-none ring-1 ring-border focus-visible:ring-primary font-bold"><SelectValue placeholder="Selecione o Projeto" /></SelectTrigger>
                            <SelectContent className="border-none shadow-2xl bg-background/95 backdrop-blur-xl font-bold">
                              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                  <DialogFooter className="gap-2">
                    <Button variant="ghost" className="font-bold text-xs uppercase" onClick={() => setInviteOpen(false)}>Cancelar</Button>
                    <Button className="font-black text-xs uppercase" onClick={handleCreateInvite}>Gerar Acesso</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Card className="border-none shadow-2xl ring-1 ring-border/50 bg-background/60 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary/10 rounded-xl"><Users className="h-5 w-5 text-primary" /></div>
                 <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Status do Time</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{team.length} de {userLimit} Assentos Ocupados</CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/5">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Usuário</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Nível de Acesso</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {team.map(m => (
                      <tr key={m.id} className="group hover:bg-primary/[0.02] transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-background shadow-lg ring-1 ring-border/50">
                              <AvatarFallback className="bg-gradient-to-br from-primary to-primary-foreground text-background font-black text-xs">{m.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-black text-sm uppercase tracking-tight flex items-center gap-2">{m.full_name} {m.id === user?.id && <Badge className="bg-primary/10 text-primary border-none text-[8px] h-4 py-0 uppercase">VOCÊ</Badge>}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 opacity-60">{m.agency_role?.role_type === 'client' ? 'Portal do Cliente' : 'Equipe Interna'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <Badge className={`uppercase text-[9px] font-black tracking-widest h-5 ${m.status === 'inactive' ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-100 text-emerald-700'}`}>
                             {m.status === 'inactive' ? 'Inativo' : 'Ativo'}
                          </Badge>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-2">
                              {m.agency_role?.role_type === 'client' ? (
                                <>
                                  <Globe className="h-3 w-3 text-muted-foreground" />
                                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-muted-foreground/30 text-muted-foreground">Portal do Cliente</Badge>
                                </>
                              ) : (
                                <>
                                  <Shield className={`h-3 w-3 ${m.role === 'owner' ? 'text-amber-500' : 'text-primary'}`} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">{m.role || 'Membro'}</span>
                                </>
                              )}
                           </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                           {isOwner && m.id !== user?.id && (
                              <DropdownMenu>
                                 <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                 <DropdownMenuContent align="end" className="border-none shadow-2xl bg-background/95 backdrop-blur-xl p-1 rounded-xl">
                                    <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest gap-2 cursor-pointer focus:bg-primary/10" onClick={() => handleOpenAccess({ id: m.id, name: m.full_name || '' })}><ShieldCheck className="h-3 w-3" /> Acessos Projetos</DropdownMenuItem>
                                    <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest gap-2 cursor-pointer text-destructive focus:bg-primary/10" onClick={() => removeMember.mutate(m.id)}><UserX className="h-3 w-3" /> Remover</DropdownMenuItem>
                                 </DropdownMenuContent>
                              </DropdownMenu>
                           )}
                        </td>
                      </tr>
                    ))}
                    {invites.map(invite => (
                      <tr key={invite.id} className="bg-amber-50/10 opacity-70">
                        <td className="px-6 py-5"><div className="flex items-center gap-3"><Mail className="h-4 w-4 text-amber-500" /><span className="text-xs font-bold text-muted-foreground">{invite.email || 'Link Público'}</span></div></td>
                        <td className="px-6 py-5"><Badge className="bg-amber-100 text-amber-700 uppercase text-[9px] font-black tracking-widest h-5">Pendente</Badge></td>
                        <td className="px-6 py-5"><span className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">{invite.role}</span></td>
                        <td className="px-6 py-5 text-right"><Button size="sm" onClick={() => copyToClipboard(invite.token)} className="h-7 text-[9px] font-black uppercase">{copiedToken === invite.token ? 'Copiado' : 'Copiar Link'}</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Configuração de Alçada</h2>
              <p className="text-sm text-muted-foreground">Gerencie quem pode visualizar o quê e os tipos de cargos.</p>
            </div>
            <Button onClick={() => setIsCreateRoleOpen(true)} className="gap-2 shadow-lg">
              <Plus className="w-4 h-4" /> Criar Novo Cargo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => (
              <div key={role.id} className="border border-border/50 rounded-2xl p-5 hover:border-primary/50 transition-all bg-card flex flex-col justify-between group h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl ${role.role_type === 'client' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                      {role.role_type === 'client' ? <Globe className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    </div>
                    {role.is_immutable && <Badge variant="secondary" className="text-[8px] font-black uppercase">Fixo</Badge>}
                  </div>
                  <div>
                    {editingNameId === role.id ? (
                      <Input value={editNameValue} autoFocus onChange={e => setEditNameValue(e.target.value)} onBlur={() => handleSaveRoleName(role.id)} className="h-8 font-bold" />
                    ) : (
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        {role.name}
                        {!role.is_immutable && <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-40 cursor-pointer" onClick={() => { setEditingNameId(role.id); setEditNameValue(role.name); }} />}
                      </h3>
                    )}
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight opacity-70">
                      {role.role_type === 'client' ? 'Tipo: Portal do Cliente' : 'Tipo: Interno Agência'}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <Button variant="secondary" size="sm" className="w-full font-bold text-[10px] uppercase tracking-widest" onClick={() => setSelectedRoleId(role.id)}>Ajustar Permissões</Button>
                  {!role.is_immutable && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteRole.mutate(role.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={!!selectedRoleId} onOpenChange={(o) => !o && setSelectedRoleId(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md border-l border-border/50 shadow-2xl">
          <SheetHeader className="mb-8">
            <SheetTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">{selectedRole?.name}</SheetTitle>
            <SheetDescription>Configure as chaves de acesso para este cargo.</SheetDescription>
          </SheetHeader>
          <div className="space-y-8">
            {MODULES.map((module) => (
              <div key={module.category} className="bg-muted/30 p-5 rounded-2xl border border-border/50">
                <h4 className="font-bold text-[10px] tracking-widest uppercase text-muted-foreground mb-4 opacity-60">{module.category}</h4>
                <div className="space-y-5">
                  {module.permissions.map((perm) => {
                    const enabled = !!selectedRole?.permissions[perm.key];
                    return (
                      <div key={perm.key} className="flex items-center justify-between">
                        <label className="text-xs font-bold leading-none cursor-pointer">{perm.label}</label>
                        <Switch 
                          checked={enabled} 
                          disabled={selectedRole?.is_immutable || isEditingSelfRole}
                          onCheckedChange={() => handleTogglePermission(selectedRole, perm.key, enabled)} 
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
        <DialogContent className="border-none shadow-2xl rounded-2xl">
          <DialogHeader><DialogTitle className="font-black uppercase tracking-tight">Novo Cargo</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nome Amigável</label>
              <Input placeholder="Ex: Diretor de Arte" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="h-11 font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Tipo de Alçada</label>
              <Select value={newRoleType} onValueChange={v => setNewRoleType(v as any)}>
                <SelectTrigger className="h-11 font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="font-bold">
                  <SelectItem value="internal">Equipe Interna (Dashboard)</SelectItem>
                  <SelectItem value="client">Portal do Cliente (Restrito)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreateRole}>Criar Protética</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reused Helper Dialogs */}
      {selectedUser && (
        <ProjectAccessDialog profileId={selectedUser.id} profileName={selectedUser.name} isOpen={accessDialogOpen} onOpenChange={setAccessDialogOpen} />
      )}
      
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-md text-center border-none shadow-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black mx-auto mt-2 uppercase tracking-tighter">Assentos Esgotados</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"><Zap className="h-8 w-8 text-primary" /></div>
            <p className="text-muted-foreground font-medium px-4 opacity-80 text-sm italic">Sua equipe excedeu o limite do plano atual.</p>
            <Button className="w-full font-black uppercase" onClick={() => navigate('/settings?tab=plans')}>Ver Planos Corporativos</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
