import { Loader2 } from 'lucide-react';

export function AuthLoader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-950 z-[9999]">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150 animate-pulse" />
        <img 
          src="/K transparante.png" 
          alt="Kanba Logo" 
          className="h-20 w-auto relative z-10 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]" 
        />
      </div>
      
      <div className="flex flex-col items-center gap-6 relative z-10">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 ml-[0.5em]">
          Initializing Systems
        </p>
      </div>
    </div>
  );
}
