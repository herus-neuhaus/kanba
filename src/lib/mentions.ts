import type { Profile } from '@/types';

/**
 * Regex que captura menções no formato @Nome ou @Nome_Sobrenome.
 * Suporta nomes com espaço quando digitados via autocomplete (armazenados internamente como @Nome_Sobrenome).
 */
export const MENTION_REGEX = /@([\w\u00C0-\u017E]+(?:_[\w\u00C0-\u017E]+)*)/g;

/**
 * Extrai a lista de Profile's mencionados em um texto.
 * Faz matching por nome normalizado (case-insensitive, sem acento).
 */
export function extractMentions(text: string, team: Profile[]): Profile[] {
  const matches = [...text.matchAll(MENTION_REGEX)].map((m) =>
    m[1].replace(/_/g, ' ').toLowerCase()
  );

  if (!matches.length) return [];

  return team.filter((member) => {
    const normalized = (member.full_name || '').toLowerCase();
    return matches.some((mention) => normalized === mention || normalized.startsWith(mention));
  });
}

/**
 * Detecta se o cursor está dentro de uma menção incompleta e retorna o
 * fragmento digitado após o @, ou null se não estiver em uma menção.
 */
export function getActiveMentionQuery(text: string, cursorPos: number): string | null {
  const textUpToCursor = text.slice(0, cursorPos);
  // Encontra o último @ antes do cursor que não tenha espaço depois
  const match = textUpToCursor.match(/@([\w\u00C0-\u017E]*)$/);
  return match ? match[1] : null;
}

/**
 * Insere o nome do membro no texto, substituindo o fragmento @parcial pelo
 * @Nome_Completo (com underscores para evitar quebra de palavra no regex).
 */
export function insertMention(
  text: string,
  cursorPos: number,
  member: Profile
): { newText: string; newCursorPos: number } {
  const textUpToCursor = text.slice(0, cursorPos);
  const textAfterCursor = text.slice(cursorPos);

  // Substitui o @fragmento pelo nome completo com underscore
  const mentionTag = `@${(member.full_name || '').replace(/\s+/g, '_')}`;
  const replaced = textUpToCursor.replace(/@[\w\u00C0-\u017E]*$/, mentionTag + ' ');

  const newText = replaced + textAfterCursor;
  const newCursorPos = replaced.length;

  return { newText, newCursorPos };
}

/**
 * Renderiza um texto transformando @Menções em spans destacados.
 * Retorna um array de strings/JSX para uso com React.
 */
export function renderTextWithMentions(text: string): Array<{ type: 'text' | 'mention'; value: string }> {
  const parts: Array<{ type: 'text' | 'mention'; value: string }> = [];
  let lastIndex = 0;

  const regex = new RegExp(MENTION_REGEX.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'mention', value: match[0].replace(/_/g, ' ') });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}
