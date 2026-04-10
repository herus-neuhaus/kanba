import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWhatsappStatus } from '@/hooks/useWhatsappStatus';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Building2, 
  Phone, 
  Save, 
  Loader2, 
  Bell, 
  LayoutDashboard, 
  Plus, 
  Trash2, 
  Tag,
  ShieldCheck,
  CreditCard,
  Settings2,
  MessageCircle,
  QrCode,
  LogOut,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

export default function Settings() {
  const { profile, agency, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const { isConnected, loading: waLoading, instanceName } = useWhatsappStatus(agency?.id, agency?.name);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [waInstanceLoading, setWaInstanceLoading] = useState(false);

  const [isDemandLoading, setIsDemandLoading] = useState(false);

  // Profile Form
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  // Agency Form
  const [agencyName, setAgencyName] = useState(agency?.name || '');
  const [demandTypes, setDemandTypes] = useState<string[]>(agency?.demand_types || ['Post', 'Criativo', 'Vídeo', 'Copy', 'Landing Page']);
  const [newType, setNewType] = useState('');

  // Sincroniza o estado local quando os dados do Auth finalmente carregarem ou mudarem via cache
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    if (agency) {
      setAgencyName(agency.name || '');
      setDemandTypes(agency.demand_types || ['Post', 'Criativo', 'Vídeo', 'Copy', 'Landing Page']);
    }
  }, [agency]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone })
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      toast({ title: 'Perfil atualizado!', description: 'Suas informações foram salvas com sucesso.' });
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar perfil', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agencies')
        .update({ name: agencyName, demand_types: demandTypes })
        .eq('id', agency.id)
        .select()
        .single();
  
      if (error) throw error;
      if (!data) throw new Error('Não foi possível atualizar (Permissão negada ou agência não encontrada).');
      
      await refreshProfile();
      toast({ title: 'Agência atualizada!', description: 'As configurações da agência foram salvas.' });
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar agência', description: err.message, variant: 'destructive' });
      if (agency) {
        setAgencyName(agency.name);
      }
    } finally {
      setLoading(false);
    }
  };

  const addDemandType = async () => {
    if (!newType.trim() || !agency) return;
    const typeToAdd = newType.trim();
    if (demandTypes.includes(typeToAdd)) {
      toast({ title: 'Tipo já existe', variant: 'destructive' });
      return;
    }
    
    setIsDemandLoading(true);
    
    try {
      const newDemandTypes = [...demandTypes, typeToAdd];
      const { data, error } = await supabase
        .from('agencies')
        .update({ demand_types: newDemandTypes })
        .eq('id', agency.id)
        .select()
        .single();
        
      if (error) throw error;
      if (!data) throw new Error('Falha ao adicionar categoria.');
      
      // Apenas atualizar o estado local se a API retornou sucesso
      setDemandTypes(newDemandTypes);
      setNewType('');
      toast({ title: 'Categoria adicionada com sucesso!' });
      await refreshProfile();
    } catch (err: any) {
      toast({ title: 'Erro ao adicionar categoria', description: err.message, variant: 'destructive' });
    } finally {
      setIsDemandLoading(false);
    }
  };

  const removeDemandType = async (typeToRemove: string) => {
    if (!agency) return;
    setIsDemandLoading(true);
    
    try {
      const newDemandTypes = demandTypes.filter(t => t !== typeToRemove);
      const { data, error } = await supabase
        .from('agencies')
        .update({ demand_types: newDemandTypes })
        .eq('id', agency.id)
        .select()
        .single();
        
      if (error) throw error;
      if (!data) throw new Error('Falha ao remover categoria.');
      
      // Apenas atualizar o estado local se a API retornou sucesso
      setDemandTypes(newDemandTypes);
      toast({ title: 'Categoria removida com sucesso!' });
      await refreshProfile();
    } catch (err: any) {
      toast({ title: 'Erro ao remover categoria', description: err.message, variant: 'destructive' });
    } finally {
      setIsDemandLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!agency) return;
    setWaInstanceLoading(true);
    setQrCode(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-whatsapp-instance', {
        body: { agencyId: agency.id, agencyName: agency.name }
      });
      if (error) throw error;
      if (data?.qrcode) {
        // Strip the base64 prefix if the backend doesn't, usually it's "data:image/png;base64,..." or similar, here we assume it's just base64 or prefixed.
        // The endpoint returns `data.base64` natively.
        const base64Str = data.qrcode.includes('base64,') ? data.qrcode : `data:image/png;base64,${data.qrcode}`;
        setQrCode(base64Str);
      }
      toast({ title: 'Aparelho pronto para conectar', description: 'Leia o QR Code com o seu WhatsApp.' });
    } catch (err: any) {
      toast({ title: 'Erro ao gerar QR Code', description: err.message, variant: 'destructive' });
    } finally {
      setWaInstanceLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!agency) return;
    setWaInstanceLoading(true);
    try {
      // Future: Call an edge function 'disconnect-whatsapp-instance'
      // For now, we simulate disconnect by updating db directly
      // In a real scenario we need to delete the instance remotely
      const { error } = await supabase.functions.invoke('disconnect-whatsapp-instance', {
         body: { agencyId: agency.id, agencyName: agency.name }
      });
      if (error) throw error;

      toast({ title: 'WhatsApp Desconectado', description: 'A instância foi removida.' });
      setQrCode(null);
    } catch (err: any) {
      toast({ title: 'Erro ao desconectar', description: err.message, variant: 'destructive' });
    } finally {
      setWaInstanceLoading(false);
    }
  };
  const handleUpgradePlan = async (selectedPlan: string) => {
    if (!agency) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('agencies')
        .update({ plan: selectedPlan })
        .eq('id', agency.id);

      if (error) throw error;
      await refreshProfile();
      toast({ title: 'Oba, Plano atualizado! 🎉', description: `Sua agência agora faz parte do plano ${selectedPlan.toUpperCase()}.` });
    } catch (err: any) {
      toast({ title: 'Erro ao assinar plano', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Settings2 className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Painel de Controle</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Configurações</h1>
          <p className="text-muted-foreground font-medium">Ajuste seu fluxo de trabalho e preferências da agência.</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-8">
        <div className="flex items-center justify-center sm:justify-start overflow-x-auto pb-4 sm:pb-0 no-scrollbar">
          <TabsList className="grid w-full grid-cols-5 sm:w-fit sm:min-w-[580px] bg-muted/40 p-1 rounded-xl ring-1 ring-border/50 shadow-sm h-12">
            <TabsTrigger value="profile" className="gap-2 rounded-lg data-[state=active]:shadow-md data-[state=active]:bg-background transition-all font-bold text-xs uppercase tracking-tighter">
              <User className="h-4 w-4" /> Perfil
            </TabsTrigger>
            <TabsTrigger value="agency" className="gap-2 rounded-lg data-[state=active]:shadow-md data-[state=active]:bg-background transition-all font-bold text-xs uppercase tracking-tighter">
              <Building2 className="h-4 w-4" /> Agência
            </TabsTrigger>
            <TabsTrigger value="demands" className="gap-2 rounded-lg data-[state=active]:shadow-md data-[state=active]:bg-background transition-all font-bold text-xs uppercase tracking-tighter whitespace-nowrap">
              <Tag className="h-4 w-4" /> Demandas
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2 rounded-lg data-[state=active]:shadow-md data-[state=active]:bg-background transition-all font-bold text-xs uppercase tracking-tighter whitespace-nowrap">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2 rounded-lg data-[state=active]:shadow-md data-[state=active]:bg-background transition-all font-bold text-xs uppercase tracking-tighter whitespace-nowrap">
              <CreditCard className="h-4 w-4" /> Planos
            </TabsTrigger>
          </TabsList>
        </div>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
               <h3 className="text-lg font-black uppercase tracking-tight">Dados Pessoais</h3>
               <p className="text-sm text-muted-foreground leading-relaxed">
                  Essas informações são usadas para identificar você no sistema e enviar alertas de WhatsApp.
               </p>
               <div className="p-4 rounded-xl border border-dashed border-border flex items-center gap-3 bg-muted/10">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
                    Sua conta está protegida e vinculada à agência <strong>{agency?.name}</strong>.
                  </p>
               </div>
               
               <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/5 space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <p className="text-primary font-black text-xs">🚀</p>
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-widest">Dica de Produtividade</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Mantenha seu <strong>WhatsApp atualizado</strong>. Ele é o principal canal de comunicação entre o sistema e sua produtividade diária.
                  </p>
               </div>
            </div>
            
            <Card className="md:col-span-2 border-none shadow-xl ring-1 ring-border/50">
              <CardContent className="p-8">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                       <User className="h-3 w-3" /> Nome Completo
                    </label>
                    <Input 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      className="h-12 bg-muted/20 border-none ring-1 ring-border focus-visible:ring-primary font-bold text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" /> WhatsApp para Notificações
                    </label>
                    <div className="space-y-1">
                      <div className="relative flex items-center group premium-phone-container">
                        <PhoneInput
                          defaultCountry="br"
                          value={phone}
                          onChange={(p) => setPhone(p)}
                          className="w-full"
                          inputClassName="!h-12 !w-full !bg-muted/20 !border-none !ring-1 !ring-border !focus-visible:ring-primary !font-bold !pl-12 !text-foreground !rounded-md"
                          countrySelectorStyleProps={{
                            className: "!absolute !left-1 !bg-transparent !border-none !z-10 !h-12 !flex !items-center !justify-center"
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium italic mt-1">
                        Selecione a bandeira e digite o número com DDD.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 rounded-2xl p-6 flex items-start gap-4 border border-primary/10">
                    <div className="p-2 bg-primary/10 rounded-full">
                       <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-primary uppercase tracking-tight">Notificações por WhatsApp</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Ao salvar seu número, o agente virtual enviará alertas de novos prazos, cobranças de aprovação e estagnação de demandas.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={loading} className="px-8 h-12 gap-2 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AGENCY TAB */}
        <TabsContent value="agency" className="animate-in fade-in-50 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
               <h3 className="text-lg font-black uppercase tracking-tight">Escritório Central</h3>
               <p className="text-sm text-muted-foreground leading-relaxed">
                  Gerencie a identidade visual e as configurações globais da sua agência no sistema.
               </p>
               <Card className="border-none bg-accent/[0.03] ring-1 ring-accent/20 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-accent/10 rounded-lg text-accent">
                        <CreditCard className="h-4 w-4" />
                     </div>
                     <p className="text-xs font-black uppercase tracking-widest text-accent">Plano Profissional</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                      <span>Uso de Recursos</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} className="h-1 bg-accent/10" />
                  </div>
               </Card>
               
               <div className="p-6 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <p className="text-emerald-500 font-black text-xs">💎</p>
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500">Status Platinum</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Sua agência está operando no modo <strong>Enterprise</strong>. Você tem acesso ilimitado a automações e registros de demanda.
                  </p>
               </div>
            </div>

            <Card className="md:col-span-2 border-none shadow-xl ring-1 ring-border/50 overflow-hidden">
              <CardContent className="p-0">
                <div className="p-8 space-y-8">
                  <form onSubmit={handleUpdateAgency} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nome da Agência</label>
                      <Input 
                        value={agencyName}
                        onChange={e => setAgencyName(e.target.value)}
                        placeholder="Nome da sua empresa"
                        disabled={profile?.role !== 'owner'}
                        className="h-12 bg-muted/20 border-none ring-1 ring-border focus-visible:ring-primary font-black text-xl"
                      />
                      {profile?.role !== 'owner' && (
                        <p className="text-[10px] text-destructive font-bold uppercase mt-1">
                          🔒 Apenas o proprietário pode editar este campo.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Relatório de Assinatura</label>
                      <div className="flex items-center justify-between p-5 rounded-2xl border-2 border-dashed border-border bg-muted/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-background border shadow-sm">
                              <LayoutDashboard className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-lg font-black tracking-tight capitalize">{agency?.plan || 'Agency Plus'}</p>
                              <p className="text-xs text-muted-foreground font-medium">Todos os recursos premium ativos</p>
                            </div>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[10px] uppercase">Conta VIP</Badge>
                      </div>
                    </div>

                    {profile?.role === 'owner' && (
                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading} className="px-8 h-12 gap-2 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Atualizar Agência
                        </Button>
                      </div>
                    )}
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DEMANDS TAB */}
        <TabsContent value="demands" className="animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
               <h3 className="text-lg font-black uppercase tracking-tight">Esteira de Produção</h3>
               <p className="text-sm text-muted-foreground leading-relaxed">
                  Personalize os tipos de entregas que aparecem no seu sistema. Isso ajuda a categorizar as demandas da equipe.
               </p>
               
               <div className="p-6 rounded-2xl bg-amber-500/[0.05] border border-amber-500/10 space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <p className="text-amber-500 font-black text-xs">🎨</p>
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500">Fluxo Visual</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Personalizar a <strong>Esteira de Produção</strong> permite que sua equipe saiba exatamente o que entregar sem ler descrições longas.
                  </p>
               </div>
            </div>

            <Card className="md:col-span-2 border-none shadow-xl ring-1 ring-border/50">
              <CardContent className="p-8 space-y-8">
                {profile?.role === 'owner' ? (
                  <div className="flex gap-3">
                    <Input 
                      placeholder="Novo tipo (ex: Gestão de Tráfego)" 
                      value={newType}
                      onChange={e => setNewType(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDemandType())}
                      className="h-12 bg-muted/20 border-none ring-1 ring-border focus-visible:ring-primary"
                      disabled={isDemandLoading}
                    />
                    <Button onClick={addDemandType} disabled={isDemandLoading} className="h-12 px-6 gap-2 font-bold bg-foreground transition-colors hover:bg-foreground/90">
                      {isDemandLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} 
                      Adicionar
                    </Button>
                  </div>
                ) : (
                  <div className="bg-muted p-4 rounded-xl text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase">🔒 Edição bloqueada para colaboradores</p>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Categorias Ativas no Kanban</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {demandTypes.map(type => (
                      <div key={type} className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-background hover:border-primary/30 transition-all group shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-3 w-full overflow-hidden">
                           <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary/40" />
                           <span className="text-sm font-extrabold tracking-tight italic truncate">{type}</span>
                        </div>
                        {profile?.role === 'owner' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 shrink-0 ml-2"
                            onClick={() => removeDemandType(type)}
                            disabled={isDemandLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* WHATSAPP TAB */}
        <TabsContent value="whatsapp" className="animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase tracking-tight">Conexão WhatsApp</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Vincule um número de WhatsApp à sua agência para ativar o agente virtual, automatizando notificações, lembretes de prazos e muito mais.
              </p>

              {isConnected ? (
                <div className="p-6 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/10 space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <p className="text-emerald-500 font-black text-xs">✓</p>
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500">Status Ativo</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Sua agência está conectada e pronta para rotear notificações do quadro.
                  </p>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-destructive/[0.05] border border-destructive/10 space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                     <QrCode className="h-4 w-4 text-destructive" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-destructive">Aguardando Conexão</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Você ainda não conectou um aparelho corporativo. O agente não enviará mensagens até que o leitor passe pelo QR code.
                  </p>
                </div>
              )}
            </div>

            <Card className="md:col-span-2 border-none shadow-xl ring-1 ring-border/50">
              <CardContent className="p-8 space-y-8">
                {waLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-bold text-muted-foreground uppercase">Verificando status da API...</p>
                  </div>
                ) : isConnected ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
                    <div className="p-4 rounded-full bg-emerald-500/10 mb-2">
                       <MessageCircle className="h-12 w-12 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black uppercase text-foreground mb-2">Aparelho Conectado</h4>
                      {instanceName && (
                        <p className="text-xs font-mono font-bold bg-primary/10 text-primary px-3 py-1 rounded-full mb-4 inline-block">
                          Instância: {instanceName}
                        </p>
                      )}
                      <p className="text-sm border border-border p-4 rounded-lg bg-muted/20 text-muted-foreground max-w-sm mx-auto">
                        Para desconectar e usar outro número, clique no botão de Desconectar abaixo e faça um novo pareamento.
                      </p>
                    </div>
                    {profile?.role === 'owner' ? (
                        <Button 
                          variant="destructive" 
                          onClick={handleDisconnect} 
                          disabled={waInstanceLoading}
                          className="h-12 px-8 gap-2 uppercase tracking-widest font-black text-xs shadow-lg mt-4"
                        >
                          {waInstanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                          Desconectar Aparelho
                        </Button>
                    ) : (
                       <p className="text-xs text-muted-foreground font-bold mt-4">Somente o proprietário da agência pode gerenciar o WhatsApp.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8 flex flex-col items-center justify-center py-8">
                    {qrCode ? (
                       <div className="flex flex-col items-center justify-center text-center space-y-6">
                         <div className="space-y-2">
                            <h4 className="text-lg font-black uppercase text-foreground">Ler QR Code</h4>
                            <p className="text-sm text-muted-foreground">
                               Abra o WhatsApp, vá em "Aparelhos Conectados" e escaneie.
                            </p>
                         </div>
                         <div className="p-4 bg-white rounded-2xl shadow-lg border-2 border-border inline-block">
                           <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
                         </div>
                         
                         <div className="flex gap-4">
                           <Button variant="outline" onClick={() => setQrCode(null)} className="h-12 font-bold uppercase text-xs">
                             Cancelar
                           </Button>
                           <Button onClick={generateQRCode} disabled={waInstanceLoading} className="h-12 px-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-xs shadow-md">
                              {waInstanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                              Gerar Novo
                           </Button>
                         </div>
                       </div>
                    ) : (
                       <div className="flex flex-col items-center justify-center text-center space-y-6">
                         <div className="p-4 rounded-full bg-primary/10">
                            <QrCode className="h-12 w-12 text-primary" />
                         </div>
                         <div className="space-y-2 max-w-sm">
                            <h4 className="text-lg font-black uppercase text-foreground">Iniciar Nova Sessão</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                               Para começar a parear, clique em gerar QR code e aguarde. O servidor processará e exibirá o código para leitura com a câmera.
                            </p>
                         </div>
                         {profile?.role === 'owner' ? (
                            <Button 
                              onClick={generateQRCode} 
                              disabled={waInstanceLoading}
                              className="h-12 px-8 gap-2 bg-foreground text-background hover:bg-foreground/90 font-black uppercase text-xs shadow-lg mt-4"
                            >
                              {waInstanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                              Gerar QR Code
                            </Button>
                         ) : (
                            <p className="text-xs text-muted-foreground font-bold mt-4">Somente o proprietário da agência pode gerenciar o WhatsApp.</p>
                         )}
                       </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* --- Aba Planos --- */}
        <TabsContent value="plans" className="mt-8 space-y-6">
          <Card className="border-none shadow-xl ring-1 ring-border/50">
            <CardHeader className="bg-muted/30 pb-6 border-b">
               <div className="flex items-center gap-3">
                 <div className="bg-primary/10 p-3 rounded-xl border border-primary/20"><CreditCard className="h-6 w-6 text-primary" /></div>
                 <div>
                   <CardTitle className="text-xl font-black">Planos e Assinaturas</CardTitle>
                   <CardDescription>Gerencie sua assinatura. Faça um upgrade com apenas um clique!</CardDescription>
                 </div>
               </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Free */}
                 <div className={cn("p-6 rounded-2xl border-2 flex flex-col gap-4 transition-all hover:border-primary/50", (!agency?.plan || agency?.plan === 'free') ? "border-primary bg-primary/[0.02]" : "border-border/50")}>
                    <div className="flex justify-between items-start">
                       <div>
                         <h3 className="font-extrabold text-xl uppercase tracking-widest text-muted-foreground">Free</h3>
                         <p className="font-black text-3xl mt-2">R$ 0<span className="text-base text-muted-foreground font-medium">/mês</span></p>
                       </div>
                       {(!agency?.plan || agency?.plan === 'free') && <Badge className="bg-primary/10 text-primary">Plano Atual</Badge>}
                    </div>
                    <ul className="space-y-2 flex-1 mt-4 text-sm font-medium text-foreground/80">
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> 2 Projetos Máximos</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Equipe Limitada</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Suporte Básico</li>
                    </ul>
                    <Button 
                       variant={(!agency?.plan || agency?.plan === 'free') ? 'outline' : 'default'}
                       className="w-full font-bold uppercase tracking-widest mt-auto shadow"
                       disabled={loading || !agency?.plan || agency?.plan === 'free'}
                       onClick={() => handleUpgradePlan('free')}
                    >
                       {(!agency?.plan || agency?.plan === 'free') ? 'Ativo' : 'Escolher Free'}
                    </Button>
                 </div>

                 {/* Pro */}
                 <div className={cn("p-6 rounded-2xl border-2 flex flex-col gap-4 transition-all hover:border-primary/50 relative overflow-hidden", agency?.plan === 'pro' ? "border-primary bg-primary/[0.02]" : "border-border/50")}>
                    {agency?.plan !== 'pro' && <div className="absolute top-0 right-0 bg-primary px-3 py-1 rounded-bl-xl font-bold text-[9px] uppercase text-primary-foreground tracking-widest">Recomendado</div>}
                    <div className="flex justify-between items-start">
                       <div>
                         <h3 className="font-extrabold text-xl uppercase tracking-widest text-primary">Pro</h3>
                         <p className="font-black text-3xl mt-2">R$ 0<span className="text-base text-muted-foreground font-medium">/mês</span></p>
                       </div>
                       {agency?.plan === 'pro' && <Badge className="bg-primary/10 text-primary">Plano Atual</Badge>}
                    </div>
                    <ul className="space-y-2 flex-1 mt-4 text-sm font-medium text-foreground/80">
                      <li className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-4 w-4 text-primary" /> Até 10 Projetos</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Automação WhatsApp</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Equipe Desbloqueada</li>
                    </ul>
                    <Button 
                       variant={agency?.plan === 'pro' ? 'outline' : 'default'}
                       className="w-full font-bold uppercase tracking-widest mt-auto shadow"
                       disabled={loading || agency?.plan === 'pro'}
                       onClick={() => handleUpgradePlan('pro')}
                    >
                       {agency?.plan === 'pro' ? 'Ativo' : 'Ativar Em 1 Clique'}
                    </Button>
                 </div>

                 {/* Enterprise */}
                 <div className={cn("p-6 rounded-2xl border-2 flex flex-col gap-4 transition-all hover:border-primary/50", agency?.plan === 'enterprise' ? "border-primary bg-primary/[0.02]" : "border-border/50")}>
                    <div className="flex justify-between items-start">
                       <div>
                         <h3 className="font-extrabold text-xl uppercase tracking-widest text-foreground">Enterprise</h3>
                         <p className="font-black text-3xl mt-2">R$ 0<span className="text-base text-muted-foreground font-medium">/mês</span></p>
                       </div>
                       {agency?.plan === 'enterprise' && <Badge className="bg-primary/10 text-primary">Plano Atual</Badge>}
                    </div>
                    <ul className="space-y-2 flex-1 mt-4 text-sm font-medium text-foreground/80">
                      <li className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-4 w-4 text-primary" /> Projetos Ilimitados</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Instâncias WhatsApp Extras</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Prioridade de Suporte</li>
                    </ul>
                    <Button 
                       variant={agency?.plan === 'enterprise' ? 'outline' : 'default'}
                       className="w-full font-bold uppercase tracking-widest mt-auto shadow"
                       disabled={loading || agency?.plan === 'enterprise'}
                       onClick={() => handleUpgradePlan('enterprise')}
                    >
                       {agency?.plan === 'enterprise' ? 'Ativo' : 'Assinar Enterprise'}
                    </Button>
                 </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
      </Tabs>
    </div>
  );
}

// End of file
