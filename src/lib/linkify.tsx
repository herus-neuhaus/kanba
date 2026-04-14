import React from 'react';

/**
 * Regex robusta para capturar URLs que começam com http ou https.
 */
export const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Renderiza um texto transformando URLs em links <a> clicáveis.
 * Retorna um array de elementos (strings e JSX) para o React processar com segurança.
 */
export function renderTextWithLinks(text: string): React.ReactNode[] {
  if (!text) return [];

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Criamos uma nova instância da regex com a flag 'g' para iterar corretamente
  const regex = new RegExp(URL_REGEX.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Adiciona o texto puro antes da URL encontrada
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Adiciona o link renderizado
    const url = match[0];
    parts.push(
      <a
        key={`link-${match.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline font-medium break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    );

    lastIndex = match.index + url.length;
  }

  // Adiciona o restante do texto se houver
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
