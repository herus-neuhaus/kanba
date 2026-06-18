import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2, Send, Building2, Users, Phone, Mail, User } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface EnterpriseLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EnterpriseLeadModal({ isOpen, onClose }: EnterpriseLeadModalProps) {
  const { toast } = useToast();
  const { agency } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [teamSize, setTeamSize] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !whatsapp || !teamSize) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do formulário.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      await apiClient('/crm/enterprise-leads', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          whatsapp,
          teamSize,
          agencyId: agency?.id || null
        })
      });

      toast({
        title: "Estamos a caminho! 🚀",
        description: "Recebemos sua solicitação! Nosso time entrará em contato em breve.",
      });

      // Clear form and close
      setName('');
      setEmail('');
      setWhatsapp('');
      setTeamSize('');
      onClose();
    } catch (err: any) {
      console.error('Error submitting enterprise lead:', err);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível processar sua solicitação no momento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-background overlay-none border-none shadow-2xl ring-1 ring-white/10 rounded-[2.5rem] overflow-hidden animate-in zoom-in duration-300 p-0">
        <div className="p-8 relative z-10">
          <DialogHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 ring-1 ring-primary/20 relative group">
              <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/40 transition-all opacity-50" />
              <Building2 className="h-8 w-8 text-primary relative z-10" />
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-black tracking-tighter text-white leading-tight">
              Vamos personalizar o Kanba para a sua <span className="text-primary italic">operação</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground/60 mt-4 leading-relaxed">
              Entenda como o Kanba pode escalar a sua agência sem limites. Preencha os dados abaixo e entraremos em contato para uma proposta personalizada.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-8">
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Seu Nome"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="pl-12 h-12 bg-white/5 border-none ring-1 ring-white/10 focus-visible:ring-primary font-bold rounded-2xl"
                />
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  type="email"
                  placeholder="E-mail de Contato"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-12 h-12 bg-white/5 border-none ring-1 ring-white/10 focus-visible:ring-primary font-bold rounded-2xl"
                />
              </div>

              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="WhatsApp"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="pl-12 h-12 bg-white/5 border-none ring-1 ring-white/10 focus-visible:ring-primary font-bold rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 flex items-center gap-2">
                  <Users className="h-3 w-3" /> Tamanho da Equipe
                </label>
                <Select value={teamSize} onValueChange={setTeamSize}>
                  <SelectTrigger className="h-12 bg-white/5 border-none ring-1 ring-white/10 focus-visible:ring-primary font-bold rounded-2xl">
                    <SelectValue placeholder="Selecione o tamanho atual..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/10 rounded-2xl">
                    <SelectItem value="11-20" className="font-bold">11-20 pessoas</SelectItem>
                    <SelectItem value="21-50" className="font-bold">21-50 pessoas</SelectItem>
                    <SelectItem value="50+" className="font-bold">Mais de 50 pessoas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-6">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-primary/20"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar Solicitação
              </Button>
            </DialogFooter>
          </form>
        </div>
        
        {/* Background Decorative Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      </DialogContent>
    </Dialog>
  );
}
