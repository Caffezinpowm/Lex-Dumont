import type { PageContext } from './context';
import type { PageRenderResult } from '../lib/router';
import { appUrl } from '../lib/router';
import { escapeHtml, textToParagraphs, truncate } from '../lib/utils';
import { setPageMeta } from '../lib/meta';
import { breadcrumbs, copyButton, prevNextNav } from '../ui/components';
import { icon } from '../ui/icons';
import { renderNotFound } from './not-found';

function categoryOf(code: string): 'agravante' | 'atenuante' {
  return code.toUpperCase().startsWith('M') ? 'agravante' : 'atenuante';
}

function cleanDescription(value: string): string {
  return value
    .replace(/\n*#{1,6}\s*(?:Agravantes|Atenuantes)\s*$/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function renderModifierDetail(ctx: PageContext): PageRenderResult {
  const requestedCode = (ctx.route.params.codigo ?? '').toUpperCase();
  const modifier = ctx.data.getModificador(requestedCode);

  if (!modifier) {
    return renderNotFound(ctx, {
      title: 'Modificador não encontrado',
      description: `Não há modificador cadastrado com o código “${requestedCode || 'vazio'}”. Use M-01 a M-06 ou A-01 a A-09.`,
      code: '404',
    });
  }

  const category = categoryOf(modifier.codigo);
  const categoryLabel = category === 'agravante' ? 'Agravante' : 'Atenuante';
  const categoryDescription =
    category === 'agravante'
      ? 'Circunstância que aumenta a pena ou exige medida adicional.'
      : 'Circunstância que reduz a pena, libera o autor ou substitui a sanção.';
  const siblings = category === 'agravante' ? ctx.data.agravantes : ctx.data.atenuantes;
  const index = ctx.data.modificadores.findIndex((item) => item.codigo === modifier.codigo);
  const previous = index > 0 ? ctx.data.modificadores[index - 1] : undefined;
  const next = index >= 0 ? ctx.data.modificadores[index + 1] : undefined;
  const description = cleanDescription(modifier.descricao);
  const shareUrl = `${window.location.origin}${window.location.pathname}`;

  setPageMeta({
    title: `${modifier.codigo} · ${modifier.nome}`,
    description: truncate(`${description} ${modifier.modificacao}`, 170),
  });

  ctx.pageRoot.innerHTML = `<div class="page detail-page modifier-detail-page modifier-detail-page--${category}">
    ${breadcrumbs([
      { label: 'Início', href: '/' },
      { label: 'Modificadores', href: '/modificadores' },
      { label: `${modifier.codigo} · ${modifier.nome}` },
    ])}

    <header class="detail-hero detail-hero--modifier">
      <span class="detail-hero__accent" aria-hidden="true"></span>
      <div class="detail-hero__copy">
        <div class="detail-hero__meta">
          <span class="mono-code mono-code--large">${escapeHtml(modifier.codigo)}</span>
          <span class="modifier-kind-badge modifier-kind-badge--${category}">${icon(
            category === 'agravante' ? 'alert-triangle' : 'shield',
            { size: 14 },
          )} ${categoryLabel}</span>
        </div>
        <h1>${escapeHtml(modifier.nome)}</h1>
        <p class="detail-hero__lead">${escapeHtml(description.split('\n')[0] ?? '')}</p>
        <div class="detail-actions">
          ${copyButton({
            text: modifier.codigo,
            label: 'Copiar código',
            successMessage: `Código ${modifier.codigo} copiado.`,
          })}
          ${copyButton({
            text: modifier.modificacao,
            label: 'Copiar efeito',
            successMessage: 'Efeito copiado.',
          })}
          ${copyButton({
            text: shareUrl,
            label: 'Copiar link',
            successMessage: 'Link copiado.',
            iconName: 'link',
          })}
          <button class="btn btn--quiet btn--small" type="button" data-print>
            ${icon('file-text', { size: 16 })} Imprimir
          </button>
        </div>
      </div>

      <aside class="effect-ticket effect-ticket--${category}" aria-label="Efeito do modificador">
        <span class="effect-ticket__icon" aria-hidden="true">${icon(
          category === 'agravante' ? 'alert-triangle' : 'shield',
          { size: 24 },
        )}</span>
        <span class="effect-ticket__label">Efeito na pena</span>
        <p class="effect-ticket__value">${escapeHtml(modifier.modificacao)}</p>
        <span class="effect-ticket__kind">${categoryLabel} · ${escapeHtml(modifier.codigo)}</span>
      </aside>
    </header>

    <div class="detail-grid">
      <article class="detail-main">
        <section class="content-card" aria-labelledby="descricao-mod-title">
          <div class="content-card__heading">
            <span class="section-index" aria-hidden="true">01</span>
            <div>
              <p class="eyebrow">Redação da regra</p>
              <h2 id="descricao-mod-title">Descrição</h2>
            </div>
          </div>
          <div class="prose prose--compact">
            ${textToParagraphs(description)}
          </div>
        </section>

        <aside class="modifier-effect-callout modifier-effect-callout--${category}" aria-labelledby="efeito-title">
          <span class="modifier-effect-callout__icon" aria-hidden="true">${icon('gavel', { size: 21 })}</span>
          <div>
            <p class="eyebrow" id="efeito-title">Consequência na pena</p>
            <p>${escapeHtml(modifier.modificacao)}</p>
          </div>
        </aside>

        <section class="content-card" aria-labelledby="categoria-title">
          <div class="content-card__heading">
            <span class="section-index" aria-hidden="true">02</span>
            <div>
              <p class="eyebrow">${category === 'agravante' ? 'Outros agravantes' : 'Outros atenuantes'}</p>
              <h2 id="categoria-title">${categoryLabel}s na mesma categoria</h2>
            </div>
            <span class="content-card__action content-card__count">${siblings.length}</span>
          </div>
          <div class="sibling-grid">
            ${siblings
              .filter((item) => item.codigo !== modifier.codigo)
              .map(
                (item) => `<a class="sibling-card" href="${appUrl(
                  `/modificadores/${encodeURIComponent(item.codigo.toLowerCase())}`,
                )}">
                  <span class="sibling-card__code">${escapeHtml(item.codigo)}</span>
                  <span class="sibling-card__name">${escapeHtml(item.nome)}</span>
                  <span class="sibling-card__effect">${escapeHtml(truncate(item.modificacao, 80))}</span>
                  ${icon('arrow-right', { size: 15 })}
                </a>`,
              )
              .join('')}
          </div>
        </section>
      </article>

      <aside class="detail-side" aria-label="Informações complementares">
        <section class="side-card" aria-labelledby="categoria-info-title">
          <div class="side-card__head">
            <span class="modifier-kind-badge modifier-kind-badge--${category}">${categoryLabel}</span>
            <span class="side-card__tag">${siblings.length} no grupo</span>
          </div>
          <h2 id="categoria-info-title">${escapeHtml(modifier.codigo)}</h2>
          <p>${escapeHtml(categoryDescription)}</p>
          <a class="side-card__link" href="${appUrl(
            `/modificadores#${category === 'agravante' ? 'agravantes' : 'atenuantes'}`,
          )}">Ver todos os ${category === 'agravante' ? 'agravantes' : 'atenuantes'} ${icon(
            'arrow-up-right',
            { size: 14 },
          )}</a>
        </section>

        <section class="side-card side-card--tools" aria-labelledby="ferramentas-mod-title">
          <h2 id="ferramentas-mod-title">Ferramentas</h2>
          <p>Copie a regra para registrar no jogo ou discutir o caso.</p>
          <div class="side-card__stack">
            ${copyButton({
              text: `${modifier.codigo} · ${modifier.nome}: ${modifier.modificacao}`,
              label: 'Copiar regra completa',
              small: true,
              successMessage: 'Regra copiada.',
            })}
            ${copyButton({
              text: shareUrl,
              label: 'Copiar link',
              small: true,
              successMessage: 'Link copiado.',
              iconName: 'link',
            })}
          </div>
        </section>

        <section class="side-card side-card--note" aria-labelledby="mod-aviso-title">
          <h2 id="mod-aviso-title">Lembrete</h2>
          <p>Este visualizador reproduz o texto do guidebook e não interpreta a regra. Em caso de dúvida, consulte o jogo e o Comando.</p>
          <a class="side-card__link" href="${appUrl('/modificadores#calculadora')}">Conferir percentuais ${icon(
            'arrow-right',
            { size: 15 },
          )}</a>
        </section>
      </aside>
    </div>

    ${prevNextNav(
      previous
        ? {
            label: previous.nome,
            href: `/modificadores/${encodeURIComponent(previous.codigo.toLowerCase())}`,
            meta: `${previous.codigo} · ${
              categoryOf(previous.codigo) === 'agravante' ? 'Agravante' : 'Atenuante'
            }`,
          }
        : undefined,
      next
        ? {
            label: next.nome,
            href: `/modificadores/${encodeURIComponent(next.codigo.toLowerCase())}`,
            meta: `${next.codigo} · ${categoryOf(next.codigo) === 'agravante' ? 'Agravante' : 'Atenuante'}`,
          }
        : undefined,
    )}

    <p class="page-source-note">
      Regra extraída do guidebook do servidor. Em caso de divergência, o guidebook dentro do jogo é a
      referência oficial. <span class="mono-code">${escapeHtml(modifier.codigo)}</span>
    </p>
  </div>`;

  return {};
}
