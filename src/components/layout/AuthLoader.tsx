import { Loader2 } from 'lucide-react';
import LogoWithBg from '@/img/kanba-logo-transparent.png';

export function AuthLoader() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-background overflow-hidden animate-in fade-in duration-500">
      {/* Premium Mesh Background (same as Auth) */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />
      </div>

      <div className="flex flex-col items-center space-y-8">
        <div className="relative">
           <div className="absolute inset-0 bg-primary/40 blur-2xl opacity-50 animate-pulse" />
           <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-primary-foreground p-0.5 shadow-2xl overflow-hidden scale-110">
              <div className="h-full w-full rounded-[1.3rem] bg-background p-2.5 flex items-center justify-center">
                 <img src={LogoWithBg} alt="Kanba Logo" className="h-full w-full object-cover rounded-xl" />
              </div>
           </div>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
           <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-xs font-black uppercase tracking-[0.3em] text-foreground/80 animate-pulse">
                Sincronizando Central...
              </p>
           </div>
           
           <div className="h-1 w-48 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-progress-indeterminative rounded-full" />
           </div>
        </div>
        
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic opacity-30">KANBA</h1>
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Protocolo de Operações V2.0</p>
        </div>
      </div>
    </div>
  );
}
