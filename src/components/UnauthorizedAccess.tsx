import { UserX, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export function UnauthorizedAccess() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-destructive/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
      
      <Card className="max-w-md w-full border-none shadow-2xl bg-background/80 backdrop-blur-xl ring-1 ring-border mt-[-10vh]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-destructive via-destructive/50 to-transparent rounded-t-xl" />
        
        <CardHeader className="pt-10 pb-6 text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-[2rem] flex items-center justify-center border border-destructive/20 rotate-6 shadow-inner ring-4 ring-destructive/5">
            <UserX className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">
              Acesso <span className="text-destructive not-italic">Suspenso</span>
            </CardTitle>
            <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-80">
              Protocolo de Segurança Ativado
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="text-center px-10 pb-8 space-y-6">
          <p className="text-sm font-medium text-foreground/80 leading-relaxed">
            Sua conta foi inativada ou removida desta agência. Para recuperar o acesso ou tirar dúvidas, entre em contato com o administrador do sistema.
          </p>
          
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border/50 text-left">
            <ShieldAlert className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
              Se você acredita que isso é um erro, tente recarregar a página ou fazer login novamente.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-3 p-8 border-t border-border/40">
          <Button 
            className="w-full h-12 gap-2 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20"
            onClick={() => window.location.href = '/'}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o Início
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
            onClick={() => window.location.href = '/auth'}
          >
            Fazer Login com outra Conta
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
