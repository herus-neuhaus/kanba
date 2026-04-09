import { useState, useCallback } from 'react';
import { useWiki } from '@/hooks/useWiki';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { Tldraw, Editor, getSnapshot, loadSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';

interface ProjectWikiProps {
  projectId: string | undefined;
}

export function ProjectWiki({ projectId }: ProjectWikiProps) {
  const { data: wiki, isLoading, saveWiki } = useWiki(projectId);
  const [editor, setEditor] = useState<Editor | null>(null);

  const handleMount = useCallback((mountedEditor: Editor) => {
    setEditor(mountedEditor);
    
    // Set to dark mode to match UI as requested
    mountedEditor.user.updateUserPreferences({ colorScheme: 'dark' } as any);

    if (wiki?.content && typeof wiki.content === 'object' && ('document' in wiki.content || 'store' in wiki.content)) {
      try {
        loadSnapshot(mountedEditor.store, wiki.content as any);
      } catch (error) {
        console.error('Failed to load tldraw snapshot:', error);
      }
    }
  }, [wiki]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center border border-border rounded-xl bg-card">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSave = () => {
    if (editor) {
      const snapshot = getSnapshot(editor.store);
      saveWiki.mutate({ content: snapshot });
    }
  };

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
          disabled={saveWiki.isPending || !editor}
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

      <div className="flex-1 relative mt-2 rounded-xl border border-border/60 overflow-hidden min-h-[600px] h-full w-full">
        {/* The Tldraw component needs to be within a container that has a determined height/width */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <Tldraw onMount={handleMount} />
        </div>
      </div>
    </div>
  );
}
