import type { PageContext } from './context';
import type { PageRenderResult } from '../lib/router';
import { appUrl } from '../lib/router';
import { escapeAttr, escapeHtml, normalizeText, plural, truncate } from '../lib/utils';
import { setPageMeta } from '../lib/meta';
import { renderMarkdown } from '../lib/markdown';
import { breadcrumbs } from '../ui/components';
import { icon } from '../ui/icons';

interface ModifierCardData {
  codigo: string;
  nome: string;
  descricao: string;
  modificacao: string;
}

function categoryOf(code: string): 'agravante' | 'atenuante' {
  return code.toUpperCase().startsWith('M') ? 'agravante' : 'atenuante';
}

function cleanDescription(value: string): string {
  return value
    .replace(/\n*#{1,6}\s*(?:Agravantes|Atenuantes)\s*$/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function modifierCard(item: ModifierCardData): string {
  const category = categoryOf(item.codigo);
  const description = cleanDescription(item.descricao);
  const filterText = normalizeText(
    `${item.codigo} ${item.nome} ${description} ${item.modificacao} ${category}`,
  );

  return `<article class="modifier-card modifier-card--${category}" id="mod-${escapeAttr(
    item.codigo.toLowerCase(),
  )}" data-modifier-card data-filter-text="${escapeAttr(filterText)}">
    <div class="modifier-card__top">
      <span class="modifier-card__code">${escapeHtml(item.codigo)}</span>
      <span class="modifier-card__kind">${category === 'agravante' ? 'Agravante' : 'Atenuante'}</span>
    </div>
    <h3><a href="${appUrl(`/modificadores/${encodeURIComponent(item.codigo.toLowerCase())}`)}">${escapeHtml(
      item.nome,
    )}</a></h3>
    <p class="modifier-card__description">${escapeHtml(truncate(description, 250))}</p>
    <div class="modifier-card__effect">
      <span>${icon('gavel', { size: 15 })} Efeito na pena</span>
      <p>${escapeHtml(item.modificacao)}</p>
    </div>
    <a class="modifier-card__action" href="${appUrl(
      `/modificadores/${encodeURIComponent(item.codigo.toLowerCase())}`,
    )}">Ver regra completa ${icon('arrow-right', { size: 15 })}</a>
  </article>`;
}

function manualRuleCheckbox(item: ModifierCardData): string {
  return `<label class="calc-check">
    <input type="checkbox" name="manual" value="${escapeAttr(item.codigo)}" />
    <span class="calc-check__box" aria-hidden="true"></span>
    <span class="calc-check__text">
      <span><strong>${escapeHtml(item.codigo)}</strong> ${escapeHtml(item.nome)}</span>
      <small>${escapeHtml(truncate(item.modificacao, 110))}</small>
    </span>
  </label>`;
}

export function renderModifiers(ctx: PageContext): PageRenderResult {
  const { data } = ctx;
  const introMarkdown = data.data.modificadores.introducao.replace(/^##\s+Agravantes\s*$/gim, '').trim();
  const intro = renderMarkdown(introMarkdown, { dropFirstHeading: true }).html;
  const manualRules = data.modificadores.filter((item) =>
    ['M-01', 'M-02', 'M-03', 'A-02', 'A-03', 'A-04', 'A-07', 'A-08', 'A-09'].includes(item.codigo),
  );

  setPageMeta({
    title: 'Modificadores',
    description:
      'Agravantes e atenuantes da Lei Espacial, com o efeito de cada regra na pena e uma conferência opcional de percentuais.',
  });

  ctx.pageRoot.innerHTML = `<div class="page modifiers-page">
    ${breadcrumbs([{ label: 'Início', href: '/' }, { label: 'Modificadores' }])}

    <header class="page-header page-header--split">
      <div>
        <p class="eyebrow">Circunstâncias da pena</p>
        <h1>Modificadores</h1>
        <p class="page-header__lead">Agravantes e atenuantes alteram a pena depois da tipificação. Consulte a redação exata de cada regra antes de aplicar.</p>
      </div>
      <div class="page-header__stamp">
        <span class="page-header__stamp-number">${data.modificadores.length}</span>
        <span>modificadores<br />${data.agravantes.length} M · ${data.atenuantes.length} A</span>
      </div>
    </header>

    <div class="modifier-intro prose prose--compact">${intro}</div>

    <div class="modifier-toolbar">
      <label class="input-with-icon modifier-filter" for="filtro-modificadores">
        <span class="input-with-icon__icon" aria-hidden="true">${icon('search', { size: 18 })}</span>
        <input id="filtro-modificadores" type="search" placeholder="Filtrar por nome, código ou efeito…" autocomplete="off" />
        <button class="input-clear" type="button" data-modifier-clear aria-label="Limpar filtro de modificadores" hidden>${icon(
          'close',
          { size: 16 },
        )}</button>
      </label>
      <div class="modifier-jump" role="group" aria-label="Ir para categoria">
        <a class="modifier-jump__link modifier-jump__link--agravante" href="#agravantes">${icon(
          'alert-triangle',
          { size: 15 },
        )} Agravantes <span>${data.agravantes.length}</span></a>
        <a class="modifier-jump__link modifier-jump__link--atenuante" href="#atenuantes">${icon(
          'shield',
          { size: 15 },
        )} Atenuantes <span>${data.atenuantes.length}</span></a>
        <a class="modifier-jump__link" href="#calculadora">${icon('sliders', { size: 15 })} Calculadora</a>
      </div>
    </div>

    <p class="filter-status" data-modifier-status aria-live="polite">${data.modificadores.length} ${plural(
      data.modificadores.length,
      'modificador exibido',
      'modificadores exibidos',
    )}.</p>

    <section class="modifier-section" id="agravantes" data-modifier-section aria-labelledby="agravantes-title">
      <div class="modifier-section__head modifier-section__head--agravante">
        <span class="modifier-section__icon" aria-hidden="true">${icon('alert-triangle', { size: 22 })}</span>
        <div>
          <p class="eyebrow">Aumentam a pena</p>
          <h2 id="agravantes-title">Agravantes <span>${data.agravantes.length}</span></h2>
        </div>
        <p>Aplicados quando a circunstância torna a conduta mais grave.</p>
      </div>
      <div class="modifier-grid">
        ${data.agravantes.map((item) => modifierCard(item)).join('')}
      </div>
    </section>

    <section class="modifier-section" id="atenuantes" data-modifier-section aria-labelledby="atenuantes-title">
      <div class="modifier-section__head modifier-section__head--atenuante">
        <span class="modifier-section__icon" aria-hidden="true">${icon('shield', { size: 22 })}</span>
        <div>
          <p class="eyebrow">Reduzem ou liberam</p>
          <h2 id="atenuantes-title">Atenuantes <span>${data.atenuantes.length}</span></h2>
        </div>
        <p>Circunstâncias que favorecem o autor ou reduzem a responsabilidade.</p>
      </div>
      <div class="modifier-grid">
        ${data.atenuantes.map((item) => modifierCard(item)).join('')}
      </div>
    </section>

    <section class="calculator-section" id="calculadora" aria-labelledby="calculadora-title">
      <div class="calculator-intro">
        <p class="eyebrow">Ferramenta opcional</p>
        <h2 id="calculadora-title">Conferência de pena</h2>
        <p>Some apenas os percentuais explícitos nas regras. A ferramenta não escolhe modificadores, não define ordem de aplicação e não substitui a decisão da Segurança, do Comando ou de um julgamento.</p>
      </div>

      <div class="calculator">
        <form class="calculator__form" id="calc-form" novalidate>
          <div class="calc-base">
            <label for="calc-base">Pena-base em minutos</label>
            <div class="calc-base__field">
              <input id="calc-base" name="base" type="number" min="0" max="999" step="1" value="10" inputmode="numeric" />
              <span>min</span>
            </div>
            <p>Use este campo somente quando a pena estiver expressa em minutos.</p>
          </div>

          <fieldset class="calc-group">
            <legend>${icon('alert-triangle', { size: 16 })} Agravantes com percentual</legend>

            <label class="calc-row" for="calc-m04">
              <span class="calc-row__name"><strong>M-04</strong> Reincidência</span>
              <select id="calc-m04" name="m04">
                <option value="0">Não aplicada</option>
                <option value="50">1ª reincidência · +50%</option>
                <option value="100">2ª reincidência · +100%</option>
                <option value="200">3ª reincidência · +200%</option>
              </select>
            </label>

            <label class="calc-row" for="calc-m05">
              <span class="calc-row__name"><strong>M-05</strong> Múltiplos crimes</span>
              <span class="calc-row__inline">
                <input id="calc-m05" name="m05" type="number" min="0" max="20" step="1" value="0" inputmode="numeric" aria-label="Crimes adicionais" />
                <span>crimes extras · +10% cada</span>
              </span>
            </label>

            <label class="calc-check calc-check--single">
              <input id="calc-m06" name="m06" type="checkbox" />
              <span class="calc-check__box" aria-hidden="true"></span>
              <span class="calc-check__text">
                <span><strong>M-06</strong> Figura de autoridade</span>
                <small>+50% na pena final e aviso à Central de Comando.</small>
              </span>
            </label>
          </fieldset>

          <fieldset class="calc-group">
            <legend>${icon('shield', { size: 16 })} Atenuantes com percentual</legend>

            <label class="calc-check calc-check--single">
              <input id="calc-a01" name="a01" type="checkbox" />
              <span class="calc-check__box" aria-hidden="true"></span>
              <span class="calc-check__text">
                <span><strong>A-01</strong> Cooperação</span>
                <small>Redução de 50% da pena.</small>
              </span>
            </label>

            <label class="calc-row" for="calc-a05">
              <span class="calc-row__name"><strong>A-05</strong> Acidente</span>
              <select id="calc-a05" name="a05">
                <option value="0">Não aplicado</option>
                <option value="25">Redução de 25%</option>
                <option value="50">Redução de 50%</option>
              </select>
            </label>

            <label class="calc-row" for="calc-a06">
              <span class="calc-row__name"><strong>A-06</strong> Arrependimento</span>
              <select id="calc-a06" name="a06">
                <option value="0">Não aplicado</option>
                <option value="25">Redução de 25%</option>
                <option value="50">Redução de 50%</option>
              </select>
            </label>
            <p class="calc-group__note">A-06 tem limite de 10 minutos de redução; o limite é aplicado no resultado.</p>
          </fieldset>

          <fieldset class="calc-group calc-group--manual">
            <legend>${icon('gavel', { size: 16 })} Regras que exigem decisão manual</legend>
            <p class="calc-group__intro">Marque as regras em análise. Elas aparecem no resumo, sem cálculo automático.</p>
            <div class="calc-manual-grid">
              ${manualRules.map((item) => manualRuleCheckbox(item)).join('')}
            </div>
          </fieldset>

          <div class="calc-actions">
            <button class="btn btn--ghost btn--small" type="reset" id="calc-reset">${icon('trash', {
              size: 15,
            })} Limpar</button>
            <span>${icon('info', { size: 14 })} Percentuais somados sobre a pena-base.</span>
          </div>
        </form>

        <aside class="calc-result" aria-labelledby="calc-result-title">
          <div class="calc-result__head">
            <span id="calc-result-title">Resultado da simulação</span>
            <span class="calc-result__badge">não oficial</span>
          </div>
          <p class="calc-result__value" id="calc-total" aria-live="polite">10 min</p>
          <p class="calc-result__caption" id="calc-caption">Nenhum percentual aplicado.</p>
          <ul class="calc-breakdown" id="calc-breakdown"></ul>
          <div class="calc-manual-result" id="calc-manual-result" hidden>
            <h3>Requer decisão manual</h3>
            <ul></ul>
          </div>
          <p class="calc-result__disclaimer">${icon('alert-triangle', {
            size: 16,
          })} Ferramenta de apoio. O texto oficial de cada modificador prevalece.</p>
          <button class="btn btn--primary btn--small" type="button" id="calc-copy" data-copy-text="Pena simulada: 10 min." data-copy-success="Resumo da conferência copiado.">
            <span data-copy-icon aria-hidden="true">${icon('copy', { size: 16 })}</span>
            <span data-copy-label>Copiar resumo</span>
          </button>
        </aside>
      </div>
    </section>

    <section class="modifier-cta" aria-labelledby="guia-mod-title">
      <div>
        <p class="eyebrow">Contexto</p>
        <h2 id="guia-mod-title">A pena também depende do nível</h2>
        <p>Veja a matriz de crimes e compare a mesma conduta entre os níveis de gravidade antes de aplicar modificadores.</p>
      </div>
      <a class="btn btn--ghost" href="${appUrl('/guia-rapido')}">${icon('grid', { size: 18 })} Abrir guia rápido</a>
    </section>
  </div>`;

  const controller = new AbortController();
  const { signal } = controller;

  const filterInput = ctx.pageRoot.querySelector<HTMLInputElement>('#filtro-modificadores');
  const clearFilter = ctx.pageRoot.querySelector<HTMLButtonElement>('[data-modifier-clear]');
  const status = ctx.pageRoot.querySelector<HTMLElement>('[data-modifier-status]');
  const cards = Array.from(ctx.pageRoot.querySelectorAll<HTMLElement>('[data-modifier-card]'));
  const sections = Array.from(ctx.pageRoot.querySelectorAll<HTMLElement>('[data-modifier-section]'));

  const applyFilter = (): void => {
    if (!filterInput || !status) return;
    const query = normalizeText(filterInput.value);
    let visible = 0;

    for (const card of cards) {
      const show = !query || (card.dataset.filterText ?? '').includes(query);
      card.hidden = !show;
      if (show) visible += 1;
    }

    for (const section of sections) {
      section.hidden = !Array.from(section.querySelectorAll<HTMLElement>('[data-modifier-card]')).some(
        (card) => !card.hidden,
      );
    }

    if (clearFilter) clearFilter.hidden = !filterInput.value;
    status.textContent = query
      ? `${visible} de ${cards.length} modificadores para “${filterInput.value.trim()}”.`
      : `${cards.length} modificadores exibidos.`;
  };

  filterInput?.addEventListener(
    'input',
    () => {
      applyFilter();
    },
    { signal },
  );

  clearFilter?.addEventListener(
    'click',
    () => {
      if (!filterInput) return;
      filterInput.value = '';
      applyFilter();
      filterInput.focus();
    },
    { signal },
  );

  const form = ctx.pageRoot.querySelector<HTMLFormElement>('#calc-form');
  const baseInput = ctx.pageRoot.querySelector<HTMLInputElement>('#calc-base');
  const m04 = ctx.pageRoot.querySelector<HTMLSelectElement>('#calc-m04');
  const m05 = ctx.pageRoot.querySelector<HTMLInputElement>('#calc-m05');
  const m06 = ctx.pageRoot.querySelector<HTMLInputElement>('#calc-m06');
  const a01 = ctx.pageRoot.querySelector<HTMLInputElement>('#calc-a01');
  const a05 = ctx.pageRoot.querySelector<HTMLSelectElement>('#calc-a05');
  const a06 = ctx.pageRoot.querySelector<HTMLSelectElement>('#calc-a06');
  const total = ctx.pageRoot.querySelector<HTMLElement>('#calc-total');
  const caption = ctx.pageRoot.querySelector<HTMLElement>('#calc-caption');
  const breakdown = ctx.pageRoot.querySelector<HTMLElement>('#calc-breakdown');
  const manualResult = ctx.pageRoot.querySelector<HTMLElement>('#calc-manual-result');
  const manualList = manualResult?.querySelector<HTMLUListElement>('ul');
  const copyResult = ctx.pageRoot.querySelector<HTMLButtonElement>('#calc-copy');

  const formatNumber = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

  const updateCalculator = (): void => {
    if (
      !form ||
      !baseInput ||
      !m04 ||
      !m05 ||
      !m06 ||
      !a01 ||
      !a05 ||
      !a06 ||
      !total ||
      !caption ||
      !breakdown ||
      !manualResult ||
      !manualList ||
      !copyResult
    ) {
      return;
    }

    const base = Math.max(0, Number.parseFloat(baseInput.value) || 0);
    const m04Value = Number.parseInt(m04.value, 10) || 0;
    const extraCrimes = Math.min(20, Math.max(0, Number.parseInt(m05.value, 10) || 0));
    const m05Value = extraCrimes * 10;
    const m06Value = m06.checked ? 50 : 0;
    const a01Value = a01.checked ? 50 : 0;
    const a05Value = Number.parseInt(a05.value, 10) || 0;
    const a06Value = Number.parseInt(a06.value, 10) || 0;

    const aggravating = m04Value + m05Value + m06Value;
    const attenuating = a01Value + a05Value;
    const a06Reduction = Math.min((base * a06Value) / 100, 10);
    const rawResult = base * (1 + aggravating / 100 - attenuating / 100) - a06Reduction;
    const result = Math.max(0, Math.round(rawResult * 10) / 10);

    const lines: string[] = [];
    if (m04Value > 0) lines.push(`<li><span>M-04 Reincidência</span><strong>+${m04Value}%</strong></li>`);
    if (m05Value > 0) {
      lines.push(
        `<li><span>M-05 Múltiplos crimes <small>${extraCrimes} extra${extraCrimes === 1 ? '' : 's'}</small></span><strong>+${m05Value}%</strong></li>`,
      );
    }
    if (m06Value > 0) lines.push('<li><span>M-06 Figura de autoridade</span><strong>+50%</strong></li>');
    if (a01Value > 0) lines.push('<li><span>A-01 Cooperação</span><strong>−50%</strong></li>');
    if (a05Value > 0) lines.push(`<li><span>A-05 Acidente</span><strong>−${a05Value}%</strong></li>`);
    if (a06Value > 0) {
      lines.push(
        `<li><span>A-06 Arrependimento <small>−${a06Value}% · limite de 10 min</small></span><strong>−${formatNumber.format(
          a06Reduction,
        )} min</strong></li>`,
      );
    }

    breakdown.innerHTML = lines.join('');

    const selectedManual = Array.from(
      form.querySelectorAll<HTMLInputElement>('input[name="manual"]:checked'),
    )
      .map((input) => input.value)
      .map((code) => data.modificadores.find((item) => item.codigo === code))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    manualResult.hidden = selectedManual.length === 0;
    manualList.innerHTML = selectedManual
      .map(
        (item) =>
          `<li><strong>${escapeHtml(item.codigo)} ${escapeHtml(item.nome)}</strong><span>${escapeHtml(
            item.modificacao,
          )}</span></li>`,
      )
      .join('');

    total.textContent = formatNumber.format(result) + ' min';

    const net = Math.round((result - base) * 10) / 10;
    if (base === 0 && lines.length === 0) {
      caption.textContent = 'Informe uma pena-base em minutos para simular.';
    } else if (lines.length === 0 && selectedManual.length === 0) {
      caption.textContent = 'Nenhum modificador selecionado.';
    } else {
      const direction = net > 0 ? `+${formatNumber.format(net)}` : formatNumber.format(net);
      caption.textContent = `Pena-base de ${formatNumber.format(base)} min · variação de ${direction} min.`;
    }

    const summaryLines = [
      'Conferência de pena · Lei Espacial (visualizador não oficial)',
      `Pena-base: ${formatNumber.format(base)} min`,
      ...(aggravating > 0 ? [`Agravantes com percentual: +${aggravating}%`] : []),
      ...(attenuating > 0 ? [`Atenuantes com percentual: −${attenuating}%`] : []),
      ...(a06Reduction > 0
        ? [`A-06 Arrependimento: −${formatNumber.format(a06Reduction)} min (limite de 10 min)`]
        : []),
      `Pena simulada: ${formatNumber.format(result)} min`,
      ...(selectedManual.length
        ? [
            'Regras para decisão manual:',
            ...selectedManual.map((item) => `- ${item.codigo} ${item.nome}: ${item.modificacao}`),
          ]
        : []),
      'Ferramenta de apoio; não substitui o texto oficial nem o julgamento.',
    ];

    copyResult.dataset.copyText = summaryLines.join('\n');
  };

  form?.addEventListener('input', updateCalculator, { signal });
  form?.addEventListener('change', updateCalculator, { signal });
  form?.addEventListener(
    'submit',
    (event) => {
      event.preventDefault();
      updateCalculator();
    },
    { signal },
  );
  form?.addEventListener(
    'reset',
    () => {
      window.setTimeout(updateCalculator, 0);
    },
    { signal },
  );

  updateCalculator();
  applyFilter();

  return {
    cleanup: () => controller.abort(),
  };
}
