import type { IndexedCrime, Nivel } from '../types';
import { escapeAttr, escapeHtml, levelStyle, truncate } from '../lib/utils';
import { appUrl } from '../lib/router';
import { isFavorite } from '../lib/favorites';
import { icon } from './icons';

export function levelBadge(nivel: Nivel, compact = false): string {
  const label = compact ? nivel.codigo : `${nivel.codigo} · ${nivel.nome}`;
  return `<span class="level-badge${compact ? ' level-badge--compact' : ''}" style="${levelStyle(nivel.cor)}" title="${escapeAttr(
    `${nivel.codigo} · ${nivel.nome}`,
  )}">${escapeHtml(label)}</span>`;
}

export function favoriteButton(
  crime: Pick<IndexedCrime, 'codigo' | 'nome'>,
  options: { withLabel?: boolean; small?: boolean; className?: string } = {},
): string {
  const active = isFavorite(crime.codigo);
  const label = active ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  const visibleLabel = active ? 'Favoritado' : 'Favoritar';
  const ariaLabel = options.withLabel
    ? `${visibleLabel} — ${label}: ${crime.nome}`
    : `${label}: ${crime.nome}`;
  const classes = [
    'favorite-button',
    options.small ? 'favorite-button--small' : '',
    active ? 'is-favorite' : '',
    options.className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return `<button type="button" class="${classes}" data-favorite-code="${escapeAttr(crime.codigo)}" data-favorite-name="${escapeAttr(
    crime.nome,
  )}" aria-pressed="${active}" aria-label="${escapeAttr(ariaLabel)}" title="${escapeAttr(label)}">
    <span data-fav-icon>${icon(active ? 'star-filled' : 'star', { size: options.small ? 17 : 19 })}</span>
    ${options.withLabel ? `<span class="favorite-button__label" data-fav-label>${visibleLabel}</span>` : ''}
  </button>`;
}

export function penaltySummary(nivel: Nivel): string {
  return `<div class="penalty-summary">
    <div class="penalty-summary__item">
      <span class="penalty-summary__label">Pena mínima</span>
      <span class="penalty-summary__value">${escapeHtml(nivel.pena_minima)}</span>
    </div>
    <span class="penalty-summary__divider" aria-hidden="true"></span>
    <div class="penalty-summary__item">
      <span class="penalty-summary__label">Pena máxima</span>
      <span class="penalty-summary__value">${escapeHtml(nivel.pena_maxima)}</span>
    </div>
  </div>`;
}

export function crimeCard(crime: IndexedCrime, options: { description?: boolean } = {}): string {
  const description = options.description ?? true;

  return `<article class="crime-card" style="${levelStyle(crime.nivel.cor)}">
    <span class="crime-card__accent" aria-hidden="true"></span>
    <div class="crime-card__body">
      <div class="crime-card__topline">
        <span class="mono-code">${escapeHtml(crime.codigo)}</span>
        ${levelBadge(crime.nivel)}
        ${favoriteButton(crime, { small: true, className: 'crime-card__favorite' })}
      </div>
      <h3 class="crime-card__title"><a href="${appUrl(`/crimes/${encodeURIComponent(crime.codigo)}`)}">${escapeHtml(crime.nome)}</a></h3>
      ${description ? `<p class="crime-card__description">${escapeHtml(truncate(crime.descricao, 176))}</p>` : ''}
      <div class="crime-card__penalty">
        <span class="crime-card__penalty-label">Pena</span>
        <span class="crime-card__penalty-min">${escapeHtml(crime.nivel.pena_minima)}</span>
        <span class="crime-card__penalty-arrow" aria-hidden="true">→</span>
        <span class="crime-card__penalty-max">${escapeHtml(crime.nivel.pena_maxima)}</span>
      </div>
    </div>
  </article>`;
}

export function breadcrumbs(items: Array<{ label: string; href?: string }>, options: { compact?: boolean } = {}): string {
  const content = items
    .map((item, index) => {
      const isLast = index === items.length - 1;
      const separator = index > 0 ? `<span class="breadcrumbs__sep" aria-hidden="true">/</span>` : '';
      const node =
        item.href && !isLast
          ? `<a href="${appUrl(item.href)}">${escapeHtml(item.label)}</a>`
          : `<span ${isLast ? 'aria-current="page"' : ''}>${escapeHtml(item.label)}</span>`;
      return `${separator}${node}`;
    })
    .join('');

  return `<nav class="breadcrumbs${options.compact ? ' breadcrumbs--compact' : ''}" aria-label="Você está aqui">${content}</nav>`;
}

export function sectionHeading(eyebrow: string, title: string, action?: string): string {
  return `<div class="section-heading">
    <div>
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
      <h2>${escapeHtml(title)}</h2>
    </div>
    ${action ?? ''}
  </div>`;
}

export function emptyState(options: {
  title: string;
  description: string;
  iconName?: Parameters<typeof icon>[0];
  action?: string;
}): string {
  return `<div class="empty-state">
    <span class="empty-state__icon" aria-hidden="true">${icon(options.iconName ?? 'search', { size: 26 })}</span>
    <h2>${escapeHtml(options.title)}</h2>
    <p>${escapeHtml(options.description)}</p>
    ${options.action ?? ''}
  </div>`;
}

export function externalLink(url: string, label: string, className = ''): string {
  return `<a class="${escapeAttr(className)}" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
    label,
  )}${icon('external-link', { size: 14 })}</a>`;
}

export function copyButton(options: {
  text: string;
  label?: string;
  ariaLabel?: string;
  successMessage?: string;
  small?: boolean;
  quiet?: boolean;
  iconName?: Parameters<typeof icon>[0];
}): string {
  const classes = ['btn', options.small === false ? '' : 'btn--small', options.quiet === false ? 'btn--primary' : 'btn--quiet', 'copy-button']
    .filter(Boolean)
    .join(' ');
  const label = options.label ?? 'Copiar';

  return `<button class="${classes}" type="button" data-copy-text="${escapeAttr(options.text)}" data-copy-success="${escapeAttr(
    options.successMessage ?? 'Copiado para a área de transferência.',
  )}" aria-label="${escapeAttr(options.ariaLabel ?? label)}">
    <span data-copy-icon aria-hidden="true">${icon(options.iconName ?? 'copy', { size: 16 })}</span>
    <span data-copy-label>${escapeHtml(label)}</span>
  </button>`;
}

export interface PrevNextItem {
  label: string;
  href: string;
  meta?: string;
}

/** Navegação anterior/próxima compartilhada por crimes, verbetes e documentos. */
export function prevNextNav(previous?: PrevNextItem, next?: PrevNextItem): string {
  const item = (entry: PrevNextItem | undefined, direction: 'previous' | 'next'): string => {
    if (!entry) return '<span class="prev-next__spacer" aria-hidden="true"></span>';
    const isPrevious = direction === 'previous';
    return `<a class="prev-next__link prev-next__link--${direction}" href="${appUrl(entry.href)}">
      ${
        isPrevious
          ? `<span class="prev-next__icon" aria-hidden="true">${icon('arrow-left', { size: 18 })}</span>`
          : ''
      }
      <span class="prev-next__text">
        <span class="prev-next__label">${isPrevious ? 'Anterior' : 'Próximo'}</span>
        <span class="prev-next__title">${escapeHtml(entry.label)}</span>
        ${entry.meta ? `<span class="prev-next__meta">${escapeHtml(entry.meta)}</span>` : ''}
      </span>
      ${
        isPrevious
          ? ''
          : `<span class="prev-next__icon" aria-hidden="true">${icon('arrow-right', { size: 18 })}</span>`
      }
    </a>`;
  };

  return `<nav class="prev-next" aria-label="Navegação entre páginas">
    ${item(previous, 'previous')}
    ${item(next, 'next')}
  </nav>`;
}

export function tag(label: string, tone: 'neutral' | 'accent' = 'neutral'): string {
  return `<span class="tag tag--${tone}">${escapeHtml(label)}</span>`;
}

