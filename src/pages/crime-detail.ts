import type { PageContext } from './context';
import type { PageRenderResult } from '../lib/router';
import { appUrl } from '../lib/router';
import { escapeHtml, levelStyle, textToParagraphs, truncate } from '../lib/utils';
import { setPageMeta } from '../lib/meta';
import {
  breadcrumbs,
  copyButton,
  favoriteButton,
  levelBadge,
  penaltySummary,
  prevNextNav,
} from '../ui/components';
import { icon } from '../ui/icons';
import { renderNotFound } from './not-found';

export function renderCrimeDetail(ctx: PageContext): PageRenderResult {
  const requestedCode = (ctx.route.params.codigo ?? '').toUpperCase();
  const crime = ctx.data.getCrime(requestedCode);

  if (!crime) {
    return renderNotFound(ctx, {
      title: 'Crime não encontrado',
      description: `Não há crime cadastrado com o código “${requestedCode || 'vazio'}”. Confira o código ou use a busca global.`,
      code: '404',
    });
  }

  const level = crime.nivel;
  const neighbors = ctx.data.getCrimeNeighbors(crime.codigo);
  const series = ctx.data.getSeriesForCrime(crime.codigo);
  const relatedVerbete = ctx.data.getRelatedVerbeteForCrime(crime.codigo);
  const shareUrl = `${window.location.origin}${window.location.pathname}`;
  const penaltyText = `${crime.codigo} · ${crime.nome} — pena de ${level.pena_minima} a ${level.pena_maxima}.`;

  setPageMeta({
    title: `${crime.codigo} · ${crime.nome}`,
    description: truncate(crime.descricao, 170),
  });

  const details =
    crime.detalhes.length > 0
      ? `<section class="content-card" aria-labelledby="detalhes-title">
          <div class="content-card__heading">
            <span class="section-index" aria-hidden="true">02</span>
            <div>
              <p class="eyebrow">Aplicação</p>
              <h2 id="detalhes-title">Detalhes de aplicação</h2>
            </div>
          </div>
          <ul class="legal-list">
            ${crime.detalhes.map((detail) => `<li>${escapeHtml(detail)}</li>`).join('')}
          </ul>
        </section>`
      : '';

  const ooc = crime.ooc
    ? `<aside class="ooc-callout" aria-labelledby="ooc-title">
        <span class="ooc-callout__icon" aria-hidden="true">${icon('info', { size: 19 })}</span>
        <div>
          <p class="ooc-callout__label" id="ooc-title">OOC · Fora do personagem</p>
          <p>${escapeHtml(crime.ooc)}</p>
        </div>
      </aside>`
    : '';

  const seriesCells = series
    ? series.cells
        .map((cell) => {
          if (!cell.crime) {
            return `<div class="series-step series-step--empty" style="${levelStyle(cell.nivel.cor)}">
              <span class="series-step__level">${escapeHtml(cell.nivel.codigo)}</span>
              <span class="series-step__name">Sem equivalente</span>
            </div>`;
          }

          const current = cell.crime.codigo === crime.codigo;
          return `<a class="series-step${current ? ' is-current' : ''}" style="${levelStyle(cell.nivel.cor)}" href="${appUrl(
            `/crimes/${encodeURIComponent(cell.crime.codigo)}`,
          )}" ${current ? 'aria-current="page"' : ''}>
            <span class="series-step__level">${escapeHtml(cell.nivel.codigo)}</span>
            <span class="series-step__name">${escapeHtml(cell.crime.nome)}</span>
            <span class="series-step__code">${escapeHtml(cell.crime.codigo)}</span>
          </a>`;
        })
        .join('')
    : '';

  const seriesSection = series
    ? `<section class="content-card" aria-labelledby="serie-title">
        <div class="content-card__heading">
          <span class="section-index" aria-hidden="true">03</span>
          <div>
            <p class="eyebrow">Escala de gravidade</p>
            <h2 id="serie-title">Série ${escapeHtml(series.serie)}</h2>
          </div>
          <a class="text-link content-card__action" href="${appUrl(
            `/guia-rapido#serie-${series.serie.toLowerCase()}`,
          )}">Ver na matriz ${icon('arrow-up-right', { size: 14 })}</a>
        </div>
        <p class="content-card__lead">O mesmo tipo de conduta em níveis crescentes. Células vazias são lacunas da fonte oficial.</p>
        <div class="series-ladder">${seriesCells}</div>
      </section>`
    : '';

  const relatedSection = relatedVerbete
    ? `<section class="content-card content-card--related" aria-labelledby="codigo-relacionado-title">
        <div class="content-card__heading">
          <span class="section-index" aria-hidden="true">04</span>
          <div>
            <p class="eyebrow">Fundamento</p>
            <h2 id="codigo-relacionado-title">No Código Espacial</h2>
          </div>
        </div>
        <a class="related-codex" href="${appUrl(`/codigo/${encodeURIComponent(relatedVerbete.id)}`)}">
          <span class="related-codex__icon" aria-hidden="true">${icon('book-open', { size: 22 })}</span>
          <span class="related-codex__body">
            <span class="related-codex__chapter">${escapeHtml(relatedVerbete.capitulo || 'Código Espacial')}</span>
            <strong>${escapeHtml(relatedVerbete.titulo)}</strong>
            ${
              relatedVerbete.artigos.length
                ? `<span class="related-codex__meta">${relatedVerbete.artigos
                    .map((article) => `Art. ${escapeHtml(article)}`)
                    .join(' · ')}</span>`
                : `<span class="related-codex__meta">Verbete relacionado</span>`
            }
          </span>
          ${icon('arrow-right', { size: 18, className: 'related-codex__arrow' })}
        </a>
      </section>`
    : '';

  ctx.pageRoot.innerHTML = `<div class="page detail-page crime-detail-page" style="${levelStyle(level.cor)}">
    ${breadcrumbs([
      { label: 'Início', href: '/' },
      { label: 'Crimes', href: '/crimes' },
      { label: `${crime.codigo} · ${crime.nome}` },
    ])}

    <header class="detail-hero">
      <span class="detail-hero__accent" aria-hidden="true"></span>
      <div class="detail-hero__copy">
        <div class="detail-hero__meta">
          <span class="mono-code mono-code--large">${escapeHtml(crime.codigo)}</span>
          ${levelBadge(level)}
          ${series ? `<span class="detail-hero__series">Série ${escapeHtml(series.serie)}</span>` : ''}
        </div>
        <h1>${escapeHtml(crime.nome)}</h1>
        <p class="detail-hero__lead">${escapeHtml(crime.descricao)}</p>
        <div class="detail-actions">
          ${favoriteButton(crime, { withLabel: true })}
          ${copyButton({
            text: crime.codigo,
            label: 'Copiar código',
            ariaLabel: `Copiar código ${crime.codigo}`,
            successMessage: `Código ${crime.codigo} copiado.`,
          })}
          ${copyButton({
            text: shareUrl,
            label: 'Copiar link',
            ariaLabel: 'Copiar link desta página',
            successMessage: 'Link copiado.',
            iconName: 'link',
          })}
          <button class="btn btn--quiet btn--small" type="button" data-print>
            ${icon('file-text', { size: 16 })} Imprimir
          </button>
        </div>
      </div>

      <aside class="sentence-ticket" aria-label="Pena do crime">
        <div class="sentence-ticket__head">
          <span class="sentence-ticket__label">Pena aplicável</span>
          <span class="sentence-ticket__level">${escapeHtml(level.codigo)}</span>
        </div>
        ${penaltySummary(level)}
        <div class="sentence-ticket__meta">
          <span>${escapeHtml(level.nome)}</span>
          <span>${escapeHtml(ctx.data.data.unidade_pena)}</span>
        </div>
        <p class="sentence-ticket__note">A pena-base é definida pelo nível. Modificadores podem alterá-la.</p>
        <a class="sentence-ticket__link" href="${appUrl(
          `/crimes?nivel=${encodeURIComponent(level.codigo)}`,
        )}">Ver nível ${escapeHtml(level.codigo)} ${icon('arrow-right', { size: 15 })}</a>
      </aside>
    </header>

    <div class="detail-grid">
      <article class="detail-main">
        <section class="content-card" aria-labelledby="conduta-title">
          <div class="content-card__heading">
            <span class="section-index" aria-hidden="true">01</span>
            <div>
              <p class="eyebrow">Tipificação</p>
              <h2 id="conduta-title">Conduta descrita</h2>
            </div>
          </div>
          <div class="prose prose--compact">
            ${textToParagraphs(crime.descricao)}
          </div>
        </section>

        ${details}
        ${ooc}
        ${seriesSection}
        ${relatedSection}
      </article>

      <aside class="detail-side" aria-label="Informações complementares">
        <section class="side-card" aria-labelledby="nivel-info-title">
          <div class="side-card__head">
            ${levelBadge(level)}
            <span class="side-card__tag">${level.crimes.length} crimes</span>
          </div>
          <h2 id="nivel-info-title">${escapeHtml(level.titulo)}</h2>
          <p>${escapeHtml(level.descricao)}</p>
          ${penaltySummary(level)}
          ${
            level.observacoes_nivel.length
              ? `<ul class="legal-list legal-list--small">${level.observacoes_nivel
                  .map((observation) => `<li>${escapeHtml(observation)}</li>`)
                  .join('')}</ul>`
              : ''
          }
          <a class="side-card__link" href="${appUrl(
            `/crimes?nivel=${encodeURIComponent(level.codigo)}`,
          )}">Explorar todos os crimes ${icon('arrow-right', { size: 15 })}</a>
        </section>

        <section class="side-card side-card--tools" aria-labelledby="ferramentas-title">
          <h2 id="ferramentas-title">Ferramentas</h2>
          <p>Leve o texto para o jogo ou compartilhe a consulta.</p>
          <div class="side-card__stack">
            ${copyButton({
              text: penaltyText,
              label: 'Copiar resumo da pena',
              small: true,
              successMessage: 'Resumo da pena copiado.',
            })}
            ${copyButton({
              text: crime.codigo,
              label: 'Copiar código',
              small: true,
              successMessage: `Código ${crime.codigo} copiado.`,
            })}
            ${copyButton({
              text: shareUrl,
              label: 'Copiar link',
              small: true,
              successMessage: 'Link copiado.',
              iconName: 'link',
            })}
          </div>
        </section>

        <section class="side-card side-card--note" aria-labelledby="lembrete-title">
          <h2 id="lembrete-title">Antes de sentenciar</h2>
          <p>Confira os agravantes e atenuantes aplicáveis. O registro abaixo não substitui o julgamento.</p>
          <a class="side-card__link" href="${appUrl('/modificadores#agravantes')}">Ver agravantes ${icon(
            'arrow-up-right',
            { size: 14 },
          )}</a>
          <a class="side-card__link" href="${appUrl('/modificadores#atenuantes')}">Ver atenuantes ${icon(
            'arrow-up-right',
            { size: 14 },
          )}</a>
        </section>
      </aside>
    </div>

    ${prevNextNav(
      neighbors.previous
        ? {
            label: neighbors.previous.nome,
            href: `/crimes/${encodeURIComponent(neighbors.previous.codigo)}`,
            meta: `${neighbors.previous.codigo} · ${neighbors.previous.nivel.nome}`,
          }
        : undefined,
      neighbors.next
        ? {
            label: neighbors.next.nome,
            href: `/crimes/${encodeURIComponent(neighbors.next.codigo)}`,
            meta: `${neighbors.next.codigo} · ${neighbors.next.nivel.nome}`,
          }
        : undefined,
    )}

    <p class="page-source-note">
      Texto legal extraído do guidebook do servidor. Em caso de divergência, a referência oficial é o
      guidebook dentro do jogo.
      ${series ? ` Série ${escapeHtml(series.serie)} ·` : ''}
      <span class="mono-code">${escapeHtml(crime.codigo)}</span>
    </p>
  </div>`;

  return {};
}
