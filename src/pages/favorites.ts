import type { PageContext } from './context';
import type { PageRenderResult } from '../lib/router';
import { appUrl } from '../lib/router';
import { plural } from '../lib/utils';
import { setPageMeta } from '../lib/meta';
import { clearFavorites, favoriteCount, getFavorites } from '../lib/favorites';
import { breadcrumbs, crimeCard, emptyState } from '../ui/components';
import { showToast } from '../ui/feedback';
import { icon } from '../ui/icons';

export function renderFavorites(ctx: PageContext): PageRenderResult {
  setPageMeta({
    title: 'Favoritos',
    description: 'Seus crimes salvos para consulta rápida durante a partida. Os favoritos ficam armazenados somente neste navegador.',
  });

  ctx.pageRoot.innerHTML = `<div class="page favorites-page">
    ${breadcrumbs([{ label: 'Início', href: '/' }, { label: 'Favoritos' }])}

    <header class="page-header page-header--split">
      <div>
        <p class="eyebrow">Consulta rápida</p>
        <h1>Favoritos</h1>
        <p class="page-header__lead">Os crimes que você marcou ficam salvos neste navegador, prontos para consulta no meio do turno.</p>
      </div>
      <div class="favorites-summary">
        <span class="favorites-summary__value" data-favorites-page-count>${favoriteCount()}</span>
        <span class="favorites-summary__label" data-favorites-page-label>${plural(
          favoriteCount(),
          'crime salvo',
          'crimes salvos',
        )}</span>
      </div>
    </header>

    <div class="favorites-toolbar">
      <p>${icon('info', { size: 15 })} Armazenamento local do navegador. Nada é enviado a um servidor.</p>
      <div class="favorites-toolbar__actions">
        <button class="btn btn--quiet btn--small" type="button" data-favorites-clear ${favoriteCount() === 0 ? 'hidden' : ''}>
          ${icon('trash', { size: 16 })} <span data-favorites-clear-label>Remover todos</span>
        </button>
      </div>
    </div>

    <div id="favorites-content"></div>

    <section class="favorites-tip" aria-labelledby="favoritos-dica-title">
      <span class="favorites-tip__icon" aria-hidden="true">${icon('star', { size: 22 })}</span>
      <div>
        <h2 id="favoritos-dica-title">Como adicionar</h2>
        <p>Use a estrela nos cartões de crime ou na página de detalhe. O contador no menu e na barra superior acompanha a lista.</p>
      </div>
      <a class="text-link" href="${appUrl('/crimes')}">Explorar crimes ${icon('arrow-up-right', { size: 15 })}</a>
    </section>
  </div>`;

  const content = ctx.pageRoot.querySelector<HTMLElement>('#favorites-content');
  const countElement = ctx.pageRoot.querySelector<HTMLElement>('[data-favorites-page-count]');
  const countLabel = ctx.pageRoot.querySelector<HTMLElement>('[data-favorites-page-label]');
  const clearButton = ctx.pageRoot.querySelector<HTMLButtonElement>('[data-favorites-clear]');
  const clearLabel = ctx.pageRoot.querySelector<HTMLElement>('[data-favorites-clear-label]');

  if (!content || !countElement || !countLabel || !clearButton || !clearLabel) {
    throw new Error('Não foi possível inicializar a página de favoritos.');
  }

  const controller = new AbortController();
  let clearTimer: number | undefined;
  let confirmingClear = false;

  const resetClearButton = (): void => {
    window.clearTimeout(clearTimer);
    confirmingClear = false;
    clearButton.classList.remove('is-confirming');
    clearLabel.textContent = 'Remover todos';
  };

  const draw = (): void => {
    const favorites = getFavorites();
    const crimes = ctx.data.crimes.filter((crime) => favorites.has(crime.codigo));
    const count = crimes.length;

    countElement.textContent = String(count);
    countLabel.textContent = plural(count, 'crime salvo', 'crimes salvos');
    clearButton.hidden = count === 0;

    if (count === 0) {
      content.innerHTML = emptyState({
        title: 'Nenhum crime favoritado ainda',
        description:
          'Abra a lista de crimes e use a estrela para salvar as consultas mais frequentes. Os favoritos aparecem aqui e no contador do menu.',
        iconName: 'star',
        action: `<a class="btn btn--primary btn--small" href="${appUrl('/crimes')}">${icon(
          'scale',
          { size: 16 },
        )} Explorar os crimes</a>`,
      });
      resetClearButton();
      return;
    }

    content.innerHTML = `<div class="favorites-grid">
      ${crimes.map((crime) => crimeCard(crime)).join('')}
    </div>
    <p class="favorites-order-note">${icon('info', { size: 14 })} Exibidos na ordem da Lei Espacial, não na ordem em que foram salvos.</p>`;
  };

  clearButton.addEventListener(
    'click',
    () => {
      if (favoriteCount() === 0) return;

      if (!confirmingClear) {
        confirmingClear = true;
        clearButton.classList.add('is-confirming');
        clearLabel.textContent = 'Confirmar remoção';
        clearTimer = window.setTimeout(resetClearButton, 3500);
        return;
      }

      const removed = favoriteCount();
      resetClearButton();
      clearFavorites();
      showToast(`${removed} ${plural(removed, 'favorito removido', 'favoritos removidos')}.`, 'info');
    },
    { signal: controller.signal },
  );

  window.addEventListener(
    'favorites:changed',
    () => {
      resetClearButton();
      draw();
    },
    { signal: controller.signal },
  );

  draw();

  return {
    cleanup: () => {
      window.clearTimeout(clearTimer);
      controller.abort();
    },
  };
}
