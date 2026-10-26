import DOMPurify from 'dompurify';
import { marked } from 'marked';
import type { TocItem } from '../types';
import { slugify, withBase } from './utils';

export interface MarkdownRenderOptions {
  /** Remove o primeiro título, que já aparece no cabeçalho da página. */
  dropFirstHeading?: boolean;
  /** Resolve links de dados no formato [texto](#id) para rotas reais. */
  resolveHash?: (hash: string) => string | null;
  /** Cria âncoras e itens de TOC para "Art. 11", "Parágrafo único" e "§ 1º". */
  includeArticleAnchors?: boolean;
}

export interface RenderedMarkdown {
  html: string;
  toc: TocItem[];
}

const LEGAL_PARAGRAPH = /^(Art\.\s*\d+|Parágrafo único|§\s*\d+)/i;

/**
 * Renderiza Markdown com marked e sanitiza o HTML com DOMPurify antes de
 * inseri-lo no documento. O conteúdo do JSON nunca é tratado como confiável.
 */
export function renderMarkdown(markdown: string, options: MarkdownRenderOptions = {}): RenderedMarkdown {
  const prepared = markdown
    // <Box> é a única tag "autoral" usada no conteúdo; vira um callout seguro.
    .replace(/<Box>/gi, '<div class="md-box">')
    .replace(/<\/Box>/gi, '</div>')
    // Extensão visual usada em algumas entradas: "-# OOC: ...".
    .replace(/^-#\s+(.+)$/gm, '> **OOC:** $1');

  const rawHtml = marked.parse(prepared, { gfm: true, breaks: false }) as string;

  const sanitized = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'svg', 'math', 'img'],
    FORBID_ATTR: ['style', 'srcset', 'formaction'],
    ADD_ATTR: ['target', 'rel'],
  });

  const template = document.createElement('template');
  template.innerHTML = sanitized;

  if (options.dropFirstHeading) {
    const firstHeading = template.content.querySelector('h1, h2, h3, h4, h5, h6');
    if (firstHeading) firstHeading.remove();
  }

  const toc: TocItem[] = [];
  const usedIds = new Set<string>();

  for (const heading of Array.from(template.content.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4'))) {
    const label = heading.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (!label) continue;

    let id = `md-${slugify(label) || 'secao'}`;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `md-${slugify(label) || 'secao'}-${suffix++}`;
    }
    usedIds.add(id);
    heading.id = id;
    toc.push({
      id,
      label,
      level: Number(heading.tagName.slice(1)),
    });
  }

  if (options.includeArticleAnchors) {
    let legalIndex = 0;
    for (const paragraph of Array.from(template.content.querySelectorAll<HTMLParagraphElement>('p'))) {
      const label = paragraph.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      const match = LEGAL_PARAGRAPH.exec(label);
      if (!match) continue;

      const cleanedLabel = match[1]?.replace(/\s+/g, ' ').trim() ?? label.slice(0, 24);
      let id = `artigo-${slugify(cleanedLabel) || ++legalIndex}`;
      let suffix = 2;
      while (usedIds.has(id)) {
        id = `artigo-${slugify(cleanedLabel) || legalIndex}-${suffix++}`;
      }
      usedIds.add(id);
      paragraph.id = id;
      toc.push({
        id,
        label: cleanedLabel,
        level: 3,
      });
    }
  }

  for (const anchor of Array.from(template.content.querySelectorAll<HTMLAnchorElement>('a[href]'))) {
    const href = anchor.getAttribute('href') ?? '';

    if (href.startsWith('#')) {
      const resolved = options.resolveHash?.(href.slice(1));
      if (resolved) {
        anchor.href = withBase(resolved);
      }
      continue;
    }

    if (/^https?:\/\//i.test(href)) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
  }

  // Links externos no rodapé de callouts e listas também recebem ícone acessível
  // sem alterar o texto original.

  return {
    html: template.innerHTML,
    toc,
  };
}

/** Remove IDs duplicados mantendo os primeiros itens (usado em TOCs combinados). */
export function uniqueToc(items: TocItem[]): TocItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
