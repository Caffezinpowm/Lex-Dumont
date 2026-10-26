export type IconName =
  | 'search'
  | 'menu'
  | 'close'
  | 'sun'
  | 'moon'
  | 'star'
  | 'star-filled'
  | 'arrow-up'
  | 'arrow-up-right'
  | 'arrow-right'
  | 'arrow-left'
  | 'chevron-down'
  | 'chevron-right'
  | 'copy'
  | 'check'
  | 'link'
  | 'book'
  | 'book-open'
  | 'scale'
  | 'list'
  | 'grid'
  | 'sliders'
  | 'file-text'
  | 'home'
  | 'shield'
  | 'alert-triangle'
  | 'info'
  | 'external-link'
  | 'clock'
  | 'layers'
  | 'gavel'
  | 'orbit'
  | 'trash';

/**
 * Ícones SVG inline (traço 1.8, viewBox 24), sem dependências externas.
 * Os caminhos são estáticos e seguros; nada aqui vem do JSON.
 */
const PATHS: Record<IconName, string> = {
  search:
    '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2"></path>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"></path>',
  close: '<path d="m6 6 12 12M18 6 6 18"></path>',
  sun:
    '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"></path>',
  moon: '<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"></path>',
  star:
    '<path d="m12 3 2.75 5.57 6.15.9-4.45 4.33 1.05 6.12L12 17l-5.5 2.92 1.05-6.12L3.1 9.47l6.15-.9L12 3Z"></path>',
  'star-filled':
    '<path d="m12 3 2.75 5.57 6.15.9-4.45 4.33 1.05 6.12L12 17l-5.5 2.92 1.05-6.12L3.1 9.47l6.15-.9L12 3Z" fill="currentColor" stroke="none"></path>',
  'arrow-up': '<path d="m18 15-6-6-6 6"></path>',
  'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"></path>',
  'arrow-right': '<path d="M5 12h14m-6-6 6 6-6 6"></path>',
  'arrow-left': '<path d="M19 12H5m6 6-6-6 6-6"></path>',
  'chevron-down': '<path d="m6 9 6 6 6-6"></path>',
  'chevron-right': '<path d="m9 6 6 6-6 6"></path>',
  copy:
    '<rect width="13" height="13" x="8" y="8" rx="2"></rect><path d="M4 16V6a2 2 0 0 1 2-2h10"></path>',
  check: '<path d="m5 12 4 4L19 6"></path>',
  link:
    '<path d="M10 13a5 5 0 0 0 7.07 0l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15"></path><path d="M14 11a5 5 0 0 0-7.07 0l-2 2A5 5 0 0 0 12 20.07l1.15-1.15"></path>',
  book:
    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"></path>',
  'book-open':
    '<path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H9a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3H2Z"></path><path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H15a3 3 0 0 0-3 3v15a3 3 0 0 1 3-3h7Z"></path>',
  scale:
    '<path d="M12 3v18M8 21h8M5 6h14M6 6l-3 7h6L6 6ZM18 6l-3 7h6l-3-7Z"></path>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>',
  grid:
    '<rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect>',
  sliders:
    '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"></path>',
  'file-text':
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6M8 13h8M8 17h6"></path>',
  home: '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-3v-7H8v7H5a2 2 0 0 1-2-2Z"></path>',
  shield:
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path><path d="m9 12 2 2 4-4"></path>',
  'alert-triangle':
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4M12 17h.01"></path>',
  info: '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 8h.01"></path>',
  'external-link': '<path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"></path>',
  clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
  layers:
    '<path d="m12 2 9 5-9 5-9-5 9-5Z"></path><path d="m3 12 9 5 9-5M3 17l9 5 9-5"></path>',
  gavel:
    '<path d="m14 13-8.5 8.5a2.1 2.1 0 0 1-3-3L11 10M5.5 5.5l5-5M9 2l7 7M12.5 8.5l5-5M3 21h10"></path>',
  orbit:
    '<circle cx="12" cy="12" r="3"></circle><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-30 12 12)"></ellipse><circle cx="20" cy="7" r="1" fill="currentColor" stroke="none"></circle>',
  trash:
    '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"></path>',
};

interface IconOptions {
  size?: number;
  className?: string;
}

export function icon(name: IconName, options: IconOptions = {}): string {
  const size = options.size ?? 20;
  const className = options.className ? ` class="${options.className}"` : '';
  return `<svg${className} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS[name]}</svg>`;
}

export function brandMark(): string {
  return `<span class="brand-mark" aria-hidden="true">
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="12.25" stroke="currentColor" stroke-width="1.5"/>
      <ellipse cx="20" cy="20" rx="18" ry="6.5" stroke="currentColor" stroke-opacity=".42" stroke-width="1.2" transform="rotate(-28 20 20)"/>
      <circle cx="20" cy="20" r="3.2" fill="currentColor"/>
      <circle cx="34.2" cy="12.7" r="1.7" fill="currentColor"/>
    </svg>
  </span>`;
}
