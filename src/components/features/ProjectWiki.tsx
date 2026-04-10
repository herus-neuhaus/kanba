import { useState } from 'react';
import { useWiki } from '@/hooks/useWiki';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { Excalidraw } from '@excalidraw/excalidraw';
import "@excalidraw/excalidraw/index.css";

interface ProjectWikiProps {
  projectId: string | undefined;
}

export function ProjectWiki({ projectId }: ProjectWikiProps) {
  const { data: wiki, isLoading, saveWiki } = useWiki(projectId);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center border border-border rounded-xl bg-card">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSave = () => {
    if (excalidrawAPI) {
      const elements = excalidrawAPI.getSceneElements();
      // Salvando apenas os elementos desenhados para evitar a corrupção do appState ao fazer parse de objetos JSON que deveriam ser Maps
      saveWiki.mutate({ content: { elements } });
    }
  };

  // Prepara o initialData se ele for um objeto válido de configuração de Excalidraw (ex: {elements: [], appState: {}})
  // Se os dados antigos forem do tldraw, o excalidraw vai ignorá-los.
  // Não carregamos o appState do backend para não dar Crash de TypeError no Map de collaborators.
  let initialData = undefined;
  if (wiki?.content && typeof wiki.content === 'object' && ('elements' in wiki.content || Array.isArray(wiki.content))) {
     initialData = {
       elements: Array.isArray(wiki.content) ? wiki.content : (wiki.content as any).elements || []
     };
  }

  return (
    <div className="flex flex-col gap-4 bg-card rounded-xl border border-border p-6 shadow-sm min-h-[calc(100vh-16rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Wiki do Projeto
          </h2>
          <p className="text-sm text-muted-foreground">
            Use este espaço para briefings, anotações de reunião e canvas livre.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saveWiki.isPending || !excalidrawAPI}
          className="gap-2 shadow-sm"
        >
          {saveWiki.isPending ? (
             <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
             <Save className="h-4 w-4" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <div className="relative w-full h-[calc(100vh-12rem)] min-h-[500px] border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <Excalidraw 
          excalidrawAPI={(api: any) => setExcalidrawAPI(api)} 
          initialData={initialData as any}
          theme="light"
        />
      </div>
    </div>
  );
}
