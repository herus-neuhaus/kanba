import { useState, useEffect } from 'react';
import { useTeam } from '@/hooks/useTeam';
import { apiClient } from '@/lib/api/client';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';

interface EnvironmentSettingsProps {
  projectId: string | undefined;
}

export function EnvironmentSettings({ projectId }: EnvironmentSettingsProps) {
  const { data: team = [], isLoading: teamLoading } = useTeam();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      fetchPermissions();
    }
  }, [projectId]);

  const fetchPermissions = async () => {
    try {
      const data = await apiClient(`/project-permissions?projectId=${projectId}`);
      setPermissions(data?.map((p: any) => p.profile_id) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (profileId: string, hasPermission: boolean) => {
    if (!projectId) return;

    try {
      if (hasPermission) {
        await apiClient('/project-permissions', {
          method: 'PUT',
          body: JSON.stringify({ project_id: projectId, profile_id: profileId, permission_level: null })
        });
        
        setPermissions(prev => prev.filter(id => id !== profileId));
        toast({ title: 'Acesso removido' });
      } else {
        await apiClient('/project-permissions', {
          method: 'PUT',
          body: JSON.stringify({ project_id: projectId, profile_id: profileId, permission_level: 'edit' })
        });
        
        setPermissions(prev => [...prev, profileId]);
        toast({ title: 'Acesso concedido' });
      }
    } catch (err: any) {
      toast({ title: 'Erro ao alterar acesso', description: err.message, variant: 'destructive' });
    }
  };

  const filteredTeam = team.filter(m => 
    m.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    (m as any).email?.toLowerCase().includes(search.toLowerCase())
  );

  if (teamLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-border/50 shadow-xl shadow-primary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black uppercase tracking-tight">Membros do Projeto</CardTitle>
              <CardDescription>Defina quais colaboradores da agência podem visualizar e interagir com este projeto.</CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border">
               <Users className="h-3.5 w-3.5 text-muted-foreground" />
               <span className="text-xs font-bold">{permissions.length} membros com acesso</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input 
              placeholder="Buscar por nome ou email..." 
              className="pl-9 h-11 border-none bg-muted/30 focus-visible:ring-primary/20 font-medium"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="divide-y divide-border/40 border rounded-xl overflow-hidden">
            {filteredTeam.map(member => {
              const hasAccess = permissions.includes(member.id);
              const isAdmin = member.role === 'manager' || member.role === 'owner';

              return (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/5">
                      <AvatarImage src={member.avatar_url || ''} />
                      <AvatarFallback className="bg-muted text-xs font-black uppercase">
                        {member.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black tracking-tight">{member.full_name}</p>
                        {isAdmin && (
                          <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-tighter h-4 px-1">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{(member as any).email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {isAdmin ? (
                      <div className="flex items-center gap-2 text-muted-foreground px-3 py-1.5 rounded-lg bg-muted/20 border border-dashed">
                        <Shield className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Acesso Vitalício</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest transition-colors",
                          hasAccess ? "text-primary" : "text-muted-foreground"
                        )}>
                          {hasAccess ? 'Com Acesso' : 'Sem Acesso'}
                        </span>
                        <Switch 
                          checked={hasAccess}
                          onCheckedChange={() => togglePermission(member.id, hasAccess)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
