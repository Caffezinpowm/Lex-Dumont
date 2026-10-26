import type { PageRenderResult } from '../lib/router';
import type { PageContext } from './context';
import { appUrl } from '../lib/router';
import { escapeHtml, levelStyle, plural } from '../lib/utils';
import { setPageMeta } from '../lib/meta';
import { icon } from '../ui/icons';
import { sectionHeading } from '../ui/components';

export function renderHome(ctx: PageContext): PageRenderResult {
  const { data } = ctx;
  const totalCrimes = data.crimes.length;
  const maxCrimes = Math.max(...data.niveis.map((nivel) => nivel.crimes.length), 1);

  setPageMeta({
    title: 'Lei Espacial · Dumont Station',
    description:
      'Consulte rapidamente os crimes, penas, modificadores e procedimentos da Lei Espacial da Dumont Station, com busca instantânea.',
  });

  const levelRows = data.niveis
    .map(
      (nivel) => `<a class="terminal-level" href="${appUrl(`/crimes?nivel=${encodeURIComponent(nivel.codigo)}`)}" style="${levelStyle(
        nivel.cor,
      )}">
        <span class="terminal-level__bar" style="--level-ratio:${Math.max(0.12, nivel.crimes.length / maxCrimes)}"></span>
        <span class="terminal-level__code">${escapeHtml(nivel.codigo)}</span>
        <span class="terminal-level__name">${escapeHtml(nivel.nome)}</span>
        <span class="terminal-level__count">${nivel.crimes.length}</span>
      </a>`,
    )
    .join('');

  const levelCards = data.niveis
    .map(
      (nivel) => `<a class="level-card" href="${appUrl(`/crimes?nivel=${encodeURIComponent(nivel.codigo)}`)}" style="${levelStyle(
        nivel.cor,
      )}">
        <div class="level-card__top">
          <span class="level-card__code">${escapeHtml(nivel.codigo)}</span>
          <span class="level-card__count">${nivel.crimes.length} ${plural(nivel.crimes.length, 'crime', 'crimes')}</span>
        </div>
        <h3>${escapeHtml(nivel.nome)}</h3>
        <p>${escapeHtml(nivel.descricao)}</p>
        <div class="level-card__penalty">
          <span>${escapeHtml(nivel.pena_minima)}</span>
          ${icon('arrow-right', { size: 14 })}
          <span>${escapeHtml(nivel.pena_maxima)}</span>
        </div>
        <span class="level-card__action">Ver crimes deste nível ${icon('arrow-right', { size: 16 })}</span>
      </a>`,
    )
    .join('');

  ctx.pageRoot.innerHTML = `<div class="page home-page">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__backdrop" aria-hidden="true">
        <span class="hero__orbit hero__orbit--one"></span>
        <span class="hero__orbit hero__orbit--two"></span>
        <span class="hero__star hero__star--one"></span>
        <span class="hero__star hero__star--two"></span>
      </div>
      <div class="hero__copy">
        <p class="eyebrow"><span class="signal-dot" aria-hidden="true"></span> Arquivo jurídico da estação</p>
        <h1 id="hero-title">A lei da estação, <br /><span class="text-accent">em poucos segundos.</span></h1>
        <p class="hero__lead">Crimes, penas, modificadores e procedimentos da Lei Espacial em uma consulta rápida e pesquisável. Feita para a Segurança, para a tripulação e para o meio da partida.</p>
        <div class="hero__actions">
          <a class="btn btn--primary" href="${appUrl('/crimes')}">
            ${icon('scale', { size: 19 })}
            Explorar os crimes
          </a>
          <a class="btn btn--ghost" href="${appUrl('/guia-rapido')}">
            ${icon('grid', { size: 18 })}
            Ver guia rápido
          </a>
        </div>
        <p class="hero__shortcut"><span>Atalho de busca</span><kbd>/</kbd><span>ou</span><kbd>Ctrl K</kbd><span>em qualquer página</span></p>
      </div>

      <aside class="terminal-card" aria-label="Resumo da base da Lei Espacial">
        <div class="terminal-card__head">
          <span class="terminal-card__signal" aria-hidden="true"></span>
          <span>ÍNDICE DA LEI</span>
          <span class="terminal-card__status">BASE CARREGADA</span>
        </div>
        <div class="terminal-card__primary">
          <span class="terminal-card__number">${totalCrimes}</span>
          <span class="terminal-card__caption">crimes catalogados<br /><strong>${data.niveis.length} níveis de gravidade</strong></span>
        </div>
        <div class="terminal-card__levels" aria-label="Distribuição de crimes por nível">
          <p class="terminal-card__label">Escala de gravidade</p>
          ${levelRows}
        </div>
        <div class="terminal-card__stats">
          <div><strong>${data.modificadores.length}</strong><span>modificadores</span></div>
          <div><strong>${data.verbetes.length}</strong><span>verbetes</span></div>
          <div><strong>${data.documentos.length}</strong><span>documentos</span></div>
        </div>
        <div class="terminal-card__foot">
          <span class="signal-dot" aria-hidden="true"></span>
          <span>Conteúdo carregado de <code>space-law.json</code></span>
        </div>
      </aside>
    </section>

    <section class="home-levels" aria-labelledby="niveis-title">
      ${sectionHeading(
        'Base legal',
        'Escala de gravidade',
        `<a class="text-link" href="${appUrl('/guia-rapido')}">Abrir matriz ${icon('arrow-up-right', { size: 15 })}</a>`,
      ).replace('<h2>', '<h2 id="niveis-title">')}
      <p class="section-lead">Da advertência ao confinamento permanente, cada nível tem seus próprios limites de pena. Selecione um nível para filtrar a lista de crimes.</p>
      <div class="level-card-grid">${levelCards}</div>
    </section>

    <section class="quick-access" aria-labelledby="acesso-title">
      ${sectionHeading('Ferramentas', 'Acesso rápido').replace('<h2>', '<h2 id="acesso-title">')}
      <div class="quick-grid">
        <a class="quick-card" href="${appUrl('/guia-rapido')}">
          <span class="quick-card__icon">${icon('grid', { size: 23 })}</span>
          <span class="quick-card__eyebrow">Comparar</span>
          <h3>Guia rápido</h3>
          <p>Veja como o mesmo tipo de conduta escala entre os seis níveis de gravidade.</p>
          <span class="quick-card__link">Abrir matriz ${icon('arrow-right', { size: 15 })}</span>
        </a>
        <a class="quick-card" href="${appUrl('/modificadores')}">
          <span class="quick-card__icon">${icon('sliders', { size: 23 })}</span>
          <span class="quick-card__eyebrow">Sentença</span>
          <h3>Modificadores</h3>
          <p>Agravantes e atenuantes com o efeito de cada regra na pena final.</p>
          <span class="quick-card__link">Ver modificadores ${icon('arrow-right', { size: 15 })}</span>
        </a>
        <a class="quick-card" href="${appUrl('/codigo')}">
          <span class="quick-card__icon">${icon('book-open', { size: 23 })}</span>
          <span class="quick-card__eyebrow">Fundamento</span>
          <h3>Código espacial</h3>
          <p>${data.verbetes.length} verbetes sobre crimes, princípios e aplicação da lei.</p>
          <span class="quick-card__link">Ler o código ${icon('arrow-right', { size: 15 })}</span>
        </a>
        <a class="quick-card" href="${appUrl('/documentos')}">
          <span class="quick-card__icon">${icon('file-text', { size: 23 })}</span>
          <span class="quick-card__eyebrow">Procedimento</span>
          <h3>Documentos</h3>
          <p>Julgamentos, direitos de prisioneiro, contrabando, lei marcial e mais.</p>
          <span class="quick-card__link">Abrir documentos ${icon('arrow-right', { size: 15 })}</span>
        </a>
      </div>
    </section>

    <section class="home-callout" aria-labelledby="comece-title">
      <div>
        <p class="eyebrow">Sua próxima consulta</p>
        <h2 id="comece-title">Precisa de uma resposta durante a partida?</h2>
        <p>Use a busca do topo. Ela encontra crimes, penas, modificadores, artigos e procedimentos — mesmo com acentos ausentes ou um pequeno erro de digitação.</p>
      </div>
      <div class="home-callout__actions">
        <span class="search-example"><kbd>/</kbd> buscar</span>
        <a class="btn btn--primary" href="${appUrl('/crimes')}">Ver todos os crimes ${icon('arrow-right', { size: 17 })}</a>
      </div>
    </section>
  </div>`;

  return {};
}
