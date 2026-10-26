import './styles/global.css';

import { LawDataService } from './data/data-service';
import { SearchIndex } from './data/search';
import { Router, type AppRoute, type PageRenderResult } from './lib/router';
import { createLayout, type AppLayout } from './ui/layout';
import { GlobalSearch } from './ui/global-search';
import { copyWithFeedback, showToast } from './ui/feedback';
import { icon } from './ui/icons';
import { isFavorite, toggleFavorite } from './lib/favorites';
import { escapeHtml } from './lib/utils';
import { setPageMeta } from './lib/meta';
import type { PageContext } from './pages/context';
import { renderHome } from './pages/home';
import { renderCrimes } from './pages/crimes';
import { renderCrimeDetail } from './pages/crime-detail';
import { renderGuide } from './pages/guide';
import { renderModifiers } from './pages/modifiers';
import { renderModifierDetail } from './pages/modifier-detail';
import { renderCodexIndex } from './pages/codex';
import { renderCodexDetail } from './pages/codex-detail';
import { renderDocumentsIndex } from './pages/documents';
import { renderDocumentDetail } from './pages/document-detail';
import { renderFavorites } from './pages/favorites';
import { renderNotFound } from './pages/not-found';

const PAGE_RENDERERS: Partial<Record<AppRoute['name'], (ctx: PageContext) => PageRenderResult>> = {
  home: renderHome,
  crimes: renderCrimes,
  crime: renderCrimeDetail,
  'guia-rapido': renderGuide,
  modificadores: renderModifiers,
  modificador: renderModifierDetail,
  codigo: renderCodexIndex,
  verbete: renderCodexDetail,
  documentos: renderDocumentsIndex,
  documento: renderDocumentDetail,
  favoritos: renderFavorites,
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro inesperado ao montar a página.';
}

function renderPageError(ctx: PageContext, error: unknown): void {
  setPageMeta({
    title: 'Não foi possível abrir esta página',
    description: 'Ocorreu um erro ao montar esta página do visualizador da Lei Espacial.',
  });

  ctx.pageRoot.innerHTML = `<div class="page error-page">
    <section class="not-found" aria-labelledby="error-title">
      <div class="not-found__scan" aria-hidden="true"></div>
      <p class="not-found__code">500</p>
      <p class="eyebrow">Falha de leitura</p>
      <h1 id="error-title">Não foi possível abrir esta página</h1>
      <p class="not-found__description">O conteúdo foi carregado, mas esta consulta encontrou um erro inesperado. Tente recarregar ou voltar ao início.</p>
      <p class="not-found__path"><span>Detalhe técnico</span><code>${escapeHtml(errorMessage(error))}</code></p>
      <div class="not-found__actions">
        <button class="btn btn--primary" type="button" data-retry>${icon('arrow-up', { size: 18 })} Recarregar</button>
        <a class="btn btn--ghost" href="${import.meta.env.BASE_URL}">${icon('home', { size: 18 })} Voltar ao início</a>
      </div>
    </section>
  </div>`;
}

function syncFavoriteButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-favorite-code]').forEach((button) => {
    const code = button.dataset.favoriteCode;
    if (!code) return;

    const active = isFavorite(code);
    const name = button.dataset.favoriteName ?? code;
    const label = active ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
    const visibleLabel = active ? 'Favoritado' : 'Favoritar';
    const size = button.classList.contains('favorite-button--small') ? 17 : 19;
    const textTarget = button.querySelector<HTMLElement>('[data-fav-label]');

    button.classList.toggle('is-favorite', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute(
      'aria-label',
      textTarget ? `${visibleLabel} — ${label}: ${name}` : `${label}: ${name}`,
    );
    button.title = label;

    const iconTarget = button.querySelector<HTMLElement>('[data-fav-icon]');
    if (iconTarget) iconTarget.innerHTML = icon(active ? 'star-filled' : 'star', { size });

    if (textTarget) textTarget.textContent = visibleLabel;
  });
}

function setupGlobalInteractions(): void {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const favoriteButton = target.closest<HTMLButtonElement>('[data-favorite-code]');
    if (favoriteButton) {
      const code = favoriteButton.dataset.favoriteCode;
      if (!code) return;

      event.preventDefault();
      const name = favoriteButton.dataset.favoriteName ?? code;
      const added = toggleFavorite(code);
      showToast(
        added ? `${name} adicionado aos favoritos.` : `${name} removido dos favoritos.`,
        added ? 'success' : 'info',
      );
      return;
    }

    const copyButton = target.closest<HTMLButtonElement>('[data-copy-text]');
    if (copyButton) {
      event.preventDefault();
      const text = copyButton.dataset.copyText ?? '';
      if (!text) return;
      void copyWithFeedback(copyButton, text, copyButton.dataset.copySuccess);
      return;
    }

    const copyLinkButton = target.closest<HTMLButtonElement>('[data-copy-link]');
    if (copyLinkButton) {
      event.preventDefault();
      void copyWithFeedback(
        copyLinkButton,
        window.location.href,
        copyLinkButton.dataset.copySuccess ?? 'Link copiado.',
      );
      return;
    }

    if (target.closest('[data-print]')) {
      window.print();
      return;
    }

    if (target.closest('[data-focus-search]')) {
      event.preventDefault();
      const input = document.getElementById('busca-global');
      if (input instanceof HTMLInputElement) {
        input.focus();
        input.select();
      }
      return;
    }

    if (target.closest('[data-retry]')) {
      event.preventDefault();
      window.location.reload();
    }
  });

  window.addEventListener('app:route-changed', () => {
    syncFavoriteButtons();
  });

  window.addEventListener('favorites:changed', syncFavoriteButtons);
}

function renderBootError(container: HTMLElement, error: unknown): void {
  const detail = errorMessage(error);
  container.innerHTML = `<div class="boot-error">
    <div class="boot-error__card" role="alert">
      <span class="boot-error__icon" aria-hidden="true">${icon('alert-triangle', { size: 30 })}</span>
      <p class="eyebrow">Falha ao carregar</p>
      <h1>A Lei Espacial não pôde ser aberta</h1>
      <p>${escapeHtml(detail)}</p>
      <p class="boot-error__hint">Confirme se <code>space-law.json</code> está publicado junto do site e tente novamente.</p>
      <div class="boot-error__actions">
        <button class="btn btn--primary" type="button" data-retry>${icon('arrow-up', { size: 18 })} Recarregar</button>
        <a class="btn btn--ghost" href="${import.meta.env.BASE_URL}">${icon('home', { size: 18 })} Início</a>
      </div>
    </div>
  </div>`;

  container.querySelector<HTMLButtonElement>('[data-retry]')?.addEventListener('click', () => {
    window.location.reload();
  });
}

async function boot(): Promise<void> {
  const container = document.getElementById('app');
  if (!container) return;

  try {
    const data = await LawDataService.load();
    const search = new SearchIndex(data);

    const layout: AppLayout = createLayout(container, data);
    const globalSearch = new GlobalSearch(data, search);

    let cleanup: (() => void) | undefined;

    const router = new Router(async (route) => {
      cleanup?.();
      cleanup = undefined;

      const ctx: PageContext = {
        route,
        data,
        search,
        pageRoot: layout.pageRoot,
        router,
      };

      layout.setRoute(route);
      globalSearch.close();

      let result: PageRenderResult | void;
      try {
        const renderer = PAGE_RENDERERS[route.name];
        result = renderer ? renderer(ctx) : renderNotFound(ctx);
      } catch (error) {
        console.error('Falha ao montar a página.', error);
        renderPageError(ctx, error);
        result = {};
      }

      cleanup = result?.cleanup;
      return {
        cleanup: () => {
          cleanup?.();
          cleanup = undefined;
        },
      };
    });

    setupGlobalInteractions();
    router.start();

    window.addEventListener('beforeunload', () => {
      cleanup?.();
      globalSearch.destroy();
      layout.destroy();
    });
  } catch (error) {
    console.error('Falha ao iniciar o visualizador.', error);
    renderBootError(container, error);
  }
}

void boot();
