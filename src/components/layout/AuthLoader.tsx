import { Loader2 } from 'lucide-react';

export function AuthLoader() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-background overflow-hidden animate-in fade-in duration-500">
      {/* Radial copper glow background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 600px 400px at 50% 40%, rgba(163,81,57,0.14) 0%, transparent 70%)' }} />
      </div>

      <div className="flex flex-col items-center space-y-8">
        {/* Logo with copper glow */}
        <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(163,81,57,0.4) 0%, transparent 70%)', filter: 'blur(12px)', animation: 'pulse 2s infinite' }} />
          <img
            src="/K transparante.png"
            alt="Kanba"
            style={{ height: 68, width: 'auto', filter: 'drop-shadow(0 0 16px rgba(163,81,57,0.75))', position: 'relative', zIndex: 1 }}
          />
        </div>
        
        <div className="flex flex-col items-center space-y-4">
           <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/70 animate-pulse">
                Carregando...
              </p>
           </div>
           
           <div className="h-0.5 w-48 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-progress-indeterminative rounded-full" />
           </div>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <span style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: '1.3rem',
            letterSpacing: '0.16em',
            background: 'linear-gradient(135deg, #8B3B26 0%, #A35139 35%, #B39B6F 75%, #C9AE7E 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            opacity: 0.5,
          }}>KANBA</span>
          <p className="text-[8px] font-semibold uppercase tracking-[0.35em] text-muted-foreground/30">Gestão Inteligente</p>
        </div>
      </div>
    </div>
  );
}
