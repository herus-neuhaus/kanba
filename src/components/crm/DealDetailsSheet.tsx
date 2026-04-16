import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ExternalLink, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CRMDeal, CRMContactInfo, CRMDealStage } from '@/types';
import { useCRMDeals, useCRMClients } from '@/hooks/useCRM';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';

interface DealDetailsSheetProps {
  deal: CRMDeal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId?: string;
}

const STAGES: { id: CRMDealStage; label: string }[] = [
  { id: 'lead', label: 'Leads' },
  { id: 'meeting', label: 'Reunião' },
  { id: 'proposal', label: 'Proposta' },
  { id: 'negotiation', label: 'Negociação' },
  { id: 'won', label: 'Ganho' },
  { id: 'lost', label: 'Perdido' },
];

export function DealDetailsSheet({ deal, open, onOpenChange, pipelineId }: DealDetailsSheetProps) {
  const { agency } = useAuth();
  const qc = useQueryClient();
  const { updateDeal, deleteDeal } = useCRMDeals(pipelineId);
  const { updateClient } = useCRMClients();
  const { data: teamMembers } = useTeam();

  // Local State
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState<string>('lead');
  const [assignedTo, setAssignedTo] = useState<string>('unassigned');
  const [notes, setNotes] = useState('');
  
  // Client Contact State
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when deal is opened
  useEffect(() => {
    if (deal) {
      setTitle(deal.title || '');
      setValue(deal.value?.toString() || '');
      setStage(deal.stage || 'lead');
      setAssignedTo(deal.assigned_to || 'unassigned');
      setNotes(deal.notes || '');

      const contactInfo: CRMContactInfo = deal.client?.contact_info || {};
      setPhone(contactInfo.phone || '');
      setEmail(contactInfo.email || '');
      setInstagram(contactInfo.instagram || '');
    }
  }, [deal]);

  const handleSaveInfo = async () => {
    if (!deal) return;
    setIsSaving(true);
    
    try {
      // 1. Update Deal
      await updateDeal.mutateAsync({
        dealId: deal.id,
        payload: {
          title,
          value: Number(value),
          stage: stage as CRMDealStage,
          assigned_to: assignedTo === 'unassigned' ? null : assignedTo,
        }
      });

      // 2. Update Client
      if (deal.client) {
        const contact_info = {
          ...(deal.client.contact_info || {}),
          phone,
          email,
          instagram
        };
        await updateClient.mutateAsync({
          clientId: deal.client.id,
          payload: { contact_info }
        });
      }

      toast.success('Informações atualizadas com sucesso!');
    } catch (e) {
      toast.error('Erro ao salvar as informações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!deal) return;
    setIsSaving(true);
    try {
      await updateDeal.mutateAsync({
        dealId: deal.id,
        payload: { notes }
      });
      toast.success('Anotações salvas com sucesso!');
    } catch (e) {
      toast.error('Erro ao salvar anotações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!deal || !agency || !pipelineId) return;
    
    // Fechar Modal
    onOpenChange(false);
    
    const queryKey = ['crm_deals', agency.id, pipelineId];
    const previousDeals = qc.getQueryData(queryKey);
    
    // Optimistic Update
    qc.setQueryData(queryKey, (old: any) => old ? old.filter((d: any) => d.id !== deal.id) : []);
    
    const timerId = setTimeout(() => {
        deleteDeal.mutate(deal.id);
    }, 5000);

    toast('Negócio enviado para lixeira', {
        className: 'bg-destructive/10 text-destructive border-destructive',
        duration: 5000,
        action: {
            label: 'Desfazer',
            onClick: () => {
                clearTimeout(timerId);
                qc.setQueryData(queryKey, previousDeals);
                toast.success('Ação desfeita.');
            }
        }
    });
  };

  if (!deal) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto p-0 flex flex-col">
        <div className="p-6 pb-2 border-b">
          <SheetHeader>
            <SheetTitle className="text-2xl font-black">{deal.title}</SheetTitle>
            <SheetDescription>
              Criado em {new Date(deal.created_at).toLocaleDateString('pt-BR')}
            </SheetDescription>
          </SheetHeader>
        </div>

        <Tabs defaultValue="info" className="w-full flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4 border-b">
            <TabsList className="grid w-full grid-cols-2 mb-2">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="notes">Anotações</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {/* ABA INFO */}
            <TabsContent value="info" className="space-y-6 mt-0">
              
              {/* DEAL SECTION */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground uppercase tracking-widest border-b pb-2">Dados do Negócio</h3>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Estágio Atual</Label>
                    <Select value={stage} onValueChange={setStage}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Responsável (Closer)</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger><SelectValue placeholder="Sem responsável" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Sem responsável</SelectItem>
                        {teamMembers?.map(member => (
                          <SelectItem key={member.id} value={member.id}>{member.full_name || member.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* CLIENT SECTION */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground uppercase tracking-widest border-b pb-2 flex items-center justify-between">
                  Contato do Cliente
                  {deal.client?.name && <span className="text-muted-foreground capitalize text-xs tracking-normal font-medium">{deal.client.name}</span>}
                </h3>
                <div className="space-y-2">
                  <Label>WhatsApp / Telefone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(DD) 90000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label>Instagram / Website</Label>
                  <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@instagram ou site.com" />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                <Button variant="outline" onClick={handleDelete} className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                </Button>
                <Button onClick={handleSaveInfo} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Informações
                </Button>
              </div>
            </TabsContent>

            {/* ABA Anotações */}
            <TabsContent value="notes" className="space-y-4 mt-0 h-full flex flex-col">
              <h3 className="font-semibold text-sm text-foreground uppercase tracking-widest border-b pb-2">Resumo e Anotações</h3>
              <p className="text-muted-foreground text-xs">Utilize este espaço livremente para registrar detalhes da negociação, links e históricos de reuniões.</p>
              
              <Textarea 
                className="flex-1 min-h-[300px] resize-none text-base p-4" 
                placeholder="Existem pontos de atenção para este negócio?"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />

              <div className="pt-2 flex justify-between shrink-0 items-center">
                <Button variant="outline" onClick={handleDelete} className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                </Button>
                <Button onClick={handleSaveNotes} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Anotações
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

      </SheetContent>
    </Sheet>
  );
}
