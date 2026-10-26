import type { PageContext } from './context';
import type { PageRenderResult } from '../lib/router';
import { appUrl } from '../lib/router';
import { escapeAttr, escapeHtml, levelStyle, plural } from '../lib/utils';
import { setPageMeta } from '../lib/meta';
import { breadcrumbs } from '../ui/components';
import { icon } from '../ui/icons';

export function renderGuide(ctx: PageContext): PageRenderResult {
  const { data } = ctx;
  const totalCells = data.series.length * data.niveis.length;
  const filledCells = data.series.reduce(
    (total, series) => total + series.cells.filter((cell) => Boolean(cell.crime)).length,
    0,
  );

  setPageMeta({
    title: 'Guia rápido',
    description:
      'Matriz 12 × 6 das séries de crimes da Lei Espacial. Compare como cada conduta escala entre os níveis de gravidade.',
  });

  const levelHeaders = data.niveis
    .map(
      (level) => `<th scope="col" class="matrix-level" style="${levelStyle(level.cor)}">
        <a href="${appUrl(`/crimes?nivel=${encodeURIComponent(level.codigo)}`)}">
          <span class="matrix-level__code">${escapeHtml(level.codigo)}</span>
          <span class="matrix-level__name">${escapeHtml(level.nome)}</span>
        </a>
      </th>`,
    )
    .join('');

  const rows = data.series
    .map((series) => {
      const cells = series.cells
        .map((cell) => {
          if (!cell.crime) {
            return `<td class="matrix-cell matrix-cell--empty">
              <span class="matrix-empty" aria-label="Sem crime nesta lacuna">—</span>
            </td>`;
          }

          const crime = cell.crime;
          return `<td class="matrix-cell" style="${levelStyle(cell.nivel.cor)}">
            <a class="matrix-crime" href="${appUrl(`/crimes/${encodeURIComponent(crime.codigo)}`)}">
              <span class="matrix-crime__code">${escapeHtml(crime.codigo)}</span>
              <span class="matrix-crime__name">${escapeHtml(crime.nome)}</span>
            </a>
          </td>`;
        })
        .join('');

      return `<tr id="serie-${escapeAttr(series.serie.toLowerCase())}" class="matrix-row">
        <th scope="row" class="matrix-series">
          <span class="matrix-series__label">Série</span>
          <span class="matrix-series__code">${escapeHtml(series.serie)}</span>
          <a class="matrix-series__link" href="${appUrl('/crimes?agrupar=serie')}" aria-label="Abrir crimes da série ${escapeAttr(
            series.serie,
          )} agrupados">Abrir ${icon('arrow-up-right', { size: 13 })}</a>
        </th>
        ${cells}
      </tr>`;
    })
    .join('');

  const levelsLegend = data.niveis
    .map(
      (level) => `<a class="guide-level" style="${levelStyle(level.cor)}" href="${appUrl(
        `/crimes?nivel=${encodeURIComponent(level.codigo)}`,
      )}">
        <span class="guide-level__code">${escapeHtml(level.codigo)}</span>
        <span class="guide-level__text">
          <strong>${escapeHtml(level.nome)}</strong>
          <span>${escapeHtml(level.pena_minima)} → ${escapeHtml(level.pena_maxima)}</span>
        </span>
      </a>`,
    )
    .join('');

  const modifierList = (items: typeof data.agravantes, tone: 'agravante' | 'atenuante'): string =>
    items
      .map(
        (item) => `<a class="modifier-chip modifier-chip--${tone}" href="${appUrl(
          `/modificadores/${encodeURIComponent(item.codigo.toLowerCase())}`,
        )}">
          <span class="modifier-chip__code">${escapeHtml(item.codigo)}</span>
          <span>${escapeHtml(item.nome)}</span>
        </a>`,
      )
      .join('');

  ctx.pageRoot.innerHTML = `<div class="page guide-page">
    ${breadcrumbs([{ label: 'Início', href: '/' }, { label: 'Guia rápido' }])}

    <header class="page-header page-header--split">
      <div>
        <p class="eyebrow">Comparação entre níveis</p>
        <h1>Guia rápido</h1>
        <p class="page-header__lead">${escapeHtml(data.data.guia_rapido.descricao)}</p>
      </div>
      <div class="page-header__stamp">
        <span class="page-header__stamp-number">${data.series.length}<small>×</small>${data.niveis.length}</span>
        <span>séries<br />por níveis</span>
      </div>
    </header>

    <section class="guide-summary" aria-label="Resumo do guia">
      <div class="guide-stat">
        <span class="guide-stat__value">${filledCells}</span>
        <span class="guide-stat__label">crimes posicionados</span>
      </div>
      <div class="guide-stat">
        <span class="guide-stat__value">${totalCells - filledCells}</span>
        <span class="guide-stat__label">lacunas preservadas</span>
      </div>
      <div class="guide-stat">
        <span class="guide-stat__value">${data.niveis.length}</span>
        <span class="guide-stat__label">níveis de gravidade</span>
      </div>
      <p class="guide-summary__note">${icon('info', { size: 17 })} Números ausentes na fonte permanecem vazios. Nada foi inferido ou preenchido.</p>
    </section>

    <section class="matrix-section" aria-labelledby="matriz-title">
      <div class="section-heading section-heading--matrix">
        <div>
          <p class="eyebrow">Escala completa</p>
          <h2 id="matriz-title">Matriz de séries</h2>
        </div>
        <p class="matrix-hint">${icon('arrow-right', { size: 15 })} Deslize horizontalmente para ver todos os níveis</p>
      </div>

      <div class="matrix-shell">
        <div class="matrix-scroll" role="region" aria-labelledby="matriz-title" tabindex="0">
          <table class="matrix-table">
            <caption class="sr-only">Séries de crimes da Lei Espacial por nível de gravidade</caption>
            <thead>
              <tr>
                <th scope="col" class="matrix-corner"><span>Série</span></th>
                ${levelHeaders}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="guide-levels-section" aria-labelledby="escala-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Referência</p>
          <h2 id="escala-title">Escala de gravidade</h2>
        </div>
        <a class="text-link" href="${appUrl('/crimes')}">Abrir lista de crimes ${icon('arrow-up-right', { size: 15 })}</a>
      </div>
      <div class="guide-levels">${levelsLegend}</div>
    </section>

    <section class="guide-modifiers" aria-labelledby="modificadores-rapidos-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Sentença</p>
          <h2 id="modificadores-rapidos-title">Agravantes e atenuantes</h2>
        </div>
        <a class="text-link" href="${appUrl('/modificadores#calculadora')}">Abrir conferência de pena ${icon(
          'arrow-up-right',
          { size: 15 },
        )}</a>
      </div>
      <div class="guide-modifiers__grid">
        <div class="guide-modifiers__group guide-modifiers__group--agravante">
          <h3>${icon('alert-triangle', { size: 17 })} Agravantes <span>${data.agravantes.length}</span></h3>
          <div class="modifier-chips">${modifierList(data.agravantes, 'agravante')}</div>
        </div>
        <div class="guide-modifiers__group guide-modifiers__group--atenuante">
          <h3>${icon('shield', { size: 17 })} Atenuantes <span>${data.atenuantes.length}</span></h3>
          <div class="modifier-chips">${modifierList(data.atenuantes, 'atenuante')}</div>
        </div>
      </div>
      <p class="guide-modifiers__note">${icon('info', { size: 16 })} Cada modificador tem uma página com descrição e efeito exato na pena. ${
        data.modificadores.length
      } ${plural(data.modificadores.length, 'regra cadastrada', 'regras cadastradas')}.</p>
    </section>

    <nav class="guide-next" aria-label="Próximos passos">
      <a class="guide-next__card" href="${appUrl('/crimes?agrupar=serie')}">
        <span class="guide-next__icon">${icon('layers', { size: 22 })}</span>
        <span><strong>Ver por série</strong><small>Lista de crimes agrupada pelas mesmas séries da matriz</small></span>
        ${icon('arrow-right', { size: 17 })}
      </a>
      <a class="guide-next__card" href="${appUrl('/modificadores')}">
        <span class="guide-next__icon">${icon('sliders', { size: 22 })}</span>
        <span><strong>Calcular modificadores</strong><small>Compare o efeito de cada agravante e atenuante</small></span>
        ${icon('arrow-right', { size: 17 })}
      </a>
    </nav>
  </div>`;

  return {};
}
