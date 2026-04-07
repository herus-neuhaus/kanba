import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, QrCode, CheckCircle2, Phone, ShieldCheck, Zap } from 'lucide-react';
import { useWhatsappStatus } from '@/hooks/useWhatsappStatus';

interface WhatsappQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode?: string; // base64
  agencyId: string;
}

export function WhatsappQRModal({ isOpen, onClose, qrCode, agencyId }: WhatsappQRModalProps) {
  const { isConnected } = useWhatsappStatus(agencyId);
  const [loading, setLoading] = useState(!qrCode);

  useEffect(() => {
    if (qrCode) {
      setLoading(false);
    }
  }, [qrCode]);

  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-background/60 backdrop-blur-3xl border-none shadow-2xl ring-1 ring-white/10 rounded-[2rem] overflow-hidden animate-in zoom-in duration-300">
        <DialogHeader className="text-center pt-8">
          <div className="mx-auto h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 ring-1 ring-primary/20 relative group">
            <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/40 transition-all opacity-50" />
            <Phone className="h-8 w-8 text-primary relative z-10" />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">
            {isConnected ? 'Sincronização Ativa' : 'Conectar Central WhatsApp'}
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mt-2 px-10 leading-relaxed">
            {isConnected 
              ? 'Protocolo de comunicação estabelecido com sucesso.' 
              : 'Escaneie o QR Code abaixo para habilitar notificações operacionais automáticas.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-10 relative">
          {isConnected ? (
            <div className="flex flex-col items-center space-y-6 animate-in zoom-in slide-in-from-bottom-4 duration-500">
               <div className="h-32 w-32 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                 <CheckCircle2 className="h-16 w-16 text-green-500" />
               </div>
               <div className="space-y-1 text-center">
                 <p className="text-xs font-black uppercase tracking-widest text-green-400">STATUS: OPERACIONAL</p>
                 <p className="text-[9px] text-muted-foreground/50 tracking-widest uppercase">Redirecionando para central de comando...</p>
               </div>
            </div>
          ) : loading ? (
            <div className="h-64 w-64 bg-muted/5 rounded-[2rem] flex flex-col items-center justify-center space-y-4 border border-white/5 animate-pulse">
               <Loader2 className="h-10 w-10 text-primary animate-spin" />
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Gerando Instância...</p>
            </div>
          ) : (
            <div className="relative group p-4 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl transition-transform hover:scale-[1.02]">
               <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-50 rounded-[2.5rem]" />
               <div className="relative bg-white p-6 rounded-[2rem] shadow-inner overflow-hidden">
                 <img src={qrCode} alt="WhatsApp QR Code" className="w-52 h-52 object-contain" />
               </div>
               
               {/* Decorative corner elements */}
               <div className="absolute top-2 left-2 h-8 w-8 border-l-2 border-t-2 border-primary/40 rounded-tl-xl" />
               <div className="absolute top-2 right-2 h-8 w-8 border-r-2 border-t-2 border-primary/40 rounded-tr-xl" />
               <div className="absolute bottom-2 left-2 h-8 w-8 border-l-2 border-b-2 border-primary/40 rounded-bl-xl" />
               <div className="absolute bottom-2 right-2 h-8 w-8 border-r-2 border-b-2 border-primary/40 rounded-br-xl" />
            </div>
          )}
        </div>

        <DialogFooter className="px-8 pb-8 sm:justify-center flex-col gap-4">
          {!isConnected && (
            <>
              <div className="flex items-center gap-4 text-[9px] font-black tracking-widest text-muted-foreground/40 uppercase mb-4">
                <div className="flex-1 h-[1px] bg-white/5" />
                Segurança Platinum v2.0
                <div className="flex-1 h-[1px] bg-white/5" />
              </div>
              
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white hover:bg-white/5 h-10 rounded-xl"
              >
                Conectar Depois
              </Button>
            </>
          )}

          <div className="flex justify-center gap-6 pt-4 opacity-10">
            <ShieldCheck className="h-4 w-4" />
            <Zap className="h-4 w-4" />
          </div>
        </DialogFooter>

        {/* Global style for dialog backdrop */}
        <style dangerouslySetInnerHTML={{ __html: `
          [data-state='open'] > .fixed {
            background-color: rgba(13, 6, 32, 0.9) !important;
            backdrop-filter: blur(8px) !important;
          }
        `}} />
      </DialogContent>
    </Dialog>
  );
}
