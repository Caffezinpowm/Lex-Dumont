import type { PageContext } from './context';
import type { PageRenderResult } from '../lib/router';
import { appUrl } from '../lib/router';
import { escapeHtml, firstParagraph, readingTime } from '../lib/utils';
import { setPageMeta } from '../lib/meta';
import { breadcrumbs } from '../ui/components';
import { icon } from '../ui/icons';

export function renderDocumentsIndex(ctx: PageContext): PageRenderResult {
  const { data } = ctx;

  setPageMeta({
    title: 'Documentos',
    description:
      'Documentos e procedimentos da Lei Espacial: julgamentos, direitos de prisioneiro, contrabando, audiências, corte marcial e lei marcial.',
  });

  const cards = data.documentos
    .map((documento, index) => {
      const summary = firstParagraph(documento.markdown);
      return `<a class="doc-card${index === 0 ? ' doc-card--featured' : ''}" href="${appUrl(
        `/documentos/${encodeURIComponent(documento.id)}`,
      )}">
        <span class="doc-card__top">
          <span class="doc-card__index">${String(index + 1).padStart(2, '0')}</span>
          <span class="doc-card__meta">${icon('clock', { size: 14 })} ${escapeHtml(
            readingTime(documento.markdown),
          )}</span>
        </span>
        <h2>${escapeHtml(documento.titulo)}</h2>
        <p>${escapeHtml(summary || 'Documento de procedimento da Lei Espacial.')}</p>
        <span class="doc-card__action">Abrir documento ${icon('arrow-right', { size: 15 })}</span>
        <span class="doc-card__corner" aria-hidden="true">${icon('file-text', { size: 20 })}</span>
      </a>`;
    })
    .join('');

  ctx.pageRoot.innerHTML = `<div class="page documents-index-page">
    ${breadcrumbs([{ label: 'Início', href: '/' }, { label: 'Documentos' }])}

    <header class="page-header page-header--split">
      <div>
        <p class="eyebrow">Procedimentos da estação</p>
        <h1>Documentos</h1>
        <p class="page-header__lead">Julgamentos, direitos, contrabando e normas especiais. Leia o texto integral com sumário, sem precisar abrir o guidebook durante a partida.</p>
      </div>
      <div class="page-header__stamp">
        <span class="page-header__stamp-number">${data.documentos.length}</span>
        <span>documentos<br />de referência</span>
      </div>
    </header>

    <section class="doc-intro" aria-labelledby="docs-como-title">
      <span class="doc-intro__icon" aria-hidden="true">${icon('file-text', { size: 24 })}</span>
      <div>
        <h2 id="docs-como-title">Como usar esta seção</h2>
        <p>Cada documento é uma leitura independente do Código Espacial. O sumário lateral acompanha a leitura; ao final, use a navegação para seguir para o próximo documento.</p>
      </div>
      <span class="doc-intro__tag">${data.documentos.length} arquivos</span>
    </section>

    <div class="doc-grid">${cards}</div>

    <section class="doc-callout" aria-labelledby="doc-callout-title">
      <div>
        <p class="eyebrow">Também pode ajudar</p>
        <h2 id="doc-callout-title">Precisa do fundamento legal?</h2>
        <p>O Código Espacial reúne os artigos citados pelos procedimentos e pelos crimes. Use a busca global para ir direto a um artigo.</p>
      </div>
      <div class="doc-callout__actions">
        <a class="btn btn--primary" href="${appUrl('/codigo')}">${icon('book-open', { size: 18 })} Abrir o código</a>
        <a class="btn btn--ghost" href="${appUrl('/crimes')}">${icon('scale', { size: 18 })} Ver crimes</a>
      </div>
    </section>

    <p class="page-source-note">
      Documentos extraídos do guidebook do servidor. Em caso de divergência, a referência oficial é o
      guidebook dentro do jogo.
    </p>
  </div>`;

  return {};
}
