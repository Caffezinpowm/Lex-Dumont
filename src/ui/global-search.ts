import type { SearchIndex, SearchResponse } from '../data/search';
import type { LawDataService } from '../data/data-service';
import { escapeHtml, levelStyle } from '../lib/utils';
import { appUrl } from '../lib/router';
import { icon } from './icons';

interface FlatOption {
  id: string;
  element: HTMLAnchorElement;
}

/**
 * Busca global da topbar.
 * - atalhos "/" e Ctrl/Cmd+K;
 * - resultados agrupados e navegáveis por teclado;
 * - combobox/listbox com atributos ARIA e anúncio de contagem.
 */
export class GlobalSearch {
  private readonly input: HTMLInputElement;
  private readonly panel: HTMLElement;
  private readonly results: HTMLElement;
  private readonly status: HTMLElement;
  private readonly field: HTMLElement;
  private readonly clearButton: HTMLButtonElement;
  private readonly shortcut: HTMLElement;
  private readonly scrim: HTMLElement;
  private readonly controller = new AbortController();
  private options: FlatOption[] = [];
  private activeIndex = -1;
  private open = false;

  constructor(
    private readonly data: LawDataService,
    private readonly searchIndex: SearchIndex,
  ) {
    const input = document.getElementById('busca-global');
    const panel = document.getElementById('search-panel');
    const results = document.getElementById('search-results');
    const status = document.getElementById('search-status');
    const field = document.getElementById('search-field');
    const clearButton = document.getElementById('search-clear');
    const shortcut = document.getElementById('search-shortcut');
    const scrim = document.getElementById('search-scrim');

    if (
      !(input instanceof HTMLInputElement) ||
      !(panel instanceof HTMLElement) ||
      !(results instanceof HTMLElement) ||
      !(status instanceof HTMLElement) ||
      !(field instanceof HTMLElement) ||
      !(clearButton instanceof HTMLButtonElement) ||
      !(shortcut instanceof HTMLElement) ||
      !(scrim instanceof HTMLElement)
    ) {
      throw new Error('A estrutura da busca global não foi encontrada no layout.');
    }

    this.input = input;
    this.panel = panel;
    this.results = results;
    this.status = status;
    this.field = field;
    this.clearButton = clearButton;
    this.shortcut = shortcut;
    this.scrim = scrim;

    this.bindEvents();
    this.attachEmptyStateHandler();
    this.renderIdle();
  }

  private bindEvents(): void {
    const signal = this.controller.signal;

    this.field.addEventListener(
      'focusin',
      () => {
        this.openPanel();
      },
      { signal },
    );

    this.input.addEventListener(
      'input',
      () => {
        this.clearButton.hidden = !this.input.value;
        this.openPanel();
        this.updateResults();
      },
      { signal },
    );

    this.input.addEventListener(
      'keydown',
      (event) => this.handleInputKeydown(event),
      { signal },
    );

    this.input.addEventListener(
      'search',
      () => {
        this.clearButton.hidden = !this.input.value;
        this.updateResults();
      },
      { signal },
    );

    this.clearButton.addEventListener(
      'click',
      () => {
        this.input.value = '';
        this.clearButton.hidden = true;
        this.input.focus();
        this.openPanel();
        this.renderIdle();
      },
      { signal },
    );

    this.scrim.addEventListener(
      'click',
      () => {
        this.closePanel();
        this.input.blur();
      },
      { signal },
    );

    this.results.addEventListener(
      'pointerover',
      (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const option = target.closest<HTMLAnchorElement>('[role="option"]');
        if (!option) return;
        const index = this.options.findIndex((item) => item.element === option);
        if (index >= 0 && index !== this.activeIndex) this.setActive(index, false);
      },
      { signal },
    );

    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!this.open) return;
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (this.field.contains(target) || this.panel.contains(target)) return;
        this.closePanel();
      },
      { signal },
    );

    document.addEventListener(
      'focusin',
      (event) => {
        if (!this.open) return;
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (this.field.contains(target) || this.panel.contains(target)) return;
        this.closePanel();
      },
      { signal },
    );

    document.addEventListener(
      'keydown',
      (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          this.input.focus();
          this.input.select();
          this.openPanel();
          return;
        }

        if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;

        const target = event.target;
        if (
          target instanceof HTMLElement &&
          (target.isContentEditable ||
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
        ) {
          return;
        }

        event.preventDefault();
        this.input.focus();
        this.openPanel();
      },
      { signal },
    );

    window.addEventListener(
      'app:route-changed',
      () => {
        this.closePanel({ clear: true });
        this.syncShortcutLabel();
      },
      { signal },
    );

    window.addEventListener(
      'resize',
      () => {
        document.body.classList.toggle('search-open', this.open && window.matchMedia('(max-width: 720px)').matches);
        this.syncShortcutLabel();
      },
      { signal },
    );

    this.syncShortcutLabel();
  }

  private syncShortcutLabel(): void {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
    this.shortcut.textContent = isMac ? '⌘ K' : 'Ctrl K';
  }

  private handleInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (!this.open) return;
      event.preventDefault();
      this.closePanel();
      this.input.blur();
      return;
    }

    if (event.key === 'Tab') {
      this.closePanel();
      return;
    }

    if (!this.open) this.openPanel();

    if (event.key === 'ArrowDown') {
      if (this.options.length === 0) return;
      event.preventDefault();
      this.setActive(this.activeIndex < 0 ? 0 : (this.activeIndex + 1) % this.options.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      if (this.options.length === 0) return;
      event.preventDefault();
      this.setActive(
        this.activeIndex <= 0 ? this.options.length - 1 : this.activeIndex - 1,
      );
      return;
    }

    if (event.key === 'Home' && this.options.length > 0) {
      event.preventDefault();
      this.setActive(0);
      return;
    }

    if (event.key === 'End' && this.options.length > 0) {
      event.preventDefault();
      this.setActive(this.options.length - 1);
      return;
    }

    if (event.key === 'Enter') {
      const option = this.options[this.activeIndex] ?? this.options[0];
      if (!option) return;
      event.preventDefault();
      option.element.click();
    }
  }

  private openPanel(): void {
    if (this.open) return;
    this.open = true;
    this.panel.hidden = false;
    this.scrim.hidden = false;
    this.input.setAttribute('aria-expanded', 'true');
    document.body.classList.toggle('search-open', window.matchMedia('(max-width: 720px)').matches);
    this.clearButton.hidden = !this.input.value;

    // Ao reabrir depois de Escape, a consulta continua no campo e os
    // resultados precisam ser recriados para restaurar a navegação por teclado.
    if (this.input.value.trim()) this.updateResults();
    else this.renderIdle();
  }

  private closePanel(options: { clear?: boolean } = {}): void {
    if (options.clear) {
      this.input.value = '';
      this.clearButton.hidden = true;
    }

    if (!this.open) return;
    this.open = false;
    this.panel.hidden = true;
    this.scrim.hidden = true;
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-activedescendant');
    document.body.classList.remove('search-open');
    this.options = [];
    this.activeIndex = -1;
  }

  private currentQuery(): string {
    return this.input.value.trim();
  }

  private updateResults(): void {
    const query = this.currentQuery();

    if (!query) {
      this.renderIdle();
      this.status.textContent = 'Digite para buscar em toda a Lei Espacial.';
      return;
    }

    if (query.length < 2) {
      this.renderHint(
        'Digite mais um caractere',
        'A busca precisa de pelo menos dois caracteres. Você também pode usar um código, como 3-03 ou M-04.',
      );
      this.status.textContent = 'A busca precisa de pelo menos dois caracteres.';
      return;
    }

    const response = this.searchIndex.search(query);

    if (response.total === 0) {
      this.options = [];
      this.activeIndex = -1;
      this.input.removeAttribute('aria-activedescendant');
      this.results.innerHTML = this.emptyResultsHtml(query);
      this.status.textContent = `Nenhum resultado para ${query}.`;
      return;
    }

    this.options = [];
    this.activeIndex = -1;
    this.results.innerHTML = response.groups.map((group) => this.groupHtml(group, response)).join('');
    this.options = Array.from(this.results.querySelectorAll<HTMLAnchorElement>('[role="option"]')).map((element) => ({
      id: element.id,
      element,
    }));

    if (this.options.length > 0) this.setActive(0, false);

    const elapsed = Math.max(1, Math.round(response.elapsedMs));
    this.status.textContent = `${response.total} ${
      response.total === 1 ? 'resultado encontrado' : 'resultados encontrados'
    } em ${elapsed} ms.`;
  }

  private groupHtml(group: SearchResponse['groups'][number], response: SearchResponse): string {
    const groupId = `search-group-${group.kind}`;
    const items = group.items
      .map((hit, indexWithinGroup) => {
        const index = this.flatIndexBefore(group, indexWithinGroup, response);
        return this.resultHtml(hit, index);
      })
      .join('');

    return `<section class="search-group" role="group" aria-labelledby="${groupId}">
      <div class="search-group__heading" id="${groupId}">
        <span>${escapeHtml(group.label)}</span>
        <span class="search-group__count">${group.total}</span>
      </div>
      <div class="search-group__items">${items}</div>
    </section>`;
  }

  private flatIndexBefore(
    group: SearchResponse['groups'][number],
    indexWithinGroup: number,
    response: SearchResponse,
  ): number {
    const groupIndex = response.groups.indexOf(group);
    let count = 0;
    for (let index = 0; index < groupIndex; index += 1) {
      count += response.groups[index]?.items.length ?? 0;
    }
    return count + indexWithinGroup;
  }

  private resultHtml(hit: SearchResponse['groups'][number]['items'][number], index: number): string {
    const record = hit.record;
    const meta = this.resultMeta(record);
    const levelDot =
      record.levelColor && record.levelName
        ? `<span class="search-result__level" style="${levelStyle(record.levelColor)}">${escapeHtml(record.levelCode ?? '')} · ${escapeHtml(record.levelName)}</span>`
        : '';

    return `<a
      class="search-result"
      id="search-option-${index}"
      role="option"
      aria-selected="false"
      tabindex="-1"
      href="${appUrl(record.route)}"
      data-search-kind="${record.kind}"
    >
      <span class="search-result__rail" aria-hidden="true"></span>
      <span class="search-result__content">
        <span class="search-result__topline">
          <span class="search-result__code">${escapeHtml(record.code)}</span>
          ${levelDot}
          ${meta}
        </span>
        <span class="search-result__title">${hit.titleHtml}</span>
        <span class="search-result__snippet">${hit.snippetHtml}</span>
      </span>
      ${icon('arrow-up-right', { size: 16, className: 'search-result__arrow' })}
    </a>`;
  }

  private resultMeta(record: SearchResponse['groups'][number]['items'][number]['record']): string {
    // O nível já aparece como selo ao lado do código; para crimes, o
    // complemento útil é apenas a série do guia rápido.
    const label = record.kind === 'crime' ? (record.series ?? '') : record.extra;
    return label ? `<span class="search-result__meta">${escapeHtml(label)}</span>` : '';
  }

  private setActive(index: number, scroll = true): void {
    this.activeIndex = index;
    for (const [optionIndex, option] of this.options.entries()) {
      const active = optionIndex === index;
      option.element.classList.toggle('is-active', active);
      option.element.setAttribute('aria-selected', String(active));
    }

    const active = this.options[index]?.element;
    if (!active) {
      this.input.removeAttribute('aria-activedescendant');
      return;
    }

    this.input.setAttribute('aria-activedescendant', active.id);
    if (scroll) {
      active.scrollIntoView({ block: 'nearest' });
    }
  }

  private renderIdle(): void {
    const counts = {
      crimes: this.data.crimes.length,
      modifiers: this.data.modificadores.length,
      codex: this.data.verbetes.length,
      docs: this.data.documentos.length,
    };

    const suggestions = this.searchIndex.suggestions
      .map(
        (suggestion) => `<a class="search-suggestion" href="${appUrl(suggestion.route)}">
          <span class="search-suggestion__code">${escapeHtml(suggestion.code)}</span>
          <span class="search-suggestion__title">${escapeHtml(suggestion.title)}</span>
          ${icon('arrow-right', { size: 15 })}
        </a>`,
      )
      .join('');

    this.options = [];
    this.activeIndex = -1;
    this.input.removeAttribute('aria-activedescendant');
    this.results.innerHTML = `<div class="search-idle">
      <div class="search-idle__intro">
        <span class="search-idle__icon" aria-hidden="true">${icon('orbit', { size: 30 })}</span>
        <div>
          <p class="eyebrow">Busca global</p>
          <h2>Encontre a lei em segundos.</h2>
          <p>Pesquise por nome, texto, OOC ou código. Acentos e maiúsculas não importam.</p>
        </div>
      </div>
      <div class="search-idle__suggestions">
        <p class="search-idle__label">Tente começar por</p>
        ${suggestions}
      </div>
      <div class="search-idle__coverage">
        <span>${counts.crimes} crimes</span>
        <span>${counts.modifiers} modificadores</span>
        <span>${counts.codex} verbetes</span>
        <span>${counts.docs} documentos</span>
      </div>
    </div>`;
    this.status.textContent = 'Busca pronta. Digite um crime, código ou documento.';
  }

  private renderHint(title: string, description: string): void {
    this.options = [];
    this.activeIndex = -1;
    this.input.removeAttribute('aria-activedescendant');
    this.results.innerHTML = `<div class="search-hint">
      <span class="search-hint__icon" aria-hidden="true">${icon('search', { size: 24 })}</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(description)}</p>
      <div class="search-hint__codes" aria-label="Exemplos de códigos">
        <button type="button" data-search-example="3-03">3-03</button>
        <button type="button" data-search-example="0-01">0-01</button>
        <button type="button" data-search-example="M-04">M-04</button>
      </div>
    </div>`;
    this.results.querySelectorAll<HTMLButtonElement>('[data-search-example]').forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          this.input.value = button.dataset.searchExample ?? '';
          this.clearButton.hidden = false;
          this.input.focus();
          this.updateResults();
        },
        { signal: this.controller.signal },
      );
    });
  }

  private emptyResultsHtml(query: string): string {
    const suggestions = this.searchIndex.suggestions
      .slice(0, 3)
      .map(
        (suggestion) => `<a class="search-suggestion" href="${appUrl(suggestion.route)}">
          <span class="search-suggestion__code">${escapeHtml(suggestion.code)}</span>
          <span class="search-suggestion__title">${escapeHtml(suggestion.title)}</span>
          ${icon('arrow-right', { size: 15 })}
        </a>`,
      )
      .join('');

    return `<div class="search-empty">
      <span class="search-empty__icon" aria-hidden="true">${icon('search', { size: 28 })}</span>
      <h2>Nenhum resultado para <span>“${escapeHtml(query)}”</span></h2>
      <p>Tente o código do crime (3-03), um termo mais curto, sem acentos ou com a grafia aproximada.</p>
      <div class="search-empty__examples">
        <span>Exemplos:</span>
        ${suggestions}
      </div>
      <button class="btn btn--ghost btn--small" type="button" data-search-clear-empty>Limpar busca</button>
    </div>`;
  }

  /** Permite que o clique no botão de limpar do estado vazio funcione. */
  public attachEmptyStateHandler(): void {
    this.results.addEventListener(
      'click',
      (event) => {
        const target = event.target;
        if (!(target instanceof Element) || !target.closest('[data-search-clear-empty]')) return;
        this.input.value = '';
        this.clearButton.hidden = true;
        this.input.focus();
        this.renderIdle();
      },
      { signal: this.controller.signal },
    );
  }

  close(): void {
    this.closePanel();
  }

  destroy(): void {
    this.controller.abort();
  }
}
