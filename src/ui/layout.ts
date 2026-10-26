import type { AppRoute } from '../lib/router';
import { appUrl } from '../lib/router';
import type { LawDataService } from '../data/data-service';
import { favoriteCount } from '../lib/favorites';
import { escapeAttr, escapeHtml, isSafeHttpUrl, levelStyle } from '../lib/utils';
import { brandMark, icon } from './icons';
import { initTheme } from '../lib/theme';

export interface AppLayout {
  pageRoot: HTMLElement;
  setRoute: (route: AppRoute) => void;
  closeNavigation: () => void;
  syncFavorites: () => void;
  destroy: () => void;
}

function required<T extends Element>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Elemento de layout ausente: ${selector}`);
  return element;
}

function navLink(options: {
  href: string;
  label: string;
  iconName: Parameters<typeof icon>[0];
  activeName: string;
  count?: number;
  countLabel?: string;
}): string {
  const count =
    typeof options.count === 'number'
      ? `<span class="nav-link__count" data-nav-count="${escapeAttr(options.activeName)}" ${
          options.count === 0 ? 'hidden' : ''
        }>${options.count}</span>`
      : '';

  return `<a class="nav-link" data-nav="${escapeAttr(options.activeName)}" href="${appUrl(options.href)}">
    <span class="nav-link__icon" aria-hidden="true">${icon(options.iconName, { size: 18 })}</span>
    <span class="nav-link__label">${escapeHtml(options.label)}</span>
    ${count}
    ${options.countLabel ? `<span class="sr-only">${escapeHtml(options.countLabel)}</span>` : ''}
  </a>`;
}

function footerHtml(data: LawDataService): string {
  const source = data.data.fonte;
  const repository = isSafeHttpUrl(source.repositorio)
    ? `<a href="${escapeAttr(source.repositorio)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
        source.repositorio.replace(/^https?:\/\//, ''),
      )}${icon('external-link', { size: 13 })}</a>`
    : `<span>${escapeHtml(source.repositorio)}</span>`;

  const paths = source.caminhos
    .map((path) => `<li><code>${escapeHtml(path)}</code></li>`)
    .join('');

  return `<footer class="site-footer" aria-labelledby="rodape-titulo">
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <a class="brand brand--footer" href="${appUrl('/')}">
          ${brandMark()}
          <span class="brand__text">
            <strong>Lei Espacial</strong>
            <small>Dumont Station</small>
          </span>
        </a>
        <h2 id="rodape-titulo" class="sr-only">Sobre este visualizador</h2>
        <p>Um visualizador comunitário e não oficial da Lei Espacial de <strong>${escapeHtml(
          source.servidor,
        )}</strong>.</p>
        <p class="site-footer__warning">${icon('info', {
          size: 16,
        })} O texto exibido é uma cópia do conteúdo do servidor. Em caso de divergência, o guidebook dentro do jogo é a referência oficial.</p>
      </div>

      <div class="site-footer__column">
        <h3>Fonte</h3>
        <p>${repository}</p>
        <p class="site-footer__muted">Branch: <code>${escapeHtml(source.branch)}</code></p>
        <details class="source-paths">
          <summary>Caminhos extraídos <span>${source.caminhos.length}</span></summary>
          <ul>${paths}</ul>
        </details>
      </div>

      <div class="site-footer__column">
        <h3>Licença</h3>
        <p>${escapeHtml(source.licenca)}</p>
        <p class="site-footer__muted">O código do visualizador também é distribuído sob a licença do projeto.</p>
      </div>

      <div class="site-footer__column">
        <h3>Navegar</h3>
        <ul class="footer-links">
          <li><a href="${appUrl('/crimes')}">Todos os crimes</a></li>
          <li><a href="${appUrl('/guia-rapido')}">Guia rápido</a></li>
          <li><a href="${appUrl('/codigo')}">Código espacial</a></li>
          <li><a href="${appUrl('/documentos')}">Documentos</a></li>
        </ul>
      </div>
    </div>

    <div class="site-footer__bottom">
      <p>Visualizador não oficial · Sem vínculo com os administradores do servidor.</p>
      <p>Penas em ${escapeHtml(data.data.unidade_pena)} · moeda: ${escapeHtml(data.data.moeda)}</p>
    </div>
  </footer>`;
}

export function createLayout(container: HTMLElement, data: LawDataService): AppLayout {
  const totalCrimes = data.crimes.length;
  const levelLinks = data.niveis
    .map(
      (nivel) => `<a class="level-link" data-level-link="${escapeAttr(nivel.codigo)}" href="${appUrl(
        `/crimes?nivel=${encodeURIComponent(nivel.codigo)}`,
      )}" style="${levelStyle(nivel.cor)}">
        <span class="level-link__dot" aria-hidden="true"></span>
        <span class="level-link__code">${escapeHtml(nivel.codigo)}</span>
        <span class="level-link__name">${escapeHtml(nivel.nome)}</span>
        <span class="level-link__count">${nivel.crimes.length}</span>
      </a>`,
    )
    .join('');

  const initialFavorites = favoriteCount();

  container.innerHTML = `<div class="app-shell">
    <header class="topbar">
      <div class="topbar__inner">
        <button class="icon-button nav-toggle" type="button" data-action="toggle-nav" aria-label="Abrir menu de navegação" aria-expanded="false" aria-controls="menu-lateral">
          ${icon('menu')}
        </button>

        <a class="brand" href="${appUrl('/')}" aria-label="Lei Espacial Dumont · Gaby — início">
          ${brandMark()}
          <span class="brand__text">
            <strong>Lei Espacial</strong>
            <small>Dumont · Gaby</small>
          </span>
        </a>

        <div class="search-field" id="search-field">
          <span class="search-field__icon" aria-hidden="true">${icon('search', { size: 18 })}</span>
          <input
            id="busca-global"
            class="search-field__input"
            type="search"
            placeholder="Buscar crime, código, artigo…"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            enterkeyhint="search"
            role="combobox"
            aria-expanded="false"
            aria-controls="search-results"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-label="Buscar em toda a Lei Espacial"
          />
          <button class="search-field__clear" id="search-clear" type="button" aria-label="Limpar busca" hidden>
            ${icon('close', { size: 16 })}
          </button>
          <kbd class="search-field__shortcut" id="search-shortcut" title="Atalho de busca">Ctrl K</kbd>
        </div>

        <div class="topbar__actions">
          <a class="icon-button topbar__favorite" href="${appUrl('/favoritos')}" aria-label="Abrir favoritos salvos" title="Favoritos">
            ${icon('star')}
            <span class="topbar__badge" data-favorites-count ${initialFavorites === 0 ? 'hidden' : ''}>${initialFavorites}</span>
            <span class="sr-only">favoritos salvos</span>
          </a>
          <button class="icon-button" type="button" data-action="toggle-theme" aria-label="Alternar tema"></button>
        </div>
      </div>
    </header>

    <div class="search-scrim" id="search-scrim" hidden></div>

    <div class="search-panel" id="search-panel" hidden>
      <div class="search-panel__surface">
        <div class="search-panel__head">
          <span class="search-panel__signal" aria-hidden="true"></span>
          <span>Arquivo jurídico da estação</span>
          <kbd>ESC</kbd>
        </div>
        <div class="search-status sr-only" id="search-status" role="status" aria-live="polite"></div>
        <div class="search-results" id="search-results" role="listbox" aria-label="Resultados da busca"></div>
        <div class="search-panel__footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
          <span><kbd>Enter</kbd> abrir</span>
          <span><kbd>Esc</kbd> fechar</span>
          <span class="search-panel__instant">BUSCA INSTANTÂNEA</span>
        </div>
      </div>
    </div>

    <div class="sidebar-scrim" data-action="close-nav" hidden></div>

    <div class="app-frame">
      <aside class="sidebar" id="menu-lateral" aria-label="Navegação principal">
        <div class="sidebar__mobile-head">
          <span>Navegação</span>
          <button class="icon-button" type="button" data-action="close-nav" aria-label="Fechar menu">
            ${icon('close')}
          </button>
        </div>

        <div class="sidebar__scroll">
          <nav class="sidebar__nav" aria-label="Seções da lei">
            <p class="sidebar__label">Consulta</p>
            ${navLink({ href: '/', label: 'Visão geral', iconName: 'home', activeName: 'home' })}
            ${navLink({
              href: '/crimes',
              label: 'Crimes',
              iconName: 'scale',
              activeName: 'crimes',
              count: totalCrimes,
              countLabel: 'crimes listados',
            })}
            ${navLink({ href: '/guia-rapido', label: 'Guia rápido', iconName: 'grid', activeName: 'guia-rapido' })}
            ${navLink({
              href: '/modificadores',
              label: 'Modificadores',
              iconName: 'sliders',
              activeName: 'modificadores',
              count: data.modificadores.length,
              countLabel: 'modificadores',
            })}

            <p class="sidebar__label sidebar__label--spaced">Leitura</p>
            ${navLink({
              href: '/codigo',
              label: 'Código espacial',
              iconName: 'book-open',
              activeName: 'codigo',
              count: data.verbetes.length,
              countLabel: 'verbetes',
            })}
            ${navLink({
              href: '/documentos',
              label: 'Documentos',
              iconName: 'file-text',
              activeName: 'documentos',
              count: data.documentos.length,
              countLabel: 'documentos',
            })}
            ${navLink({
              href: '/favoritos',
              label: 'Favoritos',
              iconName: 'star',
              activeName: 'favoritos',
              count: initialFavorites,
              countLabel: 'crimes favoritados',
            })}
          </nav>

          <div class="sidebar__levels">
            <div class="sidebar__label-row">
              <p class="sidebar__label">Gravidade</p>
              <span>${totalCrimes}</span>
            </div>
            ${levelLinks}
          </div>

          <div class="sidebar__note">
            <span class="signal-dot" aria-hidden="true"></span>
            <div>
              <strong>Consulta rápida</strong>
              <p>Use <kbd>/</kbd> ou <kbd>Ctrl K</kbd> em qualquer página.</p>
            </div>
          </div>

          <p class="sidebar__source">Fonte: <a href="${escapeAttr(
            isSafeHttpUrl(data.data.fonte.repositorio) ? data.data.fonte.repositorio : '#',
          )}" target="_blank" rel="noopener noreferrer">Project Dumont / Gaby Station</a></p>
        </div>
      </aside>

      <main id="conteudo" class="main" tabindex="-1">
        <div id="page-root" class="page-root"></div>
      </main>
    </div>

    <button class="back-to-top" id="back-to-top" type="button" aria-label="Voltar ao topo" hidden>
      ${icon('arrow-up', { size: 20 })}
    </button>

    ${footerHtml(data)}
  </div>`;

  const pageRoot = required<HTMLElement>('#page-root', container);
  const sidebar = required<HTMLElement>('#menu-lateral', container);
  const toggleButton = required<HTMLButtonElement>('.nav-toggle', container);
  const navScrim = required<HTMLElement>('.sidebar-scrim', container);
  const backToTop = required<HTMLButtonElement>('#back-to-top', container);
  const controller = new AbortController();
  const mobileQuery = window.matchMedia('(max-width: 1000px)');
  let navOpen = false;
  let previousFocus: HTMLElement | null = null;

  initTheme();

  const setSidebarAccessibility = (): void => {
    if (mobileQuery.matches) {
      sidebar.inert = !navOpen;
      sidebar.setAttribute('aria-hidden', String(!navOpen));
    } else {
      sidebar.inert = false;
      sidebar.removeAttribute('aria-hidden');
    }
  };

  const closeNavigation = (restoreFocus = false): void => {
    if (!navOpen) {
      setSidebarAccessibility();
      return;
    }

    navOpen = false;
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.setAttribute('aria-label', 'Abrir menu de navegação');
    document.body.classList.remove('nav-open');
    navScrim.hidden = true;
    setSidebarAccessibility();
    if (restoreFocus) {
      (previousFocus ?? toggleButton).focus();
    }
    previousFocus = null;
  };

  const openNavigation = (): void => {
    if (!mobileQuery.matches || navOpen) return;
    navOpen = true;
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    toggleButton.setAttribute('aria-expanded', 'true');
    toggleButton.setAttribute('aria-label', 'Fechar menu de navegação');
    document.body.classList.add('nav-open');
    navScrim.hidden = false;
    sidebar.inert = false;
    sidebar.removeAttribute('aria-hidden');
    window.requestAnimationFrame(() => {
      required<HTMLButtonElement>('[data-action="close-nav"]', sidebar).focus();
    });
  };

  const updateBackToTop = (): void => {
    backToTop.hidden = window.scrollY < 560;
  };

  const syncFavorites = (): void => {
    const count = favoriteCount();
    container.querySelectorAll<HTMLElement>('[data-favorites-count]').forEach((badge) => {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    });
    container.querySelectorAll<HTMLElement>('[data-nav-count="favoritos"]').forEach((badge) => {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    });
  };

  container.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
      if (action === 'toggle-nav') {
        if (navOpen) closeNavigation(true);
        else openNavigation();
      } else if (action === 'close-nav') {
        closeNavigation(true);
      }
    },
    { signal: controller.signal },
  );

  document.addEventListener(
    'keydown',
    (event) => {
      if (!navOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeNavigation(true);
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('hidden') && element.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    { signal: controller.signal },
  );

  mobileQuery.addEventListener(
    'change',
    () => {
      if (!mobileQuery.matches) closeNavigation(false);
      else if (!navOpen) setSidebarAccessibility();
    },
    { signal: controller.signal },
  );

  window.addEventListener(
    'scroll',
    () => {
      updateBackToTop();
    },
    { passive: true, signal: controller.signal },
  );

  backToTop.addEventListener(
    'click',
    () => {
      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    },
    { signal: controller.signal },
  );

  window.addEventListener(
    'app:route-changed',
    () => {
      closeNavigation(false);
      updateBackToTop();
    },
    { signal: controller.signal },
  );

  window.addEventListener('favorites:changed', syncFavorites, { signal: controller.signal });

  setSidebarAccessibility();
  updateBackToTop();
  syncFavorites();

  return {
    pageRoot,
    setRoute: (route: AppRoute) => {
      const activeMap: Record<string, string> = {
        home: 'home',
        crimes: 'crimes',
        crime: 'crimes',
        'guia-rapido': 'guia-rapido',
        modificadores: 'modificadores',
        modificador: 'modificadores',
        codigo: 'codigo',
        verbete: 'codigo',
        documentos: 'documentos',
        documento: 'documentos',
        favoritos: 'favoritos',
      };
      const active = activeMap[route.name];
      container.querySelectorAll<HTMLAnchorElement>('.nav-link[data-nav]').forEach((link) => {
        if (link.dataset.nav === active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });

      const level = route.name === 'crimes' ? route.query.get('nivel') : null;
      container.querySelectorAll<HTMLAnchorElement>('[data-level-link]').forEach((link) => {
        if (level && link.dataset.levelLink === level) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });

      // Mantém favoritos atualizados após a página renderizar novos botões.
      syncFavorites();
    },
    closeNavigation: () => closeNavigation(false),
    syncFavorites,
    destroy: () => controller.abort(),
  };
}
