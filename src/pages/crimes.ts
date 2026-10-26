import type { IndexedCrime, Nivel } from '../types';
import type { PageContext } from './context';
import type { PageRenderResult } from '../lib/router';
import { appUrl } from '../lib/router';
import { normalizeText, escapeAttr, escapeHtml, levelStyle, plural } from '../lib/utils';
import { setPageMeta } from '../lib/meta';
import { breadcrumbs, crimeCard, emptyState, levelBadge } from '../ui/components';
import { icon } from '../ui/icons';

type GroupMode = 'nivel' | 'serie';
type ViewMode = 'cartoes' | 'compacta';

interface ViewState {
  selectedLevels: Set<string>;
  query: string;
  group: GroupMode;
  view: ViewMode;
}

interface CrimeGroup {
  key: string;
  title: string;
  code: string;
  description?: string;
  penalty?: string;
  seriesCode?: string;
  crimes: IndexedCrime[];
  level?: Nivel;
}

function readSelectedLevels(ctx: PageContext): Set<string> {
  const all = new Set(ctx.data.niveis.map((nivel) => nivel.codigo));
  const raw = ctx.route.query
    .getAll('nivel')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter((value) => all.has(value));

  if (raw.length === 0) return all;
  return new Set(raw);
}

function readGroup(value: string | null): GroupMode {
  return value === 'serie' ? 'serie' : 'nivel';
}

function readView(value: string | null): ViewMode {
  return value === 'compacta' ? 'compacta' : 'cartoes';
}

function matchesSearch(crime: IndexedCrime, query: string): boolean {
  if (!query) return true;
  const haystack = normalizeText(
    [
      crime.codigo,
      crime.nome,
      crime.descricao,
      crime.ooc,
      ...crime.detalhes,
      crime.nivel.codigo,
      crime.nivel.nome,
    ].join(' '),
  );
  return haystack.includes(normalizeText(query));
}

function groupCrimes(data: PageContext['data'], state: ViewState, filtered: IndexedCrime[]): CrimeGroup[] {
  if (state.group === 'nivel') {
    return data.niveis
      .filter((nivel) => state.selectedLevels.has(nivel.codigo))
      .map((nivel) => ({
        key: `nivel-${nivel.codigo}`,
        title: nivel.nome,
        code: nivel.codigo,
        description: nivel.descricao,
        penalty: `${nivel.pena_minima} — ${nivel.pena_maxima}`,
        level: nivel,
        crimes: filtered.filter((crime) => crime.nivel.codigo === nivel.codigo),
      }))
      .filter((group) => group.crimes.length > 0);
  }

  const filteredCodes = new Set(filtered.map((crime) => crime.codigo));
  const groups: CrimeGroup[] = [];
  const groupedCodes = new Set<string>();

  for (const series of data.series) {
    const crimes = series.cells
      .map((cell) => cell.crime)
      .filter((crime): crime is IndexedCrime => Boolean(crime && filteredCodes.has(crime.codigo)));

    if (crimes.length === 0) continue;
    for (const crime of crimes) groupedCodes.add(crime.codigo);
    groups.push({
      key: `serie-${series.serie}`,
      title: series.serie,
      code: 'Série',
      seriesCode: series.serie,
      crimes,
    });
  }

  const ungrouped = filtered.filter((crime) => !groupedCodes.has(crime.codigo));
  if (ungrouped.length > 0) {
    groups.push({
      key: 'fora-das-series',
      title: 'Fora das séries',
      code: 'Outros',
      crimes: ungrouped,
    });
  }

  return groups;
}

function tableHtml(crimes: IndexedCrime[], caption: string): string {
  const rows = crimes
    .map(
      (crime) => `<tr>
        <td class="compact-table__code"><a href="${appUrl(`/crimes/${encodeURIComponent(crime.codigo)}`)}">${escapeHtml(
          crime.codigo,
        )}</a></td>
        <td class="compact-table__crime">
          <a class="compact-table__title" href="${appUrl(`/crimes/${encodeURIComponent(crime.codigo)}`)}">${escapeHtml(
            crime.nome,
          )}</a>
        </td>
        <td class="compact-table__level">${levelBadge(crime.nivel)}</td>
        <td class="compact-table__penalty">
          <span>${escapeHtml(crime.nivel.pena_minima)}</span>
          <span class="compact-table__penalty-divider" aria-hidden="true">→</span>
          <span>${escapeHtml(crime.nivel.pena_maxima)}</span>
        </td>
        <td class="compact-table__action">
          <a href="${appUrl(`/crimes/${encodeURIComponent(crime.codigo)}`)}" aria-label="Abrir ${escapeAttr(
            `${crime.codigo} — ${crime.nome}`,
          )}">${icon('chevron-right', { size: 17 })}</a>
        </td>
      </tr>`,
    )
    .join('');

  return `<div class="table-scroll" role="region" aria-label="${escapeAttr(caption)}" tabindex="0">
    <table class="compact-table">
      <caption class="sr-only">${escapeHtml(caption)}</caption>
      <thead>
        <tr>
          <th scope="col">Código</th>
          <th scope="col">Crime</th>
          <th scope="col">Nível</th>
          <th scope="col">Pena (mín. → máx.)</th>
          <th scope="col"><span class="sr-only">Abrir</span></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function groupHtml(group: CrimeGroup, view: ViewMode): string {
  const headingId = `grupo-${group.key}`;
  const heading = `<div class="group-heading${group.seriesCode ? ' group-heading--series' : ''}${
    view === 'compacta' ? ' group-heading--compact' : ''
  }"${group.level ? ` style="${levelStyle(group.level.cor)}"` : ''}>
    <div class="group-heading__identity">
      <span class="group-heading__code">${escapeHtml(group.code)}</span>
      <div>
        <h2 id="${escapeAttr(headingId)}">${escapeHtml(group.title)}</h2>
        ${group.description ? `<p>${escapeHtml(group.description)}</p>` : ''}
      </div>
    </div>
    <div class="group-heading__meta">
      <span>${group.crimes.length} ${plural(group.crimes.length, 'crime', 'crimes')}</span>
      ${
        group.seriesCode
          ? `<a class="text-link" href="${appUrl(`/guia-rapido#serie-${group.seriesCode.toLowerCase()}`)}">Ver na matriz ${icon(
              'arrow-up-right',
              { size: 14 },
            )}</a>`
          : `<span class="group-heading__penalty">${escapeHtml(group.penalty ?? '')}</span>`
      }
    </div>
  </div>`;

  return `<section class="crime-group${view === 'compacta' ? ' crime-group--table' : ''}" aria-labelledby="${escapeAttr(
    headingId,
  )}">
    ${heading}
    ${
      view === 'cartoes'
        ? `<div class="crime-grid">${group.crimes.map((crime) => crimeCard(crime)).join('')}</div>`
        : tableHtml(group.crimes, `${group.title}: crimes e penas`)
    }
  </section>`;
}

export function renderCrimes(ctx: PageContext): PageRenderResult {
  const { data } = ctx;

  setPageMeta({
    title: 'Crimes',
    description:
      'Lista completa de crimes da Lei Espacial com filtros por nível, busca por texto e visualização em cartões ou tabela.',
  });

  const initialQuery = ctx.route.query.get('q') ?? '';
  const state: ViewState = {
    selectedLevels: readSelectedLevels(ctx),
    query: initialQuery,
    group: readGroup(ctx.route.query.get('agrupar')),
    view: readView(ctx.route.query.get('visao')),
  };

  const levelFilters = data.niveis
    .map(
      (nivel) => `<label class="level-filter${state.selectedLevels.has(nivel.codigo) ? ' is-active' : ''}" style="${levelStyle(
        nivel.cor,
      )}">
        <input type="checkbox" name="nivel" value="${escapeAttr(nivel.codigo)}" ${
          state.selectedLevels.has(nivel.codigo) ? 'checked' : ''
        } />
        <span class="level-filter__dot" aria-hidden="true"></span>
        <span class="level-filter__text">
          <span class="level-filter__code">${escapeHtml(nivel.codigo)}</span>
          <span class="level-filter__name">${escapeHtml(nivel.nome)}</span>
        </span>
        <span class="level-filter__count">${nivel.crimes.length}</span>
      </label>`,
    )
    .join('');

  ctx.pageRoot.innerHTML = `<div class="page crime-list-page">
    ${breadcrumbs([{ label: 'Início', href: '/' }, { label: 'Crimes' }])}
    <header class="page-header page-header--split">
      <div>
        <p class="eyebrow">Base legal completa</p>
        <h1>Crimes</h1>
        <p class="page-header__lead">Todas as condutas tipificadas, com nível, penalidade e filtros rápidos. Nada de rolar o guidebook no meio do turno.</p>
      </div>
      <div class="page-header__stamp">
        <span class="page-header__stamp-number">${data.crimes.length}</span>
        <span>crimes<br />em ${data.niveis.length} níveis</span>
      </div>
    </header>

    <section class="filter-panel" aria-label="Filtros de crimes">
      <div class="filter-panel__search">
        <label class="input-with-icon" for="filtro-crimes">
          <span class="input-with-icon__icon" aria-hidden="true">${icon('search', { size: 18 })}</span>
          <input id="filtro-crimes" type="search" placeholder="Filtrar por nome, código ou texto…" value="${escapeAttr(
            state.query,
          )}" autocomplete="off" />
          <button class="input-clear" type="button" data-clear-query aria-label="Limpar filtro de texto" ${
            state.query ? '' : 'hidden'
          }>${icon('close', { size: 16 })}</button>
        </label>
        <button class="btn btn--ghost btn--small filter-clear-all" type="button" data-clear-filters>
          ${icon('trash', { size: 16 })} Limpar filtros
        </button>
      </div>

      <fieldset class="level-filter-group">
        <legend><span>Nível de gravidade</span><span class="level-filter-group__hint">seleção múltipla</span></legend>
        <button class="level-filter-all${state.selectedLevels.size === data.niveis.length ? ' is-active' : ''}" type="button" data-select-all aria-pressed="${
          state.selectedLevels.size === data.niveis.length
        }">Todos</button>
        ${levelFilters}
      </fieldset>

      <div class="filter-panel__toolbar">
        <div class="segmented" role="group" aria-label="Agrupar resultados">
          <span class="segmented__label">Agrupar</span>
          <button type="button" data-group="nivel" aria-pressed="${state.group === 'nivel'}" class="${
            state.group === 'nivel' ? 'is-active' : ''
          }">${icon('layers', { size: 15 })} Nível</button>
          <button type="button" data-group="serie" aria-pressed="${state.group === 'serie'}" class="${
            state.group === 'serie' ? 'is-active' : ''
          }">${icon('list', { size: 15 })} Série</button>
        </div>

        <div class="segmented segmented--view" role="group" aria-label="Modo de visualização">
          <span class="segmented__label">Visualizar</span>
          <button type="button" data-view="cartoes" aria-pressed="${state.view === 'cartoes'}" class="${
            state.view === 'cartoes' ? 'is-active' : ''
          }">${icon('grid', { size: 15 })} Cartões</button>
          <button type="button" data-view="compacta" aria-pressed="${state.view === 'compacta'}" class="${
            state.view === 'compacta' ? 'is-active' : ''
          }">${icon('list', { size: 15 })} Tabela</button>
        </div>

        <button class="btn btn--quiet btn--small print-button" type="button" data-print>
          ${icon('file-text', { size: 16 })} Imprimir
        </button>
      </div>
    </section>

    <div class="results-bar">
      <p class="results-bar__count" id="result-count" aria-live="polite"></p>
      <span class="results-bar__hint">Consulte os modificadores aplicáveis antes de sentenciar.</span>
    </div>

    <div id="crime-results"></div>
  </div>`;

  const results = ctx.pageRoot.querySelector<HTMLElement>('#crime-results');
  const resultCount = ctx.pageRoot.querySelector<HTMLElement>('#result-count');
  const queryInput = ctx.pageRoot.querySelector<HTMLInputElement>('#filtro-crimes');
  const clearQuery = ctx.pageRoot.querySelector<HTMLButtonElement>('[data-clear-query]');
  const selectAll = ctx.pageRoot.querySelector<HTMLButtonElement>('[data-select-all]');

  if (!results || !resultCount || !queryInput || !clearQuery || !selectAll) {
    throw new Error('Não foi possível inicializar os filtros de crimes.');
  }

  const controller = new AbortController();

  const updateLevelLabels = (): void => {
    ctx.pageRoot.querySelectorAll<HTMLLabelElement>('.level-filter').forEach((label) => {
      const input = label.querySelector<HTMLInputElement>('input[name="nivel"]');
      if (!input) return;
      label.classList.toggle('is-active', input.checked);
    });
    const allSelected = state.selectedLevels.size === data.niveis.length;
    selectAll.classList.toggle('is-active', allSelected);
    selectAll.setAttribute('aria-pressed', String(allSelected));
  };

  const syncUrl = (): void => {
    const allSelected = state.selectedLevels.size === data.niveis.length;
    ctx.router.replaceQuery({
      nivel: allSelected ? null : [...state.selectedLevels].join(','),
      q: state.query || null,
      agrupar: state.group === 'nivel' ? null : 'serie',
      visao: state.view === 'cartoes' ? null : 'compacta',
    });
  };

  const draw = (): void => {
    const filtered = data.crimes.filter(
      (crime) => state.selectedLevels.has(crime.nivel.codigo) && matchesSearch(crime, state.query),
    );
    const groups = groupCrimes(data, state, filtered);

    resultCount.textContent = `${filtered.length} de ${data.crimes.length} ${plural(
      data.crimes.length,
      'crime',
      'crimes',
    )}${state.query ? ` para “${state.query}”` : ''}.`;
    clearQuery.hidden = !state.query;

    if (filtered.length === 0) {
      results.innerHTML = emptyState({
        title: 'Nenhum crime encontrado',
        description:
          'Tente outro termo, remova a busca por texto ou selecione mais níveis de gravidade.',
        iconName: 'search',
        action: `<button class="btn btn--primary btn--small" type="button" data-clear-filters>Limpar filtros</button>`,
      });
      return;
    }

    results.innerHTML = groups.map((group) => groupHtml(group, state.view)).join('');

    if (state.query) {
      const mark = document.createElement('mark');
      mark.className = 'sr-only';
      mark.textContent = 'Resultados filtrados.';
      resultCount.append(mark);
    }
  };

  const applyFilterValues = (): void => {
    state.selectedLevels = new Set(
      Array.from(ctx.pageRoot.querySelectorAll<HTMLInputElement>('input[name="nivel"]:checked')).map(
        (input) => input.value,
      ),
    );
    updateLevelLabels();
    syncUrl();
    draw();
  };

  ctx.pageRoot.addEventListener(
    'input',
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.id !== 'filtro-crimes') return;
      state.query = target.value;
      clearQuery.hidden = !state.query;
      syncUrl();
      draw();
    },
    { signal: controller.signal },
  );

  ctx.pageRoot.addEventListener(
    'change',
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.name !== 'nivel') return;
      applyFilterValues();
    },
    { signal: controller.signal },
  );

  ctx.pageRoot.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (target.closest('[data-clear-query]')) {
        queryInput.value = '';
        state.query = '';
        clearQuery.hidden = true;
        syncUrl();
        draw();
        queryInput.focus();
        return;
      }

      if (target.closest('[data-clear-filters]')) {
        state.query = '';
        state.selectedLevels = new Set(data.niveis.map((nivel) => nivel.codigo));
        state.group = 'nivel';
        state.view = 'cartoes';
        queryInput.value = '';
        clearQuery.hidden = true;
        ctx.pageRoot.querySelectorAll<HTMLInputElement>('input[name="nivel"]').forEach((input) => {
          input.checked = true;
        });
        ctx.pageRoot.querySelectorAll<HTMLButtonElement>('[data-group]').forEach((button) => {
          const active = button.dataset.group === 'nivel';
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', String(active));
        });
        ctx.pageRoot.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
          const active = button.dataset.view === 'cartoes';
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', String(active));
        });
        updateLevelLabels();
        syncUrl();
        draw();
        return;
      }

      if (target.closest('[data-select-all]')) {
        state.selectedLevels = new Set(data.niveis.map((nivel) => nivel.codigo));
        ctx.pageRoot.querySelectorAll<HTMLInputElement>('input[name="nivel"]').forEach((input) => {
          input.checked = true;
        });
        applyFilterValues();
        return;
      }

      const groupButton = target.closest<HTMLButtonElement>('[data-group]');
      if (groupButton) {
        const next = groupButton.dataset.group === 'serie' ? 'serie' : 'nivel';
        if (state.group === next) return;
        state.group = next;
        ctx.pageRoot.querySelectorAll<HTMLButtonElement>('[data-group]').forEach((button) => {
          const active = button.dataset.group === next;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', String(active));
        });
        syncUrl();
        draw();
        return;
      }

      const viewButton = target.closest<HTMLButtonElement>('[data-view]');
      if (viewButton) {
        const next = viewButton.dataset.view === 'compacta' ? 'compacta' : 'cartoes';
        if (state.view === next) return;
        state.view = next;
        ctx.pageRoot.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
          const active = button.dataset.view === next;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', String(active));
        });
        syncUrl();
        draw();
        return;
      }

      if (target.closest('[data-print]')) {
        window.print();
      }
    },
    { signal: controller.signal },
  );

  updateLevelLabels();
  draw();

  return {
    cleanup: () => controller.abort(),
  };
}
