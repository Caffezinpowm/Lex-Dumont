import type { PageContext } from './context';
import type { PageRenderResult } from '../lib/router';
import { appUrl } from '../lib/router';
import { escapeHtml, firstParagraph, readingTime, truncate } from '../lib/utils';
import { setPageMeta } from '../lib/meta';
import { renderMarkdown } from '../lib/markdown';
import { createHashResolver } from '../lib/markdown-links';
import { breadcrumbs, copyButton, levelBadge, prevNextNav } from '../ui/components';
import { initTocSpy, tocNav } from '../ui/reading';
import { icon } from '../ui/icons';
import { renderNotFound } from './not-found';

export function renderCodexDetail(ctx: PageContext): PageRenderResult {
  const verbete = ctx.data.getVerbete(ctx.route.params.id ?? '');

  if (!verbete) {
    return renderNotFound(ctx, {
      title: 'Verbete não encontrado',
      description: 'Este verbete do Código Espacial não existe no catálogo atual. Consulte o índice completo para encontrar o artigo.',
      code: '404',
    });
  }

  const rendered = renderMarkdown(verbete.markdown, {
    dropFirstHeading: true,
    includeArticleAnchors: true,
    resolveHash: createHashResolver(ctx.data),
  });
  const toc = rendered.toc;
  const neighbors = ctx.data.getVerbeteNeighbors(verbete.id);
  const relatedCrimes = ctx.data.getRelatedCrimesForVerbete(verbete.id);
  const articles = verbete.artigos.length
    ? verbete.artigos.map((article) => `Art. ${article}`).join(' · ')
    : 'Sem artigo numerado';
  const shareUrl = `${window.location.origin}${window.location.pathname}`;

  setPageMeta({
    title: verbete.titulo,
    description: truncate(firstParagraph(verbete.markdown) || `${verbete.titulo} — Código Espacial.`, 170),
  });

  const relatedHtml = relatedCrimes.length
    ? `<ul class="related-crime-list">
        ${relatedCrimes
          .map(
            (crime) => `<li>
              <a class="related-crime" href="${appUrl(`/crimes/${encodeURIComponent(crime.codigo)}`)}">
                <span class="related-crime__code">${escapeHtml(crime.codigo)}</span>
                <span class="related-crime__name">${escapeHtml(crime.nome)}</span>
                ${levelBadge(crime.nivel, true)}
              </a>
            </li>`,
          )
          .join('')}
      </ul>`
    : `<p class="side-card__empty">Nenhum crime do catálogo foi vinculado automaticamente a este verbete.</p>`;

  ctx.pageRoot.innerHTML = `<div class="page reading-page codex-detail-page">
    ${breadcrumbs([
      { label: 'Início', href: '/' },
      { label: 'Código Espacial', href: '/codigo' },
      { label: verbete.titulo },
    ])}

    <header class="reading-hero">
      <div class="reading-hero__copy">
        <p class="eyebrow">${icon('book-open', { size: 15 })} ${escapeHtml(
          verbete.capitulo || 'Código Espacial',
        )}</p>
        <h1>${escapeHtml(verbete.titulo)}</h1>
        <div class="reading-meta">
          <span>${escapeHtml(articles)}</span>
          <span aria-hidden="true">·</span>
          <span>${readingTime(verbete.markdown)}</span>
          ${
            toc.length
              ? `<span aria-hidden="true">·</span><span>${toc.length} ${
                  toc.length === 1 ? 'seção' : 'seções'
                }</span>`
              : ''
          }
        </div>
        <div class="detail-actions">
          ${copyButton({
            text: shareUrl,
            label: 'Copiar link',
            successMessage: 'Link do verbete copiado.',
            iconName: 'link',
          })}
          <button class="btn btn--quiet btn--small" type="button" data-print>
            ${icon('file-text', { size: 16 })} Imprimir
          </button>
          <a class="btn btn--quiet btn--small" href="${appUrl('/codigo')}">
            ${icon('book', { size: 16 })} Índice do código
          </a>
        </div>
      </div>
      <div class="reading-hero__mark" aria-hidden="true">
        <span class="reading-hero__chapter">${escapeHtml(
          verbete.capitulo ? verbete.capitulo.split(' - ')[0] ?? verbete.capitulo : 'Código',
        )}</span>
        ${icon('book-open', { size: 36 })}
      </div>
    </header>

    <div class="reading-layout${toc.length ? '' : ' reading-layout--no-toc'}">
      <article class="prose law-prose reading-article" id="verbete-conteudo">
        ${rendered.html}
      </article>

      ${
        toc.length
          ? `<aside class="reading-aside" aria-label="Sumário e vínculos">
              ${tocNav(toc, 'Neste verbete')}
              <section class="side-card side-card--related" aria-labelledby="crimes-vinculados-title">
                <h2 id="crimes-vinculados-title">Crimes vinculados</h2>
                ${relatedHtml}
              </section>
              <section class="side-card side-card--note">
                <h2>Fonte</h2>
                <p>O texto acima reproduz o Código Espacial do guidebook do servidor. Em caso de divergência, vale o jogo.</p>
              </section>
            </aside>`
          : `<aside class="reading-aside" aria-label="Vínculos">
              <section class="side-card side-card--related" aria-labelledby="crimes-vinculados-title">
                <h2 id="crimes-vinculados-title">Crimes vinculados</h2>
                ${relatedHtml}
              </section>
              <section class="side-card side-card--note">
                <h2>Fonte</h2>
                <p>O texto acima reproduz o Código Espacial do guidebook do servidor. Em caso de divergência, vale o jogo.</p>
              </section>
            </aside>`
      }
    </div>

    ${prevNextNav(
      neighbors.previous
        ? {
            label: neighbors.previous.titulo,
            href: `/codigo/${encodeURIComponent(neighbors.previous.id)}`,
            meta: neighbors.previous.capitulo || 'Código Espacial',
          }
        : undefined,
      neighbors.next
        ? {
            label: neighbors.next.titulo,
            href: `/codigo/${encodeURIComponent(neighbors.next.id)}`,
            meta: neighbors.next.capitulo || 'Código Espacial',
          }
        : undefined,
    )}

    <p class="page-source-note">
      Verbete do Código Espacial · <span class="mono-code">${escapeHtml(verbete.id)}</span> ·
      ${escapeHtml(articles)}
    </p>
  </div>`;

  const article = ctx.pageRoot.querySelector<HTMLElement>('#verbete-conteudo');
  const tocElement = ctx.pageRoot.querySelector<HTMLElement>('.reading-toc');
  const controller = new AbortController();

  if (article) initTocSpy(article, tocElement, controller.signal);

  return {
    cleanup: () => controller.abort(),
  };
}
