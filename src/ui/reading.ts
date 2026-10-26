import type { TocItem } from '../types';
import { escapeAttr, escapeHtml } from '../lib/utils';

/** Sumário lateral para páginas de leitura. */
export function tocNav(items: TocItem[], label = 'Nesta página'): string {
  if (items.length === 0) return '';

  return `<nav class="reading-toc" aria-labelledby="toc-title">
    <p class="reading-toc__label" id="toc-title">${escapeHtml(label)}</p>
    <ol class="reading-toc__list">
      ${items
        .map(
          (item) => `<li class="reading-toc__item reading-toc__item--level-${item.level}">
            <a href="#${escapeAttr(item.id)}">${escapeHtml(item.label)}</a>
          </li>`,
        )
        .join('')}
    </ol>
  </nav>`;
}

/**
 * Marca no sumário a seção visível. Usa IntersectionObserver e não interfere
 * na navegação por teclado.
 */
export function initTocSpy(article: HTMLElement, toc: HTMLElement | null, signal: AbortSignal): void {
  if (!toc) return;

  const links = new Map<string, HTMLAnchorElement>();
  toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    const id = decodeURIComponent(link.getAttribute('href')?.slice(1) ?? '');
    if (id) links.set(id, link);
  });

  const targets = Array.from(links.keys())
    .map((id) => document.getElementById(id))
    .filter((element): element is HTMLElement => Boolean(element && article.contains(element)));

  if (targets.length === 0 || !('IntersectionObserver' in window)) return;

  let current = '';
  const setCurrent = (id: string): void => {
    if (id === current) return;
    current = id;
    for (const [linkId, link] of links) {
      if (linkId === id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };

  const visible = new Map<Element, boolean>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) visible.set(entry.target, entry.isIntersecting);

      const firstVisible = targets.find((target) => visible.get(target));
      if (firstVisible?.id) {
        setCurrent(firstVisible.id);
        return;
      }

      // Sem seção na faixa de leitura: usa a última seção já ultrapassada.
      const passed = targets.filter((target) => target.getBoundingClientRect().top < 140);
      const last = passed[passed.length - 1];
      if (last?.id) setCurrent(last.id);
    },
    {
      rootMargin: '-120px 0px -62% 0px',
      threshold: 0,
    },
  );

  for (const target of targets) observer.observe(target);
  signal.addEventListener('abort', () => observer.disconnect(), { once: true });
}
