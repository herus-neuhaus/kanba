import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useInvites } from '@/hooks/useInvites';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, Loader2, CheckCircle2 } from 'lucide-react';

export default function Join() {
  const { token } = useParams<{ token: string }>();
  const { session, agency: userAgency } = useAuth();
  const { acceptInvite } = useInvites();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvite() {
      if (!token) return;
      try {
        const { data, error: fetchError } = await supabase
          .from('invites')
          .select('*, agency:agencies(name)')
          .eq('token', token)
          .single();

        if (fetchError || !data) throw new Error('Convite inválido ou expirado');
        if (data.used) throw new Error('Este convite já foi utilizado');
        
        setInviteData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchInvite();
  }, [token]);

  const handleJoin = async () => {
    if (!token) return;
    if (!session) {
       navigate(`/auth?returnUrl=/join/${token}`);
       return;
    }
    
    // If user already belongs to an agency, they can't join another one via this simple flow for now
    if (userAgency && userAgency.id === inviteData?.agency_id) {
       toast({ title: 'Você já faz parte desta agência' });
       navigate('/');
       return;
    }

    try {
      await acceptInvite.mutateAsync(token);
      toast({ title: 'Bem-vindo!', description: `Você agora faz parte da agência ${inviteData.agency?.name}` });
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-zinc-950/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-zinc-900">
        <Card className="max-w-md w-full border-destructive/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
              <Users className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Ops! Algo deu errado</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>Voltar para o Início</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <Card className="max-w-md w-full shadow-2xl border-none bg-background/60 backdrop-blur-2xl ring-1 ring-white/10 rounded-[2.5rem] overflow-hidden relative">
        <CardHeader className="text-center pt-12">
          <div className="mx-auto bg-primary shadow-lg shadow-primary/20 p-4 rounded-3xl w-fit mb-6 rotate-3">
            <Users className="h-8 w-8 text-background" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight italic">
            Acesso <span className="text-primary not-italic inline-block ml-1">Exclusivo</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2 leading-relaxed">
            Protocolo de Integração Corporativa <br />
            para a AGÊNCIA:
          </p>
          <div className="mt-4 py-3 px-6 bg-primary/10 rounded-2xl border border-primary/20 mx-auto w-fit">
            <p className="font-black text-primary text-xl uppercase tracking-tighter">{inviteData.agency?.name}</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6 px-10 pb-10">
          <div className="space-y-4">
             <div className="flex items-start gap-4 group">
                <div className="h-10 w-10 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 transition-colors group-hover:border-primary/40 group-hover:bg-primary/5">
                   <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 text-left">GESTÃO 360°</p>
                   <p className="text-xs font-bold text-muted-foreground leading-snug text-left">Acesso total aos clientes e demandas da agência.</p>
                </div>
             </div>
             
             <div className="flex items-start gap-4 group">
                <div className="h-10 w-10 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 transition-colors group-hover:border-primary/40 group-hover:bg-primary/5">
                   <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 text-left">TIME REALTIME</p>
                   <p className="text-xs font-bold text-muted-foreground leading-snug text-left">Colaboração instantânea e notificações inteligentes.</p>
                </div>
             </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 px-10 pb-12">
          <Button 
            size="lg" 
            className="w-full h-14 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] rounded-2xl" 
            onClick={handleJoin}
            disabled={acceptInvite.isPending}
          >
            {acceptInvite.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            {session ? 'ATIVAR ACESSO' : 'CRIAR CONTA & ATIVAR'}
          </Button>
          {!session && (
            <p className="text-[9px] text-center text-muted-foreground uppercase tracking-[0.3em] font-black opacity-40">
              Redirecionamento para <br/> Plataforma de Autenticação
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
