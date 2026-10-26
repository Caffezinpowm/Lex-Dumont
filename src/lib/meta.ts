interface PageMeta {
  title: string;
  description?: string;
}

const SITE_NAME = 'Lei Espacial · Dumont Station';
const DEFAULT_DESCRIPTION =
  'Consulta rápida e pesquisável da Lei Espacial da Dumont Station: crimes, penas, modificadores, julgamentos e código espacial.';

export function setPageMeta({ title, description }: PageMeta): void {
  document.title = title === SITE_NAME ? SITE_NAME : `${title} · ${SITE_NAME}`;

  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.append(meta);
  }
  meta.content = description ?? DEFAULT_DESCRIPTION;

  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.append(canonical);
  }

  // O caminho do navegador já contém a base do deploy. Não aplicar withBase
  // de novo, ou uma publicação em /space-law/ geraria /space-law/space-law/…
  const current = new URL(window.location.pathname + window.location.search, window.location.origin);
  canonical.href = current.href;
}
