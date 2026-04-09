import { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getActiveMentionQuery, insertMention } from '@/lib/mentions';
import type { Profile } from '@/types';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  team: Profile[];
  placeholder?: string;
  className?: string;
}

export function MentionInput({
  value,
  onChange,
  onKeyDown,
  team,
  placeholder = 'Escreva algo... use @ para mencionar alguém',
  className,
}: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Filtered list based on what was typed after @
  const filteredTeam = mentionQuery !== null
    ? team.filter((m) =>
        (m.full_name || '').toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : [];

  const isOpen = mentionQuery !== null && filteredTeam.length > 0;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  // Reset highlighted index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [mentionQuery]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setMentionQuery(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      onChange(newText);

      const cursor = e.target.selectionStart ?? newText.length;
      const query = getActiveMentionQuery(newText, cursor);
      setMentionQuery(query);
    },
    [onChange]
  );

  const selectMember = useCallback(
    (member: Profile) => {
      const cursor = textareaRef.current?.selectionStart ?? value.length;
      const { newText, newCursorPos } = insertMention(value, cursor, member);
      onChange(newText);
      setMentionQuery(null);

      // Restore focus and cursor position after React re-renders
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex((i) => Math.min(i + 1, filteredTeam.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          if (filteredTeam[highlightedIndex]) {
            selectMember(filteredTeam[highlightedIndex]);
          }
          return;
        }
        if (e.key === 'Escape') {
          setMentionQuery(null);
          return;
        }
      }

      // Pass through to parent handler (e.g. submit on Enter)
      onKeyDown?.(e);
    },
    [isOpen, filteredTeam, highlightedIndex, selectMember, onKeyDown]
  );

  return (
    <div className="relative flex-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className={cn(
          'w-full resize-none overflow-hidden bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 leading-relaxed py-1',
          className
        )}
      />

      {/* Mention Autocomplete Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-0 mb-2 w-56 z-50 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-150"
        >
          <div className="px-3 py-2 border-b border-border/40">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Mencionar membro
            </p>
          </div>
          <ul className="py-1 max-h-48 overflow-y-auto">
            {filteredTeam.map((member, index) => (
              <li key={member.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent textarea blur
                    selectMember(member);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                    index === highlightedIndex
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/60'
                  )}
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-[10px] font-black">
                      {member.full_name?.substring(0, 2)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{member.full_name}</p>
                    {member.phone && (
                      <p className="text-[10px] text-muted-foreground truncate">{member.phone}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
