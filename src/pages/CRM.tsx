import React from 'react';
import { Rocket, Sparkles, Users, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CRM() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in text-center">
      {/* Decorative elements */}
      <div className="relative mb-12">
        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="relative bg-background border border-primary/20 p-8 rounded-[2.5rem] shadow-2xl">
          <Rocket className="h-16 w-16 text-primary animate-bounce-slow" />
        </div>
        <div className="absolute -top-2 -right-2">
            <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
                Pipeline de Inovação
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground decoration-primary/30 underline-offset-8">
                Módulo de CRM em <span className="text-primary italic">Desenvolvimento</span> 🚀
            </h1>
        </div>
        
        <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto font-medium">
          Estamos construindo um ecossistema poderoso totalmente integrado ao seu <span className="text-foreground font-bold">Kanban</span> e <span className="text-foreground font-bold">WhatsApp</span>. 
          Em breve, você poderá gerenciar leads, funis de vendas e automações de conversão sem sair da plataforma.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 text-left">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2 group hover:bg-muted/50 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
                    <Users className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm">Gestão de Leads</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">Sincronização automática de contatos vindos das suas automações.</p>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2 group hover:bg-muted/50 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2">
                    <Zap className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm">Funis Inteligentes</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">Visualize o progresso das suas vendas com a mesma simplicidade do Kanban.</p>
            </div>
        </div>

        <div className="pt-10">
            <Button size="lg" disabled className="rounded-full px-8 font-black uppercase tracking-widest text-[11px] gap-2 shadow-xl shadow-primary/20 opacity-50">
                Notificar-me no Lançamento <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="mt-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em]">
                Estimativa de Entrega: Q3 2026
            </p>
        </div>
      </div>
    </div>
  );
}

// Simple bounce animation not present in default tailwind
const style = document.createElement('style');
style.textContent = `
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
    50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
  }
  .animate-bounce-slow {
    animation: bounce-slow 3s infinite;
  }
`;
document.head.appendChild(style);
