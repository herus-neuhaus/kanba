import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function LoadingSplash() {
  const { signOut } = useAuth();
  const [showRecovery, setShowRecovery] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRecovery(true);
      console.warn("Loading timeout reached. Possible auth deadlock detected.");
    }, 8000); // 8 seconds before showing recovery option
    
    return () => clearTimeout(timer);
  }, []);

  const handleRecovery = () => {
    signOut().finally(() => {
      window.location.href = "/auth";
    });
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#09090b] z-[9999]">
      {/* Background glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative mb-12 group">
        {/* Pulsing ring */}
        <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full scale-150 animate-pulse" />
        
        {/* Logo with slight tilt and premium drop shadow */}
        <div className="relative z-10 transform transition-transform duration-1000 group-hover:scale-110">
          <img 
            src="/K transparante.png" 
            alt="Kanba Logo" 
            className="h-24 w-auto drop-shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-in fade-in zoom-in duration-1000" 
          />
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-8 relative z-10 w-full max-w-[280px]">
        {/* Simple elegant loader */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        <div className="space-y-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/50 ml-[0.6em] animate-pulse">
            Sincronizando Dados
          </p>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        {showRecovery && (
          <button
            onClick={handleRecovery}
            className="mt-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors duration-300 animate-in fade-in slide-in-from-bottom-2"
          >
            A demora persiste? <span className="underline decoration-primary/30 underline-offset-4">Tente Reautenticar</span>
          </button>
        )}
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="text-[9px] font-medium uppercase tracking-[0.4em] text-white/10">
          Protocolo de Segurança Kanba &bull; Beta v2.4
        </p>
      </div>
    </div>
  );
}
