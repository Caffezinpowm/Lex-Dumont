import type { PageContext } from './context';
import type { PageRenderResult } from '../lib/router';
import { appUrl } from '../lib/router';
import { escapeHtml, firstParagraph, readingTime, truncate } from '../lib/utils';
import { setPageMeta } from '../lib/meta';
import { renderMarkdown } from '../lib/markdown';
import { createHashResolver } from '../lib/markdown-links';
import { breadcrumbs, copyButton, prevNextNav } from '../ui/components';
import { initTocSpy, tocNav } from '../ui/reading';
import { icon } from '../ui/icons';
import { renderNotFound } from './not-found';

export function renderDocumentDetail(ctx: PageContext): PageRenderResult {
  const documento = ctx.data.getDocumento(ctx.route.params.id ?? '');

  if (!documento) {
    return renderNotFound(ctx, {
      title: 'Documento não encontrado',
      description: 'Este documento não existe no catálogo atual. Abra o índice de documentos para ver as leituras disponíveis.',
      code: '404',
    });
  }

  const rendered = renderMarkdown(documento.markdown, {
    dropFirstHeading: true,
    includeArticleAnchors: false,
    resolveHash: createHashResolver(ctx.data),
  });
  const toc = rendered.toc;
  const neighbors = ctx.data.getDocumentoNeighbors(documento.id);
  const index = ctx.data.documentos.findIndex((item) => item.id === documento.id);
  const shareUrl = `${window.location.origin}${window.location.pathname}`;
  const description = truncate(
    firstParagraph(documento.markdown) || `${documento.titulo} — documento da Lei Espacial.`,
    170,
  );

  setPageMeta({
    title: documento.titulo,
    description,
  });

  const documentList = ctx.data.documentos
    .map(
      (item, itemIndex) => `<a class="doc-mini${item.id === documento.id ? ' is-current' : ''}" href="${appUrl(
        `/documentos/${encodeURIComponent(item.id)}`,
      )}" ${item.id === documento.id ? 'aria-current="page"' : ''}>
        <span class="doc-mini__index">${String(itemIndex + 1).padStart(2, '0')}</span>
        <span>${escapeHtml(item.titulo)}</span>
      </a>`,
    )
    .join('');

  ctx.pageRoot.innerHTML = `<div class="page reading-page document-detail-page">
    ${breadcrumbs([
      { label: 'Início', href: '/' },
      { label: 'Documentos', href: '/documentos' },
      { label: documento.titulo },
    ])}

    <header class="reading-hero reading-hero--document">
      <div class="reading-hero__copy">
        <p class="eyebrow">${icon('file-text', { size: 15 })} Documento ${String(index + 1).padStart(
          2,
          '0',
        )} de ${String(ctx.data.documentos.length).padStart(2, '0')}</p>
        <h1>${escapeHtml(documento.titulo)}</h1>
        <div class="reading-meta">
          <span>${readingTime(documento.markdown)}</span>
          <span aria-hidden="true">·</span>
          <span>${toc.length} ${toc.length === 1 ? 'seção' : 'seções'}</span>
          <span aria-hidden="true">·</span>
          <span>Procedimento</span>
        </div>
        <div class="detail-actions">
          ${copyButton({
            text: shareUrl,
            label: 'Copiar link',
            successMessage: 'Link do documento copiado.',
            iconName: 'link',
          })}
          <button class="btn btn--quiet btn--small" type="button" data-print>
            ${icon('file-text', { size: 16 })} Imprimir
          </button>
          <a class="btn btn--quiet btn--small" href="${appUrl('/documentos')}">
            ${icon('list', { size: 16 })} Todos os documentos
          </a>
        </div>
      </div>
      <div class="reading-hero__mark reading-hero__mark--document" aria-hidden="true">
        <span class="reading-hero__chapter">PROC</span>
        ${icon('file-text', { size: 36 })}
      </div>
    </header>

    <div class="reading-layout${toc.length ? '' : ' reading-layout--no-toc'}">
      <article class="prose reading-article" id="documento-conteudo">
        ${rendered.html}
      </article>

      <aside class="reading-aside" aria-label="Sumário e documentos">
        ${tocNav(toc, 'Neste documento')}
        <section class="side-card side-card--documents" aria-labelledby="todos-docs-title">
          <h2 id="todos-docs-title">Documentos</h2>
          <div class="doc-mini-list">${documentList}</div>
        </section>
        <section class="side-card side-card--note">
          <h2>Fonte</h2>
          <p>Texto reproduzido do guidebook do servidor. Em caso de divergência, a referência oficial é o jogo.</p>
        </section>
      </aside>
    </div>

    ${prevNextNav(
      neighbors.previous
        ? {
            label: neighbors.previous.titulo,
            href: `/documentos/${encodeURIComponent(neighbors.previous.id)}`,
            meta: 'Documento anterior',
          }
        : undefined,
      neighbors.next
        ? {
            label: neighbors.next.titulo,
            href: `/documentos/${encodeURIComponent(neighbors.next.id)}`,
            meta: 'Próximo documento',
          }
        : undefined,
    )}

    <p class="page-source-note">
      Documento da Lei Espacial · <span class="mono-code">${escapeHtml(documento.id)}</span>
    </p>
  </div>`;

  const article = ctx.pageRoot.querySelector<HTMLElement>('#documento-conteudo');
  const tocElement = ctx.pageRoot.querySelector<HTMLElement>('.reading-toc');
  const controller = new AbortController();

  if (article) initTocSpy(article, tocElement, controller.signal);

  return {
    cleanup: () => controller.abort(),
  };
}
