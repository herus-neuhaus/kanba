import { useState } from 'react';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { useInvites } from '@/hooks/useInvites';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Copy, Check, Trash2, Mail, Clock, MoreVertical, Shield, ShieldCheck, UserMinus, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export default function Team() {
  const { data: team = [], updateStatus, removeMember } = useTeam();
  const { data: invites = [], createInvite, deleteInvite } = useInvites();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const isOwner = profile?.role === 'owner';

  const handleCreateInvite = async () => {
    try {
      await createInvite.mutateAsync({ email: email || undefined, role });
      setOpen(false);
      setEmail('');
      toast({ title: 'Convite criado!', description: 'Agora você pode copiar o link e enviar para o novo membro.' });
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

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic">Gestão <span className="text-primary not-italic inline-block">Equipe</span></h1>
          <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest opacity-60">Diretoria Operacional da Agência</p>
        </div>
        
        {isOwner && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg shadow-primary/20 gap-2 font-black uppercase tracking-widest text-xs h-12">
                <UserPlus className="h-4 w-4" /> Novo Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-none shadow-2xl bg-background/95 backdrop-blur-xl rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Expedição de Convite</DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-widest">
                  Ative o protocolo de recrutamento para novos membros.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Email Corporativo (Opcional)</label>
                  <Input 
                    placeholder="operacional@agencia.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="h-11 bg-muted/20 border-none ring-1 ring-border focus-visible:ring-primary font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Nível de Autoridade</label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-11 bg-muted/20 border-none ring-1 ring-border focus-visible:ring-primary font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-none shadow-2xl bg-background/95 backdrop-blur-xl font-bold">
                      <SelectItem value="member">Colaborador (Nível 1)</SelectItem>
                      <SelectItem value="manager">Gerente (Nível 2)</SelectItem>
                      <SelectItem value="owner">Dono (Nível Master)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" className="font-bold text-xs uppercase" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button className="font-black text-xs uppercase" onClick={handleCreateInvite} disabled={createInvite.isPending}>
                  {createInvite.isPending ? 'Emitindo...' : 'Gerar Código de Acesso'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="border-none shadow-2xl ring-1 ring-border/50 bg-background/60 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-xl">
                <Users className="h-5 w-5 text-primary" />
             </div>
             <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Status do Time</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Quadro Ativo e Convites em Processamento</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/50 bg-muted/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Colaborador</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Autoridade</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {/* Active and Inactive Members (Profiles) */}
                {team.map(m => (
                  <tr key={m.id} className="group hover:bg-primary/[0.02] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-lg ring-1 ring-border/50">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary-foreground text-background font-black text-xs">
                            {m.full_name?.substring(0, 2)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                             {m.full_name}
                             {m.id === user?.id && <Badge className="bg-primary/10 text-primary border-none text-[8px] h-4 py-0 uppercase">VOCÊ</Badge>}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{m.phone || 'Sem Telefone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge className={`uppercase text-[9px] font-black tracking-widest h-5 ${m.status === 'inactive' ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                         {m.status === 'inactive' ? 'Inativo' : 'Ativo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2">
                          <Shield className={`h-3 w-3 ${m.role === 'owner' ? 'text-amber-500' : 'text-blue-500'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{m.role || 'membro'}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       {isOwner && m.id !== user?.id && (
                          <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                                   <MoreVertical className="h-4 w-4" />
                                </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end" className="border-none shadow-2xl bg-background/95 backdrop-blur-xl p-1 rounded-xl">
                                <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest gap-2 cursor-pointer focus:bg-primary/10">
                                   <ShieldCheck className="h-3 w-3" /> Alterar Permissão
                                </DropdownMenuItem>
                                {m.status !== 'inactive' ? (
                                   <DropdownMenuItem 
                                     className="text-[10px] font-black uppercase tracking-widest gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                                     onClick={() => updateStatus.mutate({ userId: m.id, status: 'inactive' }, {
                                       onSuccess: () => toast({ title: 'Acesso suspenso', description: `${m.full_name} foi inativado.` }),
                                       onError: (err: any) => toast({ title: 'Falha na suspensão', description: err.message, variant: 'destructive' })
                                     })}
                                   >
                                      <UserMinus className="h-3 w-3" /> Inativar Colaborador
                                   </DropdownMenuItem>
                                ) : (
                                   <DropdownMenuItem 
                                     className="text-[10px] font-black uppercase tracking-widest gap-2 cursor-pointer text-emerald-500 focus:bg-emerald-500/10 focus:text-emerald-500"
                                     onClick={() => updateStatus.mutate({ userId: m.id, status: 'active' }, {
                                       onSuccess: () => toast({ title: 'Acesso reativado', description: `${m.full_name} agora tem acesso total.` }),
                                       onError: (err: any) => toast({ title: 'Falha na reativação', description: err.message, variant: 'destructive' })
                                     })}
                                   >
                                      <UserCheck className="h-3 w-3" /> Reativar Colaborador
                                   </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="bg-border/50" />
                                <DropdownMenuItem 
                                  className="text-[10px] font-black uppercase tracking-widest gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                                  onClick={() => {
                                    if (confirm(`Tem certeza que deseja remover ${m.full_name} da agência?`)) {
                                      removeMember.mutate(m.id, {
                                        onSuccess: () => toast({ title: 'Colaborador removido', description: `${m.full_name} não pertence mais à agência.` }),
                                        onError: (err: any) => toast({ title: 'Falha na remoção', description: err.message, variant: 'destructive' })
                                      });
                                    }
                                  }}
                                >
                                   <UserX className="h-3 w-3" /> Excluir da Agência
                                </DropdownMenuItem>
                             </DropdownMenuContent>
                          </DropdownMenu>
                       )}
                    </td>
                  </tr>
                ))}

                {/* Pending Invites */}
                {invites.map(invite => (
                  <tr key={invite.id} className="bg-amber-50/10 dark:bg-amber-900/[0.03]">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center bg-amber-500/10 rounded-full border border-amber-500/20">
                           <Mail className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-muted-foreground">{invite.email || 'Link Público Criado'}</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60 flex items-center gap-1 mt-0.5">
                             <Clock className="h-2.5 w-2.5" /> Enviado em {new Date(invite.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <Badge className="bg-amber-100/50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-none uppercase text-[9px] font-black tracking-widest h-5">Pendente</Badge>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3 text-muted-foreground/40" />
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{invite.role}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <Button 
                            className="h-8 text-[9px] font-black uppercase tracking-[0.1em] gap-1 px-3 shadow-lg shadow-primary/10 transition-all hover:scale-105" 
                            variant={copiedToken === invite.token ? "secondary" : "default"}
                            onClick={() => copyToClipboard(invite.token)}
                          >
                            {copiedToken === invite.token ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copiedToken === invite.token ? 'Ok' : 'Link'}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => deleteInvite.mutate(invite.id, {
                              onSuccess: () => toast({ title: 'Convite revogado', description: 'O link de acesso não é mais válido.' }),
                              onError: (err: any) => toast({ title: 'Erro ao revogar', description: err.message, variant: 'destructive' })
                            })}
                          >
                             <Trash2 className="h-3 w-3" />
                          </Button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {(team.length === 0 && invites.length === 0) && (
             <div className="py-20 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted/20 rounded-3xl flex items-center justify-center grayscale opacity-50">
                   <Users className="h-8 w-8" />
                </div>
                <div>
                   <p className="font-black uppercase tracking-[0.3em] text-xs text-muted-foreground">O Time está vazio</p>
                   <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1">Convoque agora seu primeiro colaborador</p>
                </div>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
