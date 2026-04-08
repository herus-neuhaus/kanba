import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/useProjects';
import { useProjectPermissions, PermissionLevel } from '@/hooks/useProjectPermissions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, ShieldAlert, ShieldCheck, Loader2, FolderKanban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProjectAccessDialogProps {
  profileId: string;
  profileName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectAccessDialog({ profileId, profileName, isOpen, onOpenChange }: ProjectAccessDialogProps) {
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: permissions = [], updatePermission, isLoading: loadingPerms } = useProjectPermissions(profileId);
  const [busyProjects, setBusyProjects] = useState<Record<string, boolean>>({});

  const handleToggleAccess = async (projectId: string, currentStatus: boolean) => {
    setBusyProjects(prev => ({ ...prev, [projectId]: true }));
    try {
      await updatePermission.mutateAsync({
        projectId,
        level: currentStatus ? null : 'view' // If currently has access, remove it. If not, add view as default.
      });
    } finally {
      setBusyProjects(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const handleChangeLevel = async (projectId: string, level: PermissionLevel) => {
    setBusyProjects(prev => ({ ...prev, [projectId]: true }));
    try {
      await updatePermission.mutateAsync({ projectId, level });
    } finally {
      setBusyProjects(prev => ({ ...prev, [projectId]: false }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl border-none shadow-2xl bg-background/95 backdrop-blur-xl rounded-[2rem] overflow-hidden p-0 gap-0">
        <DialogHeader className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl ring-1 ring-primary/20">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Protocolo de Acesso</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                Gerenciando acessos para: {profileName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-8 pb-4">
           <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-relaxed">
                 <ShieldAlert className="h-3 w-3 inline mr-1 mb-0.5 text-amber-500" />
                 Membros sem permissão explícita não visualizam nenhum dado referente ao projeto ou suas tarefas. 
                 Admins mantêm acesso total independente deste quadro.
              </p>
           </div>
        </div>

        <ScrollArea className="h-[400px] px-8">
          <div className="space-y-3 pb-8">
            {loadingProjects || loadingPerms ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Projetos...</p>
              </div>
            ) : projects.length === 0 ? (
               <div className="py-20 text-center opacity-40">
                  <FolderKanban className="h-10 w-10 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhum projeto registrado na agência.</p>
               </div>
            ) : (
              projects.map(project => {
                const permission = permissions.find(p => p.project_id === project.id);
                const isBusy = busyProjects[project.id];
                
                return (
                  <div 
                    key={project.id} 
                    className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                      permission ? 'bg-primary/[0.03] border-primary/20 shadow-sm' : 'bg-muted/10 border-transparent hover:bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Checkbox 
                          id={`proj-${project.id}`}
                          checked={!!permission}
                          disabled={isBusy}
                          onCheckedChange={() => handleToggleAccess(project.id, !!permission)}
                          className="h-5 w-5 rounded-md border-2 border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        {isBusy && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                      <Label 
                        htmlFor={`proj-${project.id}`}
                        className={`font-black text-sm uppercase tracking-tight cursor-pointer select-none ${!permission && 'opacity-50'}`}
                      >
                        {project.name}
                      </Label>
                    </div>

                    {permission && (
                      <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                        <Select 
                          value={permission.permission_level} 
                          onValueChange={(val) => handleChangeLevel(project.id, val as PermissionLevel)}
                          disabled={isBusy}
                        >
                          <SelectTrigger className="h-8 w-[120px] bg-background border-none ring-1 ring-primary/20 font-black text-[9px] uppercase tracking-widest rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-none shadow-2xl bg-background/95 backdrop-blur-xl font-bold">
                            <SelectItem value="view" className="text-[9px] font-black uppercase tracking-widest">Visualizar</SelectItem>
                            <SelectItem value="edit" className="text-[9px] font-black uppercase tracking-widest">Editar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-8 pt-4 border-t border-border/50 bg-muted/5">
          <Button variant="ghost" className="font-black text-[10px] uppercase tracking-widest" onClick={() => onOpenChange(false)}>
            Finalizar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
