import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  Settings,
  FolderKanban,
  LayoutDashboard,
  BookOpen,
  Wallet,
  Building2,
  Users
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useProjects } from "@/hooks/useProjects"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()
  
  const { workspaces, setActiveWorkspaceId } = useWorkspace()
  const { data: projects = [] } = useProjects()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="O que você precisa encontrar? (Cmd+K)" />
      <CommandList className="max-h-[300px]">
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        
        {projects.length > 0 && (
          <CommandGroup heading="Acesso Rápido a Projetos">
            {projects.slice(0, 5).map(p => (
              <CommandItem key={p.id} onSelect={() => runCommand(() => navigate(`/projetos/${p.id}/kanban`))} className="cursor-pointer">
                <FolderKanban className="mr-2 h-4 w-4 text-primary" />
                <span>{p.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />
        
        <CommandGroup heading="Mudar de Workspace">
          <CommandItem onSelect={() => runCommand(() => { setActiveWorkspaceId(null); navigate('/dashboard'); })} className="cursor-pointer">
             <LayoutDashboard className="mr-2 h-4 w-4" />
             <span>Visão Global</span>
          </CommandItem>
          {workspaces.map(w => (
            <CommandItem key={w.id} onSelect={() => runCommand(() => { setActiveWorkspaceId(w.id); navigate('/dashboard'); })} className="cursor-pointer">
              <Building2 className="mr-2 h-4 w-4" />
              <span>{w.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        
        <CommandGroup heading="Navegação Global">
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard'))} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <CommandShortcut>⌘ D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/projetos'))} className="cursor-pointer">
            <FolderKanban className="mr-2 h-4 w-4" />
            <span>Ver Todos os Projetos</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/team'))} className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" />
            <span>Gerenciar Equipe</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/crm'))} className="cursor-pointer">
            <Wallet className="mr-2 h-4 w-4" />
            <span>CRM Vendas</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/wiki'))} className="cursor-pointer">
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Wiki / Docs</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/settings'))} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
            <CommandShortcut>⌘ S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
