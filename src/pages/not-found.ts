import type { PageContext } from './context';
import type { PageRenderResult } from '../lib/router';
import { appUrl } from '../lib/router';
import { escapeHtml } from '../lib/utils';
import { setPageMeta } from '../lib/meta';
import { icon } from '../ui/icons';
import { breadcrumbs, emptyState } from '../ui/components';

interface NotFoundOptions {
  title?: string;
  description?: string;
  code?: string;
}

export function renderNotFound(ctx: PageContext, options: NotFoundOptions = {}): PageRenderResult {
  const title = options.title ?? 'Página não encontrada';
  const description =
    options.description ??
    'O endereço acessado não existe neste visualizador ou o conteúdo foi movido.';
  const code = options.code ?? '404';

  setPageMeta({
    title,
    description,
  });

  ctx.pageRoot.innerHTML = `<div class="page not-found-page">
    ${breadcrumbs([{ label: 'Início', href: '/' }, { label: title }])}
    <section class="not-found" aria-labelledby="not-found-title">
      <div class="not-found__scan" aria-hidden="true"></div>
      <p class="not-found__code">${escapeHtml(code)}</p>
      <p class="eyebrow">Sinal perdido</p>
      <h1 id="not-found-title">${escapeHtml(title)}</h1>
      <p class="not-found__description">${escapeHtml(description)}</p>
      <p class="not-found__path"><span>Endereço consultado</span><code>${escapeHtml(ctx.route.path)}</code></p>
      <div class="not-found__actions">
        <a class="btn btn--primary" href="${appUrl('/crimes')}">${icon('scale', { size: 18 })} Ir para os crimes</a>
        <a class="btn btn--ghost" href="${appUrl('/')}">${icon('home', { size: 18 })} Voltar ao início</a>
      </div>
    </section>

    <section class="not-found__help" aria-labelledby="ajuda-titulo">
      <h2 id="ajuda-titulo">Talvez você procure</h2>
      <div class="quick-links">
        <a class="quick-link" href="${appUrl('/crimes/3-03')}">
          <span class="quick-link__code">3-03</span>
          <span>Homicídio</span>
          ${icon('arrow-right', { size: 15 })}
        </a>
        <a class="quick-link" href="${appUrl('/modificadores/m-04')}">
          <span class="quick-link__code">M-04</span>
          <span>Reincidência</span>
          ${icon('arrow-right', { size: 15 })}
        </a>
        <a class="quick-link" href="${appUrl('/guia-rapido')}">
          <span class="quick-link__code">X-NN</span>
          <span>Guia rápido</span>
          ${icon('arrow-right', { size: 15 })}
        </a>
        <a class="quick-link" href="${appUrl('/codigo')}">
          <span class="quick-link__code">Art.</span>
          <span>Código espacial</span>
          ${icon('arrow-right', { size: 15 })}
        </a>
      </div>
      ${emptyState({
        title: 'Também vale tentar a busca global',
        description: 'Use / ou Ctrl K para procurar por nome, texto, código de crime ou de modificador.',
        iconName: 'search',
        action: `<button class="btn btn--quiet btn--small" type="button" data-focus-search>${icon(
          'search',
          { size: 16 },
        )} Abrir busca</button>`,
      })}
    </section>
  </div>`;

  return {};
}
