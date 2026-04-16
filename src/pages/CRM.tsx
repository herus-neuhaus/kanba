import { useState, useMemo, useEffect } from 'react';
import { useCRMPipelines, useCRMDeals, useCRMClients } from '@/hooks/useCRM';
import { useTeam } from '@/hooks/useTeam';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, DollarSign, Wallet, Percent, Handshake, Plus, Calendar, UserPlus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import type { CRMDealStage, CRMDeal } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DealDetailsSheet } from '@/components/crm/DealDetailsSheet';
import { sendWhatsAppNotification } from '@/lib/evolution';

const COLUMNS: { id: CRMDealStage; label: string; color: string; border: string }[] = [
  { id: 'lead', label: 'Leads', color: 'bg-zinc-500/10 text-zinc-500', border: 'border-zinc-500/20' },
  { id: 'meeting', label: 'Reunião', color: 'bg-blue-500/10 text-blue-500', border: 'border-blue-500/20' },
  { id: 'proposal', label: 'Proposta', color: 'bg-amber-500/10 text-amber-500', border: 'border-amber-500/20' },
  { id: 'negotiation', label: 'Negociação', color: 'bg-orange-500/10 text-orange-500', border: 'border-orange-500/20' },
  { id: 'won', label: 'Ganho', color: 'bg-green-500/10 text-green-500', border: 'border-green-500/20' },
  { id: 'lost', label: 'Perdido', color: 'bg-red-500/10 text-red-500', border: 'border-red-500/20' },
];

export default function CRM() {
  const { agency, user } = useAuth();
  const { data: pipelines, isLoading: loadingPipelines, createPipeline, updatePipeline, deletePipeline } = useCRMPipelines();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>();
  const [myDealsOnly, setMyDealsOnly] = useState(false);
  
  // Modal de Criação de Funil
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineDesc, setNewPipelineDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de Edição de Funil
  const [isEditPipelineModalOpen, setIsEditPipelineModalOpen] = useState(false);
  const [editPipelineName, setEditPipelineName] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Alert Dialog de Exclusão de Funil
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // Modal de Novo Negócio
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealValue, setNewDealValue] = useState('');
  const [newDealPipelineId, setNewDealPipelineId] = useState('');
  const [newDealClientId, setNewDealClientId] = useState('');
  const [newDealAssignee, setNewDealAssignee] = useState('');
  const [newDealStage, setNewDealStage] = useState<string>('lead');

  // Modal (Sheet) de Edição
  const [selectedDealForSheet, setSelectedDealForSheet] = useState<CRMDeal | null>(null);

  // Mini form para Novo Cliente
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);

  const { data: deals, isLoading: loadingDeals, updateDealStage, createDeal } = useCRMDeals(selectedPipelineId);
  const { data: clients, createClient } = useCRMClients();

  // Hook para Responsáveis (Closer) Mock Whatsapp
  const { data: teamMembers } = useTeam();
  const [pendingDragAction, setPendingDragAction] = useState<{ dealId: string, stage: string } | null>(null);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [commitDateTime, setCommitDateTime] = useState('');
  const [commitAssignee, setCommitAssignee] = useState('');

  // Select first pipeline by default
  useEffect(() => {
    if (pipelines?.length && !selectedPipelineId) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [pipelines, selectedPipelineId]);

  // Sync default pipeline id modal
  useEffect(() => {
    if (selectedPipelineId && isDealModalOpen) {
      setNewDealPipelineId(selectedPipelineId);
      setNewDealAssignee(user?.id || 'unassigned');
    }
  }, [selectedPipelineId, isDealModalOpen, user]);

  const filteredDeals = useMemo(() => {
    if (!deals) return [];
    if (myDealsOnly) return deals.filter(d => d.assigned_to === user?.id);
    return deals;
  }, [deals, myDealsOnly, user]);

  const handleOpenPipelineModal = () => {
    const limit = agency?.plan_type === 'basic' ? 1 
      : agency?.plan_type === 'standard' ? 5 
      : 10; // elite / enterprise
      
    if (pipelines && pipelines.length >= limit) {
      toast.error('Limite de Funis Atingido', {
        description: 'Faça o upgrade do seu plano para criar múltiplos fluxos de vendas.',
        action: {
          label: 'Fazer Upgrade',
          onClick: () => window.location.href = '/settings'
        }
      });
      return;
    }
    setIsPipelineModalOpen(true);
  };

  const handleEditPipeline = async () => {
    if (!editPipelineName.trim() || !selectedPipelineId) {
      toast.error('O nome do funil é obrigatório');
      return;
    }
    try {
      setIsSubmittingEdit(true);
      await updatePipeline.mutateAsync({ id: selectedPipelineId, name: editPipelineName.trim() });
      setIsEditPipelineModalOpen(false);
      toast.success('Funil renomeado com sucesso!');
    } catch (error) {
      toast.error('Erro ao editar funil');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) {
      toast.error('O nome do funil é obrigatório');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await createPipeline.mutateAsync({ name: newPipelineName.trim(), description: newPipelineDesc.trim() });
      if (res) setSelectedPipelineId(res.id);
      setIsPipelineModalOpen(false);
      setNewPipelineName('');
      setNewPipelineDesc('');
      toast.success('Funil criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar funil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      toast.error('O nome do cliente é obrigatório');
      return;
    }
    try {
      setIsSubmittingClient(true);
      const newClient = await createClient.mutateAsync({ 
        name: newClientName.trim(), 
        status: 'prospect',
        contact_info: { phone: newClientPhone.trim(), email: newClientEmail.trim() }
      });
      
      setNewDealClientId(newClient.id);
      setIsCreatingNewClient(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientEmail('');
      toast.success('Cliente cadastrado e selecionado!');
    } catch(e) {
      toast.error('Erro ao cadastrar cliente');
    } finally {
      setIsSubmittingClient(false);
    }
  };

  const handleCreateDeal = async () => {
    if (!newDealTitle.trim() || !newDealValue || !newDealPipelineId || !newDealStage || !newDealClientId) {
      toast.error('Preencha os campos obrigatórios do negócio (incluindo o cliente)');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await createDeal.mutateAsync({
         title: newDealTitle.trim(),
         value: Number(newDealValue),
         pipeline_id: newDealPipelineId,
         client_id: newDealClientId,
         stage: newDealStage,
         assigned_to: newDealAssignee === 'unassigned' ? undefined : newDealAssignee,
      });

      setIsDealModalOpen(false);
      setNewDealTitle('');
      setNewDealValue('');
      setNewDealClientId('');
      toast.success('Negócio criado com sucesso!');
    } catch (e) {
       console.error(e);
      toast.error('Erro ao salvar negócio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  // Derivando KPIs
  const kpis = useMemo(() => {
    if (!filteredDeals) return { totalAberto: 0, conversao: 0, ticketMedio: 0 };
    
    const dealsAbertos = filteredDeals.filter(d => d.stage !== 'won' && d.stage !== 'lost');
    const totalAberto = dealsAbertos.reduce((acc, curr) => acc + Number(curr.value), 0);
    
    // Won in current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const wonThisMonth = filteredDeals.filter(d => {
      if (d.stage !== 'won') return false;
      const dDate = new Date(d.created_at);
      return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
    });
    
    const countAbertoAndWon = dealsAbertos.length + filteredDeals.filter(d => d.stage === 'won').length;
    const conversao = countAbertoAndWon > 0 ? (wonThisMonth.length / countAbertoAndWon) * 100 : 0;
    
    const allActiveValues = [...dealsAbertos, ...filteredDeals.filter(d => d.stage === 'won')];
    const ticketMedio = allActiveValues.length > 0 
      ? allActiveValues.reduce((acc, curr) => acc + Number(curr.value), 0) / allActiveValues.length 
      : 0;

    return { totalAberto, conversao, ticketMedio };
  }, [filteredDeals]);

  const handleCommitAction = async () => {
    if (!commitDateTime || !commitAssignee) {
      toast.error('Preencha a data e o responsável!');
      return;
    }
    if (!pendingDragAction) return;

    const { dealId, stage } = pendingDragAction;
    const deal = deals?.find(d => d.id === dealId);
    if (!deal) return;

    const label = stage === 'meeting' ? 'Data da Reunião' : 'Prazo da Proposta';

    try {
      setIsSubmitting(true);
      await updateDealStage.mutateAsync({ 
        dealId, 
        stage, 
        assigned_to: commitAssignee, 
        next_action_date: new Date(commitDateTime).toISOString(),
        next_action_label: label
      });
      
      const closer = teamMembers?.find(t => t.id === commitAssignee);
      
      if (closer?.phone) {
        const stageName = COLUMNS.find(c => c.id === stage)?.label || stage;
        const msg = `🎯 *Novo Movimento no Funil!*\n*Oportunidade:* ${deal.title}\n*Cliente:* ${deal.client?.name || 'Oculto'}\n*Valor:* ${formatBRL(Number(deal.value))}\n*Nova Etapa:* ${stageName}\n*Data da Ação:* ${new Date(commitDateTime).toLocaleString('pt-BR')}\n*O que fazer:* ${label}\n\nBora fechar negócio! 🚀`;
        
        // Disparo assíncrono para não travar a UI
        sendWhatsAppNotification(closer.phone, msg, deal.agency_id).catch((err) => console.error("Falha silenciosa whatsapp", err));
      }

      toast.success('Etapa confirmada com compromisso gerado!');
      setIsCommitModalOpen(false);
      setPendingDragAction(null);
      setCommitDateTime('');
      setCommitAssignee('');
    } catch {
      toast.error('Erro ao salvar compromisso');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    if (destination.droppableId === 'meeting' || destination.droppableId === 'proposal') {
      setPendingDragAction({ dealId: draggableId, stage: destination.droppableId });
      setIsCommitModalOpen(true);
      return;
    }

    updateDealStage.mutate(
      { dealId: draggableId, stage: destination.droppableId },
      { onError: () => toast.error('Erro ao mover negócio') }
    );
  };

  if (loadingPipelines) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-6 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-96 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Placeholder caso não existam Funis
  if (!pipelines?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
        <div className="p-6 rounded-full bg-primary/10 text-primary border border-primary/20">
          <Wallet className="h-12 w-12" />
        </div>
        <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Nenhum Funil Encontrado</h1>
            <p className="text-muted-foreground text-sm max-w-sm">
                Crie seu primeiro pipeline para começar a gerenciar seus negócios.
            </p>
        </div>
        <Button className="font-bold" onClick={() => setIsPipelineModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Criar Funil
        </Button>

        {/* Modal de Criar Funil reaproveitado */}
        <Dialog open={isPipelineModalOpen} onOpenChange={setIsPipelineModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Novo Funil de Vendas</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name_empty">Nome do Funil</Label>
                <Input 
                  id="name_empty" placeholder="Ex: Funil Inbound" 
                  value={newPipelineName} onChange={(e) => setNewPipelineName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePipeline()} autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPipelineModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreatePipeline} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Criar Funil
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }


  return (
    <div className="p-6 flex flex-col h-full space-y-6 overflow-hidden">
      {/* MODAL COMPROMISSO (DRAG) */}
      <Dialog open={isCommitModalOpen} onOpenChange={(open) => {
        setIsCommitModalOpen(open);
        if(!open) setPendingDragAction(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atenção: Ação Necessária</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Você moveu o negócio para <strong>{pendingDragAction?.stage === 'meeting' ? 'Reunião' : 'Proposta'}</strong>. 
              Por favor, defina a data limite e quem é o <span className="text-primary">Closer/Responsável</span>.
            </p>

            <div className="space-y-2">
              <Label>Data e Hora do Compromisso <span className="text-destructive">*</span></Label>
              <Input 
                type="datetime-local" 
                value={commitDateTime} 
                onChange={(e) => setCommitDateTime(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label>Responsável (Closer) <span className="text-destructive">*</span></Label>
              <Select value={commitAssignee} onValueChange={setCommitAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o membro..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers?.map(member => (
                    <SelectItem key={member.id} value={member.id}>{member.full_name || member.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCommitModalOpen(false);
              setPendingDragAction(null);
            }}>Cancelar Movimentação</Button>
            <Button onClick={handleCommitAction} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR NEGOCIO (SHEET) */}
      <DealDetailsSheet 
        deal={selectedDealForSheet} 
        open={!!selectedDealForSheet} 
        onOpenChange={(b) => !b && setSelectedDealForSheet(null)}
        pipelineId={selectedPipelineId}
      />

      {/* HEADER & SELECTOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            CRM <span className="text-primary italic">Vendas</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Gerencie e converta seus leads de forma ágil e centralizada.
          </p>
        </div>
        {/* CONTROLES */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg border border-border/50">
              <Label htmlFor="my-deals" className="cursor-pointer text-sm font-medium">Meus Negócios</Label>
              <Switch id="my-deals" checked={myDealsOnly} onCheckedChange={setMyDealsOnly} />
            </div>

            <div className="flex items-center space-x-2">
            <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
              <SelectTrigger className="w-[220px] font-semibold bg-background h-10">
                <SelectValue placeholder="Selecione um Funil" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map(pipeline => (
                  <SelectItem key={pipeline.id} value={pipeline.id} className="font-medium">
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={handleOpenPipelineModal}>
              <Plus className="h-4 w-4" />
            </Button>

            {/* OPÇÕES DO FUNIL */}
            {selectedPipelineId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 ml-1">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    const pipe = pipelines?.find(p => p.id === selectedPipelineId);
                    setEditPipelineName(pipe?.name || '');
                    setIsEditPipelineModalOpen(true);
                  }}>
                    <Pencil className="h-4 w-4 mr-2" /> Editar Nome
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setIsDeleteAlertOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Apagar Funil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <Button onClick={() => setIsDealModalOpen(true)} className="font-bold h-10 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" /> Novo Negócio
          </Button>
        </div>
      </div>

      {/* ALERT DIALOG APAGAR FUNIL */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso apagará permanentemente o funil atual e TODOS os negócios (deals) dentro dele. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (!selectedPipelineId) return;
                try {
                  await deletePipeline.mutateAsync(selectedPipelineId);
                  setSelectedPipelineId(undefined);
                  toast.success('Funil apagado com sucesso');
                } catch(e) {
                  toast.error('Erro ao apagar funil');
                }
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL EDITAR FUNIL */}
      <Dialog open={isEditPipelineModalOpen} onOpenChange={setIsEditPipelineModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renomear Funil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Nome do Funil <span className="text-destructive">*</span></Label>
              <Input 
                id="edit_name" placeholder="Ex: Funil de Indicações" 
                value={editPipelineName} onChange={(e) => setEditPipelineName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditPipeline()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPipelineModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditPipeline} disabled={isSubmittingEdit}>
              {isSubmittingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL NOVO FUNIL */}
      <Dialog open={isPipelineModalOpen} onOpenChange={setIsPipelineModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Funil de Vendas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name2">Nome do Funil <span className="text-destructive">*</span></Label>
              <Input 
                id="name2" placeholder="Ex: Funil de Indicações" 
                value={newPipelineName} onChange={(e) => setNewPipelineName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição (Opcional)</Label>
              <Textarea 
                id="desc" placeholder="Qual o propósito deste funil?" 
                value={newPipelineDesc} onChange={(e) => setNewPipelineDesc(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPipelineModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreatePipeline} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar Funil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL NOVO NEGÓCIO */}
      <Dialog open={isDealModalOpen} onOpenChange={setIsDealModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isCreatingNewClient ? 'Cadastrar Novo Cliente' : 'Adicionar Novo Negócio'}
            </DialogTitle>
          </DialogHeader>
          
          {isCreatingNewClient ? (
            <div className="space-y-4 py-4 animate-in fade-in zoom-in-95 duration-200">
               <div className="space-y-2">
                 <Label>Nome da Empresa / Cliente <span className="text-destructive">*</span></Label>
                 <Input value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Ex: Havan" autoFocus />
               </div>
               <div className="space-y-2">
                 <Label>WhatsApp / Telefone</Label>
                 <Input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} placeholder="(DD) 90000-0000" />
               </div>
               <div className="space-y-2">
                 <Label>E-mail</Label>
                 <Input type="email" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} placeholder="contato@empresa.com" />
               </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Negócio <span className="text-destructive">*</span></Label>
                <Input id="title" placeholder="Ex: Website Institucional Havan" value={newDealTitle} onChange={(e) => setNewDealTitle(e.target.value)} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor (R$) <span className="text-destructive">*</span></Label>
                  <Input id="value" type="number" placeholder="15000" min="0" step="0.01" value={newDealValue} onChange={(e) => setNewDealValue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Estágio Inicial <span className="text-destructive">*</span></Label>
                  <Select value={newDealStage} onValueChange={setNewDealStage}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {COLUMNS.map(col => (
                         <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                 <Label>Funil Destino <span className="text-destructive">*</span></Label>
                 <Select value={newDealPipelineId} onValueChange={setNewDealPipelineId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o Funil" /></SelectTrigger>
                    <SelectContent>
                      {pipelines?.map(pipeline => (
                         <SelectItem key={pipeline.id} value={pipeline.id}>{pipeline.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

              <div className="space-y-2">
                <Label>Responsável (Closer)</Label>
                <Select value={newDealAssignee} onValueChange={setNewDealAssignee}>
                  <SelectTrigger><SelectValue placeholder="Sem responsável" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sem responsável</SelectItem>
                    {teamMembers?.map(member => (
                      <SelectItem key={member.id} value={member.id}>{member.full_name || member.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SELEÇÃO DE CLIENTE COM OPÇÃO DE CADASTRAR */}
              <div className="space-y-2 mt-4 pt-4 border-t border-border">
                <Label>Cliente Vinculado <span className="text-destructive">*</span></Label>
                <div className="flex flex-col gap-2">
                  <Select value={newDealClientId} onValueChange={setNewDealClientId}>
                    <SelectTrigger className="w-full bg-background"><SelectValue placeholder="Busque um cliente..." /></SelectTrigger>
                    <SelectContent>
                      {clients?.length === 0 && <SelectItem value="none" disabled>Nenhum cliente cadastrado</SelectItem>}
                      {clients?.map((client: any) => (
                         <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="w-full text-primary border-primary/20 hover:bg-primary/10 transition-colors" onClick={() => setIsCreatingNewClient(true)}>
                    <UserPlus className="h-4 w-4 mr-2" /> Cadastrar Novo Cliente
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {isCreatingNewClient ? (
              <>
                <Button variant="ghost" onClick={() => setIsCreatingNewClient(false)}>Voltar</Button>
                <Button onClick={handleCreateClient} disabled={isSubmittingClient}>
                  {isSubmittingClient ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Salvar Cliente
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setIsDealModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateDeal} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Salvar Negócio
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* KPIs DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <Card className="bg-background/60 backdrop-blur-sm border-primary/10 shadow-lg shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total em Aberto</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{formatBRL(kpis.totalAberto)}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Negócios ativos no pipeline</p>
          </CardContent>
        </Card>
        
        <Card className="bg-background/60 backdrop-blur-sm border-blue-500/10 shadow-lg shadow-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Conversão Mensal</CardTitle>
            <Percent className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{kpis.conversao.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Taxa de fechamento (Win Rate)</p>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-sm border-emerald-500/10 shadow-lg shadow-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ticket Médio</CardTitle>
            <Handshake className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{formatBRL(kpis.ticketMedio)}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Valor médio por negócio</p>
          </CardContent>
        </Card>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        {loadingDeals ? (
          <div className="flex gap-4 h-full">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="min-w-[320px] w-[320px] h-full rounded-2xl" />)}
          </div>
        ) : (
          <TooltipProvider delayDuration={200}>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 h-full items-start">
              {COLUMNS.map(col => {
                const columnDeals = filteredDeals?.filter(d => d.stage === col.id) || [];
                const columnTotal = columnDeals.reduce((acc, curr) => acc + Number(curr.value), 0);

                return (
                  <div key={col.id} className="flex flex-col min-w-[320px] w-[320px] h-full max-h-full">
                    {/* COLUMN HEADER */}
                    <div className={cn("p-4 mb-3 rounded-2xl border bg-background/40 backdrop-blur-sm flex flex-col gap-2 shadow-sm", col.border)}>
                      <div className="flex items-center justify-between">
                        <div className={cn("px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider", col.color)}>
                          {col.label}
                        </div>
                        <Badge variant="outline" className="bg-background/50 font-bold border-border/50">
                          {columnDeals.length}
                        </Badge>
                      </div>
                      
                      {/* REDUCE DA COLUNA */}
                      <div className="text-lg font-bold">
                        <span className={cn("tracking-tight", col.id === 'won' ? 'text-green-500' : 'text-foreground')}>
                          {formatBRL(columnTotal)}
                        </span>
                      </div>
                    </div>

                    {/* DROPPABLE AREA */}
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            "flex-1 overflow-y-auto min-h-[150px] p-2 -mx-2 rounded-xl transition-colors",
                            snapshot.isDraggingOver ? "bg-muted/50 ring-1 ring-border" : "bg-transparent"
                          )}
                        >
                          <div className="flex flex-col gap-3">
                            {columnDeals.map((deal, index) => (
                              <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={provided.draggableProps.style}
                                    onClick={() => setSelectedDealForSheet(deal)}
                                    className={cn(
                                      "group bg-card border border-border/60 rounded-xl p-4 shadow-sm transition-all relative overflow-hidden cursor-pointer",
                                      snapshot.isDragging ? "shadow-lg scale-[1.02] rotate-1 z-50 ring-2 ring-primary/20" : "hover:border-primary/30 hover:shadow-md"
                                    )}
                                  >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/50 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <h4 className="font-bold text-sm leading-tight text-foreground group-hover:text-primary transition-colors">
                                      {deal.title}
                                    </h4>
                                    
                                    <div className="mt-3 flex flex-col gap-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center text-xs text-muted-foreground font-medium bg-muted/30 px-2 py-1 rounded-md w-fit">
                                          <Wallet className="h-3 w-3 mr-1.5 opacity-70" />
                                          {deal.client?.name || 'Cliente Oculto'}
                                        </div>
                                        <span className="font-black text-sm text-foreground">
                                          {formatBRL(Number(deal.value))}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* FOOTER */}
                                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2 min-h-[32px]">
                                      {/* Ação / Badge */}
                                      {deal.next_action_date ? (
                                        <div className={cn(
                                          "flex items-center text-[10px] font-bold uppercase tracking-wider p-1 px-1.5 rounded-md border max-w-[160px] truncate",
                                          (() => {
                                            const dClient = new Date(deal.next_action_date!);
                                            const today = new Date();
                                            const isToday = dClient.toDateString() === today.toDateString();
                                            const isOverdue = dClient < today && !isToday;
                                            if (isOverdue) return "text-destructive border-destructive/20 bg-destructive/10";
                                            if (isToday) return "text-amber-500 border-amber-500/20 bg-amber-500/10";
                                            return "text-muted-foreground border-border/50 bg-muted/40";
                                          })()
                                        )}>
                                          <Calendar className="h-3 w-3 mr-1 shrink-0" />
                                          <span className="truncate">{deal.next_action_label || new Date(deal.next_action_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                        </div>
                                      ) : <span className="text-transparent">vazio</span>}

                                      {/* RESPONSAVEL AVATAR CARD */}
                                      {deal.assignee && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Avatar className="h-6 w-6 border-2 border-background shadow-sm hover:scale-110 transition-transform shrink-0">
                                              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                                {deal.assignee.full_name?.substring(0,2).toUpperCase() || 'US'}
                                              </AvatarFallback>
                                            </Avatar>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="font-medium text-xs text-foreground">
                                              Responsável: <span className="text-muted-foreground">{deal.assignee.full_name}</span>
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
