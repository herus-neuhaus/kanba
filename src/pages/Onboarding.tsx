import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building2, Zap, LayoutDashboard, Globe, ShieldCheck, Loader2 } from 'lucide-react';
import { AuthLoader } from '@/components/layout/AuthLoader';
import { WhatsappQRModal } from '@/components/WhatsappQRModal';
import { supabase } from '@/integrations/supabase/client';
import LogoWithBg from '@/img/kanba-logo-transparent.png';

export default function Onboarding() {
  const { createAgency, agency, loading } = useAuth();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | undefined>(undefined);
  const [newAgencyId, setNewAgencyId] = useState<string | undefined>(undefined);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // If we have an agency and NO modal is in progress, redirect to dashboard
    if (!loading && agency && !isModalOpen && !newAgencyId) {
      navigate('/', { replace: true });
    }
  }, [agency, navigate, loading, isModalOpen, newAgencyId]);

  if (loading || (agency && !isModalOpen && !newAgencyId)) return <AuthLoader />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Create the agency
      const agencyData = await createAgency(name);
      setNewAgencyId(agencyData.id);
      
      toast({ title: 'Agência criada!', description: 'Iniciando sincronização com WhatsApp...' });

      // 2. Open modal immediately (shows loading state)
      setIsModalOpen(true);

      // 3. Trigger Edge Function to create instance
      const { data, error } = await supabase.functions.invoke('create-whatsapp-instance', {
        body: { agencyId: agencyData.id, agencyName: name }
      });

      if (error) throw error;

      if (data?.qrcode) {
        setQrCode(data.qrcode);
      } else {
        throw new Error('Não foi possível gerar o QR Code.');
      }

    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
      // If error, we still created the agency, so let's allow going to dashboard
      if (newAgencyId) navigate('/', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 bg-background overflow-hidden">
      {/* ... (background code same as before) */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />
      </div>

      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center space-y-4">
           {/* ... logo code same as before */}
           <div className="relative group perspective-1000">
              <div className="absolute inset-0 bg-primary/40 blur-2xl group-hover:bg-primary/60 transition-colors opacity-50" />
              <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-primary-foreground p-0.5 shadow-2xl transition-transform hover:scale-110">
                 <div className="h-full w-full rounded-[1.2rem] bg-background p-2.5 flex items-center justify-center overflow-hidden">
                    <img src={LogoWithBg} alt="Kanba Logo" className="h-full w-full object-cover rounded-xl" />
                 </div>
              </div>
           </div>
           
           <div className="space-y-1">
             <h1 className="text-3xl font-black tracking-tighter uppercase italic">KANBA</h1>
             <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Configuração Inicial da Central</p>
           </div>
        </div>

        <Card className="border-none shadow-2xl ring-1 ring-border/50 bg-background/60 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 ring-1 ring-primary/20">
               <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Nomeie sua Central</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 px-4">
              Identifique sua agência para ativar todos os protocolos operacionais.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <Globe className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Ex: Minha Agência de Elite" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  className="h-12 pl-10 bg-muted/20 border-none ring-1 ring-border focus-visible:ring-primary font-bold transition-all text-center placeholder:text-muted-foreground/40"
                />
              </div>

              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full h-12 gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {submitting ? 'Ativando Protocolos...' : 'Inicializar Agência'}
                </Button>
                
                <p className="text-[8px] text-center text-muted-foreground font-bold uppercase tracking-widest px-6 leading-relaxed opacity-60">
                   Ao inicializar, você concorda com os protocolos de serviço da plataforma.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="flex justify-center gap-8 opacity-20">
           <Zap className="h-4 w-4 text-primary" />
           <ShieldCheck className="h-4 w-4 text-primary" />
           <Building2 className="h-4 w-4 text-primary" />
        </div>
      </div>

      {newAgencyId && (
        <WhatsappQRModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          qrCode={qrCode}
          agencyId={newAgencyId}
        />
      )}
    </div>
  );
}
