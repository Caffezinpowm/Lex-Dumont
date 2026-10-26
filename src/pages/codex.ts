import type { PageContext } from './context';
import type { Verbete } from '../types';
import type { PageRenderResult } from '../lib/router';
import { appUrl } from '../lib/router';
import { escapeAttr, escapeHtml, normalizeText, plural, slugify } from '../lib/utils';
import { setPageMeta } from '../lib/meta';
import { breadcrumbs } from '../ui/components';
import { icon } from '../ui/icons';

interface ChapterGroup {
  chapter: string;
  label: string;
  id: string;
  items: Verbete[];
}

const ROMAN_VALUES: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

/** Lê o numeral romano no início do capítulo ("IV - DOS CRIMES..."). */
function romanChapterValue(chapter: string): number | null {
  const match = /^([IVXLCDM]+)\b/i.exec(chapter.trim());
  if (!match?.[1]) return null;

  let total = 0;
  let previous = 0;
  for (const character of [...match[1].toUpperCase()].reverse()) {
    const value = ROMAN_VALUES[character] ?? 0;
    if (value < previous) total -= value;
    else {
      total += value;
      previous = value;
    }
  }
  return total;
}

/**
 * Ordena os capítulos por numeral romano. Seções sem numeração reconhecida
 * mantêm a ordem da fonte e ficam depois dos capítulos I–VIII.
 */
function compareChapters(a: ChapterGroup, b: ChapterGroup): number {
  const aRoman = romanChapterValue(a.chapter);
  const bRoman = romanChapterValue(b.chapter);
  if (aRoman !== null && bRoman !== null) return aRoman - bRoman;
  if (aRoman !== null) return -1;
  if (bRoman !== null) return 1;

  const aEmpty = !a.chapter.trim();
  const bEmpty = !b.chapter.trim();
  if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;
  return 0;
}

export function renderCodexIndex(ctx: PageContext): PageRenderResult {
  const { data } = ctx;

  setPageMeta({
    title: 'Código Espacial',
    description:
      'Índice completo do Código Espacial: artigos, disposições gerais, crimes administrativos e princípios de aplicação da lei.',
  });

  const groupsByChapter = new Map<string, ChapterGroup>();
  let chapterIndex = 0;

  for (const verbete of data.verbetes) {
    const chapter = verbete.capitulo.trim();
    let group = groupsByChapter.get(chapter);

    if (!group) {
      chapterIndex += 1;
      const label = chapter || 'Sem capítulo indicado';
      group = {
        chapter,
        label,
        id: `capitulo-${slugify(chapter) || 'sem-capitulo'}-${chapterIndex}`,
        items: [],
      };
      groupsByChapter.set(chapter, group);
    }

    group.items.push(verbete);
  }

  const groups = [...groupsByChapter.values()].sort(compareChapters);

  const chapterMap = groups
    .map(
      (group) => `<a class="chapter-chip" href="#${escapeAttr(group.id)}">
        <span>${escapeHtml(group.label)}</span>
        <strong>${group.items.length}</strong>
      </a>`,
    )
    .join('');

  const sections = groups
    .map(
      (group) => `<section class="codex-group" id="${escapeAttr(group.id)}" data-codex-group aria-labelledby="${escapeAttr(
        `${group.id}-title`,
      )}">
        <div class="codex-group__head">
          <div>
            <p class="eyebrow">Capítulo</p>
            <h2 id="${escapeAttr(`${group.id}-title`)}">${escapeHtml(group.label)}</h2>
          </div>
          <span class="codex-group__count">${group.items.length} ${plural(
            group.items.length,
            'verbete',
            'verbetes',
          )}</span>
        </div>
        <div class="codex-grid">
          ${group.items
            .map((verbete, index) => {
              const articles = verbete.artigos.length
                ? verbete.artigos.map((article) => `Art. ${article}`).join(' · ')
                : 'Sem artigo numerado';
              const filterText = normalizeText(
                `${verbete.titulo} ${verbete.capitulo} ${articles} ${verbete.markdown.slice(0, 600)}`,
              );

              return `<a class="codex-card" href="${appUrl(`/codigo/${encodeURIComponent(verbete.id)}`)}" data-codex-card data-filter-text="${escapeAttr(
                filterText,
              )}">
                <span class="codex-card__index">${String(index + 1).padStart(2, '0')}</span>
                <span class="codex-card__body">
                  <span class="codex-card__meta">${escapeHtml(articles)}</span>
                  <strong>${escapeHtml(verbete.titulo)}</strong>
                  <span class="codex-card__action">Ler verbete ${icon('arrow-right', { size: 14 })}</span>
                </span>
              </a>`;
            })
            .join('')}
        </div>
      </section>`,
    )
    .join('');

  ctx.pageRoot.innerHTML = `<div class="page codex-index-page">
    ${breadcrumbs([{ label: 'Início', href: '/' }, { label: 'Código Espacial' }])}

    <header class="page-header page-header--split">
      <div>
        <p class="eyebrow">Leitura de referência</p>
        <h1>Código Espacial</h1>
        <p class="page-header__lead">Artigos, disposições gerais e princípios que fundamentam a Lei Espacial. Leia o texto integral, com sumário e vínculos para os crimes correspondentes.</p>
      </div>
      <div class="page-header__stamp">
        <span class="page-header__stamp-number">${data.verbetes.length}</span>
        <span>verbetes<br />em ${groups.length} capítulos</span>
      </div>
    </header>

    <div class="library-toolbar">
      <label class="input-with-icon library-search" for="filtro-codigo">
        <span class="input-with-icon__icon" aria-hidden="true">${icon('search', { size: 18 })}</span>
        <input id="filtro-codigo" type="search" placeholder="Filtrar por verbete, artigo ou capítulo…" autocomplete="off" />
        <button class="input-clear" type="button" data-codex-clear aria-label="Limpar filtro do código" hidden>${icon(
          'close',
          { size: 16 },
        )}</button>
      </label>
      <p class="library-count" data-codex-status aria-live="polite">${data.verbetes.length} ${plural(
        data.verbetes.length,
        'verbete exibido',
        'verbetes exibidos',
      )}.</p>
    </div>

    <nav class="chapter-map" aria-label="Capítulos do Código Espacial">
      ${chapterMap}
    </nav>

    <div class="codex-groups" data-codex-groups>
      ${sections}
    </div>

    <div class="library-footer">
      <p>${icon('info', { size: 15 })} O Código Espacial é exibido como está na fonte. A ausência de um artigo na fonte não foi preenchida.</p>
      <a class="text-link" href="${appUrl('/documentos')}">Ver documentos e procedimentos ${icon(
        'arrow-right',
        { size: 15 },
      )}</a>
    </div>
  </div>`;

  const controller = new AbortController();
  const filterInput = ctx.pageRoot.querySelector<HTMLInputElement>('#filtro-codigo');
  const clearButton = ctx.pageRoot.querySelector<HTMLButtonElement>('[data-codex-clear]');
  const status = ctx.pageRoot.querySelector<HTMLElement>('[data-codex-status]');
  const cards = Array.from(ctx.pageRoot.querySelectorAll<HTMLElement>('[data-codex-card]'));
  const groupElements = Array.from(ctx.pageRoot.querySelectorAll<HTMLElement>('[data-codex-group]'));

  const applyFilter = (): void => {
    if (!filterInput || !status) return;
    const query = normalizeText(filterInput.value);
    let visible = 0;

    for (const card of cards) {
      const show = !query || (card.dataset.filterText ?? '').includes(query);
      card.hidden = !show;
      if (show) visible += 1;
    }

    for (const group of groupElements) {
      group.hidden = !Array.from(group.querySelectorAll<HTMLElement>('[data-codex-card]')).some(
        (card) => !card.hidden,
      );
    }

    if (clearButton) clearButton.hidden = !filterInput.value;
    status.textContent = query
      ? `${visible} de ${cards.length} verbetes para “${filterInput.value.trim()}”.`
      : `${cards.length} verbetes exibidos.`;
  };

  filterInput?.addEventListener('input', applyFilter, { signal: controller.signal });
  clearButton?.addEventListener(
    'click',
    () => {
      if (!filterInput) return;
      filterInput.value = '';
      applyFilter();
      filterInput.focus();
    },
    { signal: controller.signal },
  );

  applyFilter();

  return {
    cleanup: () => controller.abort(),
  };
}
