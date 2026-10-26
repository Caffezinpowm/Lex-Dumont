import { escapeRegExp, prefersReducedMotion, withBase } from './utils';

export type RouteName =
  | 'home'
  | 'crimes'
  | 'crime'
  | 'guia-rapido'
  | 'modificadores'
  | 'modificador'
  | 'codigo'
  | 'verbete'
  | 'documentos'
  | 'documento'
  | 'favoritos'
  | 'not-found';

export interface AppRoute {
  name: RouteName;
  path: string;
  query: URLSearchParams;
  hash: string;
  params: Readonly<Record<string, string>>;
}

interface RouteDefinition {
  name: RouteName;
  pattern: string;
}

interface CompiledRoute extends RouteDefinition {
  regex: RegExp;
  keys: string[];
}

export interface PageRenderResult {
  cleanup?: () => void;
}

type RenderPage = (route: AppRoute) => Promise<PageRenderResult | void> | PageRenderResult | void;

interface NavigationOptions {
  replace?: boolean;
  preserveScroll?: boolean;
}

const ROUTES: RouteDefinition[] = [
  { name: 'home', pattern: '/' },
  { name: 'crimes', pattern: '/crimes' },
  { name: 'crime', pattern: '/crimes/:codigo' },
  { name: 'guia-rapido', pattern: '/guia-rapido' },
  { name: 'modificadores', pattern: '/modificadores' },
  { name: 'modificador', pattern: '/modificadores/:codigo' },
  { name: 'codigo', pattern: '/codigo' },
  { name: 'verbete', pattern: '/codigo/:id' },
  { name: 'documentos', pattern: '/documentos' },
  { name: 'documento', pattern: '/documentos/:id' },
  { name: 'favoritos', pattern: '/favoritos' },
];

function compileRoute(definition: RouteDefinition): CompiledRoute {
  const keys: string[] = [];
  const pattern = definition.pattern
    .split('/')
    .map((segment) => {
      if (!segment.startsWith(':')) return escapeRegExp(segment);
      keys.push(segment.slice(1));
      return '([^/]+)';
    })
    .join('/');

  return {
    ...definition,
    keys,
    regex: new RegExp(`^${pattern}/?$`, 'i'),
  };
}

const COMPILED_ROUTES = ROUTES.map(compileRoute);

function normalizedBaseUrl(): string {
  const raw = import.meta.env.BASE_URL || '/';
  return raw.endsWith('/') ? raw : `${raw}/`;
}

function readPathFromBrowser(): string {
  const base = normalizedBaseUrl();
  let pathname = window.location.pathname || '/';

  if (base !== '/') {
    const baseWithoutSlash = base.slice(0, -1);
    if (pathname === baseWithoutSlash) {
      pathname = '/';
    } else if (pathname.startsWith(base)) {
      pathname = `/${pathname.slice(base.length)}`;
    } else {
      // Em previews locais com outra base, ainda permitimos a rota visual.
      pathname = pathname || '/';
    }
  }

  pathname = pathname.replace(/\/index\.html$/i, '/').replace(/\/404\.html$/i, '/');
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

export function resolveRoute(
  path: string,
  query = new URLSearchParams(),
  hash = '',
): AppRoute {
  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, '') : path;

  for (const route of COMPILED_ROUTES) {
    const match = route.regex.exec(normalizedPath);
    if (!match) continue;

    const params: Record<string, string> = {};
    route.keys.forEach((key, index) => {
      const value = match[index + 1] ?? '';
      try {
        params[key] = decodeURIComponent(value);
      } catch {
        params[key] = value;
      }
    });

    return {
      name: route.name,
      path: normalizedPath,
      query,
      hash,
      params,
    };
  }

  return {
    name: 'not-found',
    path: normalizedPath,
    query,
    hash,
    params: {},
  };
}

function currentAppRoute(): AppRoute {
  return resolveRoute(readPathFromBrowser(), new URLSearchParams(window.location.search), window.location.hash);
}

function scrollToTarget(hash: string, immediate: boolean): void {
  if (!hash) return;
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  if (!id) return;

  requestAnimationFrame(() => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({
      behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  });
}

export class Router {
  private readonly renderPage: RenderPage;
  private cleanup: (() => void) | undefined;
  private started = false;
  private navigationSequence = 0;
  private readonly controller = new AbortController();

  constructor(renderPage: RenderPage) {
    this.renderPage = renderPage;
  }

  start(): void {
    if (this.started) return;
    this.started = true;

    window.addEventListener(
      'popstate',
      () => {
        void this.handleLocation('popstate');
      },
      { signal: this.controller.signal },
    );

    document.addEventListener(
      'click',
      (event) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const target = event.target;
        if (!(target instanceof Element)) return;

        const anchor = target.closest<HTMLAnchorElement>('a[href]');
        if (!anchor) return;
        if (anchor.target === '_blank' || anchor.hasAttribute('download') || anchor.dataset.native !== undefined) {
          return;
        }

        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) return;

        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;

        const base = normalizedBaseUrl();
        if (base !== '/' && !url.pathname.startsWith(base) && url.pathname !== base.slice(0, -1)) return;

        event.preventDefault();
        const relativePath = this.pathFromBrowserUrl(url);
        this.navigate(`${relativePath}${url.search}${url.hash}`);
      },
      { signal: this.controller.signal },
    );

    void this.handleLocation('initial');
  }

  private pathFromBrowserUrl(url: URL): string {
    const base = normalizedBaseUrl();
    let pathname = url.pathname;
    if (base !== '/') {
      if (pathname === base.slice(0, -1)) pathname = '/';
      else if (pathname.startsWith(base)) pathname = `/${pathname.slice(base.length)}`;
    }
    if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');
    return pathname || '/';
  }

  private async handleLocation(source: 'initial' | 'push' | 'replace' | 'popstate'): Promise<void> {
    const sequence = ++this.navigationSequence;
    const route = currentAppRoute();

    try {
      this.cleanup?.();
      this.cleanup = undefined;
      const result = await this.renderPage(route);
      if (sequence !== this.navigationSequence) {
        result?.cleanup?.();
        return;
      }
      this.cleanup = result?.cleanup;
    } catch (error) {
      console.error('Falha ao renderizar a rota.', error);
      throw error;
    }

    document.documentElement.classList.remove('is-navigating');
    document.documentElement.classList.add('is-ready');

    if (route.hash) {
      scrollToTarget(route.hash, false);
    } else if (source === 'popstate') {
      const scrollY = Number(window.history.state?.scrollY ?? 0);
      requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'auto' }));
    } else if (source !== 'initial') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    if (source !== 'initial') {
      const main = document.getElementById('conteudo');
      main?.focus({ preventScroll: true });
    }

    window.dispatchEvent(new CustomEvent<AppRoute>('app:route-changed', { detail: route }));
  }

  navigate(to: string, options: NavigationOptions = {}): void {
    const target = to.startsWith('/') ? to : `/${to}`;
    const url = new URL(withBase(target), window.location.origin);

    if (options.replace) {
      window.history.replaceState(
        { ...window.history.state, scrollY: options.preserveScroll ? window.scrollY : 0 },
        '',
        url,
      );
    } else {
      window.history.replaceState({ ...window.history.state, scrollY: window.scrollY }, '', window.location.href);
      window.history.pushState({ scrollY: 0, at: Date.now() }, '', url);
    }

    document.documentElement.classList.add('is-navigating');
    void this.handleLocation(options.replace ? 'replace' : 'push');
  }

  replaceQuery(updates: Record<string, string | null>, options: { hash?: string | null } = {}): void {
    const url = new URL(window.location.href);

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }

    if (options.hash !== undefined) {
      url.hash = options.hash ?? '';
    }

    window.history.replaceState({ ...window.history.state, scrollY: window.scrollY }, '', url);
  }
}

/** Utilitário utilizado pelas páginas para links com a base correta do deploy. */
export function appUrl(path: string): string {
  return withBase(path);
}
