import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, FolderKanban } from "lucide-react";

export function ClientLayout({ children }: { children: ReactNode }) {
  const { agency, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between p-4 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <Link to="/cliente/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-black text-sm shadow-lg shadow-primary/20">
              K
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-lg tracking-tight lowercase">Kanba<span className="text-primary pr-2">.</span></span>
            </div>
          </Link>
          <div className="h-4 w-[1px] bg-border mx-2" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
             Ambiente do Cliente
          </span>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 rounded-full pl-2 pr-4 gap-2 border bg-muted/20 hover:bg-muted/50 transition-colors">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/10 text-[10px] text-primary font-black">
                    {profile?.full_name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-black uppercase tracking-wider">{profile?.full_name?.split(" ")[0]}</span>
                  <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">{agency?.name}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-none shadow-2xl bg-background/95 backdrop-blur-xl rounded-xl">
              <DropdownMenuItem className="text-xs font-bold gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                Sair do Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto flex-1 p-4 md:p-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
