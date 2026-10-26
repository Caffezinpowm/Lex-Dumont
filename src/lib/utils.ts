/** Utilitários puros compartilhados pelas páginas e componentes. */

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] ?? char);
}

export function escapeAttr(value: unknown): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

/** Minúsculas, sem acentos e com espaços normalizados. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalização mais agressiva para comparação de nomes e códigos. */
export function normalizeKey(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Código de busca: "M-04", "m 04" e "m04" viram "m04". */
export function normalizeCode(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]/g, '');
}

export function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function isValidHexColor(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim());
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Rgb {
  let source = hex.replace('#', '').trim();
  if (source.length === 3) {
    source = source
      .split('')
      .map((char) => char + char)
      .join('');
  }
  if (source.length === 8) source = source.slice(0, 6);
  const parsed = Number.parseInt(source, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function channelLuminance(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb: Rgb): number {
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

function contrast(a: Rgb, b: Rgb): number {
  const brightest = Math.max(luminance(a), luminance(b));
  const darkest = Math.min(luminance(a), luminance(b));
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Escolhe preto ou branco para texto sobre a cor do nível.
 * A cor do JSON é sempre usada como fundo, nunca como texto de baixo contraste.
 */
export function readableInk(hex: string): string {
  const safeHex = isValidHexColor(hex) ? hex : '#5eead4';
  const background = hexToRgb(safeHex);
  const darkInk = { r: 5, g: 18, b: 22 };
  const lightInk = { r: 255, g: 255, b: 255 };
  return contrast(background, darkInk) >= contrast(background, lightInk) ? '#041114' : '#ffffff';
}

export function levelStyle(color: string): string {
  const safeColor = isValidHexColor(color) ? color : '#5eead4';
  // O texto usa uma mistura da cor do nível com a cor de texto do tema. Isso
  // preserva a identidade visual sem deixar códigos vermelhos abaixo de 4,5:1.
  return `--level:${safeColor};--level-ink:${readableInk(safeColor)};--level-text:${safeColor};--level-text:color-mix(in srgb, ${safeColor} 40%, var(--text))`;
}

export function truncate(value: string, maxLength: number): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

/**
 * Converte texto simples em parágrafos seguros. Quebras de linha simples
 * (comuns no JSON por causa da largura do arquivo) viram espaço; linhas em
 * branco separam parágrafos.
 */
export function textToParagraphs(value: string): string {
  const blocks = String(value ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  return blocks.map((block) => `<p>${escapeHtml(block)}</p>`).join('');
}

export function formatMinutes(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes * 10) / 10);
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(rounded)} min`;
}

export function plainTextFromMarkdown(markdown: string): string {
  return markdown
    .replace(/<Box>/gi, '')
    .replace(/<\/Box>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^[ \t]*[-*+]\s+/gm, '')
    .replace(/^[ \t]*\d+\.\s+/gm, '')
    .replace(/^[ \t]*>\s?/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function firstParagraph(markdown: string): string {
  // Títulos viram metadados da página e não devem se fundir ao primeiro
  // parágrafo. Remove todas as linhas de título antes de extrair o resumo;
  // isso também cobre títulos colados ao texto por uma única quebra de linha.
  const withoutHeadings = markdown
    .replace(/<Box>/gi, '')
    .replace(/<\/Box>/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/^[ \t]*#{1,6}[ \t]+.*(?:\n|$)/gm, '\n\n')
    .replace(/\n{3,}/g, '\n\n');

  const paragraphs = withoutHeadings
    .split(/\n\s*\n/)
    .map((part) => plainTextFromMarkdown(part))
    .filter(Boolean);

  return truncate(
    paragraphs.find((part) => !/^[A-ZÀ-Ú0-9 -]{1,40}$/.test(part)) ?? paragraphs[0] ?? '',
    180,
  );
}

export function readingTime(markdown: string): string {
  const words = plainTextFromMarkdown(markdown).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min de leitura`;
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function debounce<T extends (...args: never[]) => void>(callback: T, wait = 120): T {
  let timer: number | undefined;
  return ((...args: Parameters<T>) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), wait);
  }) as T;
}

export function nextFrame(callback: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

export function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('hidden') && element.offsetParent !== null);
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/** Lê um parâmetro da URL sem quebrar em ambientes restritos. */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`.replace(/\/{2,}/g, '/');
}
