import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { Bold, Italic, Strikethrough, List, ListOrdered, Link as LinkIcon, Quote, Undo, Redo, Heading1, Heading2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder = 'Escreva a descrição detalhada aqui...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'cursor-text before:content-[attr(data-placeholder)] before:absolute before:text-muted-foreground/50 before:opacity-50 before:pointer-events-none',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert min-h-[150px] max-w-none w-full p-4 focus:outline-none bg-transparent',
      },
    },
  })

  if (!editor) {
    return null
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden bg-muted/10 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border/50 bg-muted/20 p-1.5">
        <div className="flex items-center gap-1 pr-2 border-r border-border/50">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn("p-1.5 rounded hover:bg-muted/50 text-muted-foreground transition-colors", editor.isActive('heading', { level: 1 }) && "bg-muted text-foreground")}
            title="Título 1"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn("p-1.5 rounded hover:bg-muted/50 text-muted-foreground transition-colors", editor.isActive('heading', { level: 2 }) && "bg-muted text-foreground")}
            title="Título 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-border/50">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn("p-1.5 rounded hover:bg-muted/50 text-muted-foreground transition-colors", editor.isActive('bold') && "bg-muted text-foreground font-bold")}
            title="Negrito"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn("p-1.5 rounded hover:bg-muted/50 text-muted-foreground transition-colors", editor.isActive('italic') && "bg-muted text-foreground")}
            title="Itálico"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn("p-1.5 rounded hover:bg-muted/50 text-muted-foreground transition-colors", editor.isActive('strike') && "bg-muted text-foreground")}
            title="Tachado"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={setLink}
            className={cn("p-1.5 rounded hover:bg-muted/50 text-muted-foreground transition-colors", editor.isActive('link') && "bg-muted text-foreground")}
            title="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-border/50">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn("p-1.5 rounded hover:bg-muted/50 text-muted-foreground transition-colors", editor.isActive('bulletList') && "bg-muted text-foreground")}
            title="Lista de Pontos"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn("p-1.5 rounded hover:bg-muted/50 text-muted-foreground transition-colors", editor.isActive('orderedList') && "bg-muted text-foreground")}
            title="Lista Numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn("p-1.5 rounded hover:bg-muted/50 text-muted-foreground transition-colors", editor.isActive('blockquote') && "bg-muted text-foreground")}
            title="Citação"
          >
            <Quote className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 pl-2 ml-auto">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground disabled:opacity-30 transition-colors"
            title="Desfazer"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground disabled:opacity-30 transition-colors"
            title="Refazer"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Editor Content */}
      <div className="relative cursor-text min-h-[150px]" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
