import type { LawDataService } from '../data/data-service';
import type { SearchableRecord } from '../types';
import {
  escapeHtml,
  normalizeCode,
  normalizeKey,
  normalizeText,
  plainTextFromMarkdown,
  readableInk,
  truncate,
} from '../lib/utils';

export type SearchKind = SearchableRecord['kind'];

export interface SearchGroup {
  kind: SearchKind;
  label: string;
  total: number;
  items: SearchHit[];
}

export interface SearchHit {
  record: SearchableRecord;
  score: number;
  titleHtml: string;
  snippetHtml: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  groups: SearchGroup[];
  elapsedMs: number;
}

interface IndexedRecord extends SearchableRecord {
  titleNormalized: string;
  bodyNormalized: string;
  titleWords: string[];
  bodyWords: string[];
  compactCode: string;
}

interface GroupDefinition {
  kind: SearchKind;
  label: string;
}

const GROUP_ORDER: GroupDefinition[] = [
  { kind: 'crime', label: 'Crimes' },
  { kind: 'modificador', label: 'Modificadores' },
  { kind: 'codigo', label: 'Código Espacial' },
  { kind: 'documento', label: 'Documentos' },
];

const KIND_LABEL: Record<SearchKind, string> = {
  crime: 'Crime',
  modificador: 'Modificador',
  codigo: 'Código',
  documento: 'Documento',
};

const WORD_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;

function words(value: string): string[] {
  return normalizeText(value).match(/[\p{L}\p{N}]+/gu) ?? [];
}

function uniqueWords(value: string): string[] {
  return [...new Set(words(value))];
}

function characterLimit(token: string): number {
  if (token.length <= 4) return 0;
  if (token.length <= 7) return 1;
  return 2;
}

/** Levenshtein com limite; retorna `limit + 1` quando passa do máximo. */
function boundedDistance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  if (a === b) return 0;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMinimum = i;

    for (let j = 1; j <= b.length; j += 1) {
      const substitution = previous[j - 1] ?? 0;
      const insertion = current[j - 1] ?? 0;
      const deletion = previous[j] ?? 0;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(substitution + cost, insertion + 1, deletion + 1);
      current[j] = value;
      rowMinimum = Math.min(rowMinimum, value);
    }

    if (rowMinimum > limit) return limit + 1;
    previous = current;
  }

  return previous[b.length] ?? limit + 1;
}

function wordMatches(word: string, token: string): 'exact' | 'prefix' | 'fuzzy' | null {
  if (word === token) return 'exact';
  if (token.length >= 2 && word.startsWith(token)) return 'prefix';

  const limit = characterLimit(token);
  if (limit > 0 && token.length >= 4 && word[0] === token[0]) {
    if (boundedDistance(word, token, limit) <= limit) return 'fuzzy';
  }

  return null;
}

function scoreToken(token: string, titleWords: string[], bodyWords: string[]): number {
  let best = 0;
  let bodyBest = 0;

  for (const word of titleWords) {
    const match = wordMatches(word, token);
    if (!match) continue;
    best = Math.max(best, match === 'exact' ? 22 : match === 'prefix' ? 14 : 8);
    if (best >= 22) break;
  }

  for (const word of bodyWords) {
    const match = wordMatches(word, token);
    if (!match) continue;
    bodyBest = Math.max(bodyBest, match === 'exact' ? 5 : match === 'prefix' ? 3 : 1.5);
    if (bodyBest >= 5) break;
  }

  return best + bodyBest;
}

function detectCodeQuery(query: string): string | null {
  const trimmed = query.trim();
  const compact = normalizeCode(trimmed);

  if (/^[0-5][0-9]{2}$/.test(compact) && /^[0-5]\s*-\s*[0-9]{2}$/.test(trimmed)) {
    return compact;
  }
  if (/^[ma][0-9]{2}$/i.test(compact) && /^[ma]\s*-\s*[0-9]{2}$/i.test(trimmed)) {
    return compact.toLowerCase();
  }
  // Atalho sem hífen: 303, 0-01, m04.
  if (/^[0-5][0-9]{2}$/.test(compact) || /^[ma][0-9]{2}$/i.test(compact)) {
    return compact.toLowerCase();
  }
  return null;
}

function plainDocumentText(markdown: string): string {
  return plainTextFromMarkdown(markdown);
}

function makeRecords(data: LawDataService): SearchableRecord[] {
  const records: SearchableRecord[] = [];

  for (const crime of data.crimes) {
    const series = data.getSeriesForCrime(crime.codigo);
    records.push({
      id: crime.codigo,
      kind: 'crime',
      title: crime.nome,
      code: crime.codigo,
      route: `/crimes/${crime.codigo}`,
      levelCode: crime.nivel.codigo,
      levelName: crime.nivel.nome,
      levelColor: crime.nivel.cor,
      levelInk: readableInk(crime.nivel.cor),
      series: series?.serie,
      body: [crime.descricao, ...crime.detalhes, crime.ooc ? `OOC: ${crime.ooc}` : '']
        .filter(Boolean)
        .join('\n'),
      extra: [crime.nivel.codigo, crime.nivel.nome, series?.serie ?? ''].filter(Boolean).join(' · '),
    });
  }

  for (const item of data.modificadores) {
    records.push({
      id: item.codigo,
      kind: 'modificador',
      title: item.nome,
      code: item.codigo,
      route: `/modificadores/${encodeURIComponent(item.codigo.toLowerCase())}`,
      body: `${item.descricao}\n${item.modificacao}`,
      extra: item.codigo.startsWith('M') ? 'Agravante' : 'Atenuante',
    });
  }

  for (const verbete of data.verbetes) {
    const code = verbete.artigos.length ? `Art. ${verbete.artigos.join(', ')}` : 'Verbete';
    records.push({
      id: verbete.id,
      kind: 'codigo',
      title: verbete.titulo,
      code,
      route: `/codigo/${verbete.id}`,
      body: `${plainDocumentText(verbete.markdown)}\n${verbete.artigos.map((artigo) => `Art. ${artigo}`).join(' ')}`,
      extra: verbete.capitulo || 'Código Espacial',
      chapter: verbete.capitulo,
    });
  }

  for (const documento of data.documentos) {
    records.push({
      id: documento.id,
      kind: 'documento',
      title: documento.titulo,
      code: 'Documento',
      route: `/documentos/${documento.id}`,
      body: plainDocumentText(documento.markdown),
      extra: 'Procedimentos e diretrizes',
    });
  }

  return records;
}

function highlightText(source: string, queryTokens: string[], maxLength?: number): string {
  const collapsed = source.replace(/\s+/g, ' ').trim();
  if (!collapsed) return '';

  let base = collapsed;
  if (maxLength && base.length > maxLength) {
    base = truncate(base, maxLength);
  }

  const matches: Array<{ start: number; end: number }> = [];
  for (const match of base.matchAll(WORD_PATTERN)) {
    const word = normalizeKey(match[0]);
    if (!word) continue;
    if (!queryTokens.some((token) => wordMatches(word, token))) continue;

    matches.push({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length });
  }

  if (matches.length === 0) return escapeHtml(base);

  matches.sort((a, b) => a.start - b.start);
  let output = '';
  let cursor = 0;

  for (const range of matches) {
    if (range.start < cursor) continue;
    output += escapeHtml(base.slice(cursor, range.start));
    output += `<mark>${escapeHtml(base.slice(range.start, range.end))}</mark>`;
    cursor = range.end;
  }

  output += escapeHtml(base.slice(cursor));
  return output;
}

function makeSnippet(source: string, queryTokens: string[]): string {
  const collapsed = source.replace(/\s+/g, ' ').trim();
  if (!collapsed) return '';

  let matchIndex = -1;
  for (const match of collapsed.matchAll(WORD_PATTERN)) {
    const word = normalizeKey(match[0]);
    if (!word) continue;
    if (queryTokens.some((token) => wordMatches(word, token))) {
      matchIndex = match.index ?? 0;
      break;
    }
  }

  const windowSize = 210;
  let start = matchIndex > 60 ? matchIndex - 70 : 0;
  let end = Math.min(collapsed.length, start + windowSize);

  if (start > 0) {
    const nextSpace = collapsed.indexOf(' ', start);
    if (nextSpace >= 0 && nextSpace < start + 24) start = nextSpace + 1;
  }
  if (end < collapsed.length) {
    const previousSpace = collapsed.lastIndexOf(' ', end);
    if (previousSpace > end - 30) end = previousSpace;
  }

  const excerpt = collapsed.slice(start, end);
  return `${start > 0 ? '…' : ''}${highlightText(excerpt, queryTokens)}${end < collapsed.length ? '…' : ''}`;
}

/**
 * Índice de busca próprio, sem dependências. Com a base atual são ~140 entradas,
 * então a pontuação e o matching aproximado respondem em poucos milissegundos.
 */
export class SearchIndex {
  private readonly records: IndexedRecord[];
  private readonly cache = new Map<string, SearchResponse>();
  readonly suggestions: Array<{ code: string; title: string; route: string; levelColor?: string; levelName?: string }>;

  constructor(data: LawDataService) {
    this.records = makeRecords(data).map((record) => ({
      ...record,
      titleNormalized: normalizeText(record.title),
      bodyNormalized: normalizeText(record.body),
      titleWords: uniqueWords(record.title),
      bodyWords: uniqueWords(`${record.title}\n${record.body}\n${record.extra}`),
      compactCode: normalizeCode(record.code),
    }));

    const preferredCodes = ['3-03', '1-01', '0-02', 'M-04', '0-01'];
    this.suggestions = preferredCodes.flatMap((code) => {
      const crime = data.getCrime(code);
      if (crime) {
        return [
          {
            code: crime.codigo,
            title: crime.nome,
            route: `/crimes/${encodeURIComponent(crime.codigo)}`,
            levelColor: crime.nivel.cor,
            levelName: crime.nivel.nome,
          },
        ];
      }

      const modificador = data.getModificador(code);
      if (modificador) {
        return [
          {
            code: modificador.codigo,
            title: modificador.nome,
            route: `/modificadores/${encodeURIComponent(modificador.codigo.toLowerCase())}`,
          },
        ];
      }

      return [];
    });
  }

  search(rawQuery: string): SearchResponse {
    const started = performance.now();
    const query = rawQuery.trim();
    const cacheKey = normalizeText(query);

    if (!cacheKey) {
      return { query, total: 0, groups: [], elapsedMs: performance.now() - started };
    }

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { ...cached, query, elapsedMs: performance.now() - started };
    }

    const codeQuery = detectCodeQuery(query);
    const queryTokens = uniqueWords(query);

    let scored: Array<{ record: IndexedRecord; score: number }> = [];

    if (codeQuery) {
      scored = this.records
        .filter((record) => record.compactCode === codeQuery)
        .map((record) => ({ record, score: 1000 }));
    } else if (queryTokens.length > 0) {
      const phrase = normalizeText(query).replace(/[^\p{L}\p{N}\s-]/gu, '').trim();

      for (const record of this.records) {
        let score = 0;
        let allTokensMatch = true;

        if (phrase) {
          if (record.titleNormalized === phrase) score += 60;
          else if (record.titleNormalized.startsWith(phrase)) score += 42;
          else if (record.titleNormalized.includes(phrase)) score += 28;
          else if (record.bodyNormalized.includes(phrase)) score += 7;
        }

        for (const token of queryTokens) {
          const tokenScore = scoreToken(token, record.titleWords, record.bodyWords);
          if (tokenScore === 0) {
            allTokensMatch = false;
            break;
          }
          score += tokenScore;
        }

        if (allTokensMatch && score > 0) scored.push({ record, score });
      }
    }

    const kindOrder = new Map(GROUP_ORDER.map((group, index) => [group.kind, index]));
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const kindDifference = (kindOrder.get(a.record.kind) ?? 99) - (kindOrder.get(b.record.kind) ?? 99);
      if (kindDifference !== 0) return kindDifference;
      return a.record.title.localeCompare(b.record.title, 'pt-BR');
    });

    const groups: SearchGroup[] = GROUP_ORDER.map(({ kind, label }) => {
      const hits = scored
        .filter(({ record }) => record.kind === kind)
        .map<SearchHit>(({ record, score }) => ({
          record,
          score,
          titleHtml: highlightText(record.title, queryTokens),
          snippetHtml: makeSnippet(record.body, queryTokens) || escapeHtml(record.extra),
        }));

      return { kind, label, total: hits.length, items: hits };
    }).filter((group) => group.total > 0);

    const response: SearchResponse = {
      query,
      total: scored.length,
      groups,
      elapsedMs: performance.now() - started,
    };

    if (this.cache.size > 24) this.cache.clear();
    this.cache.set(cacheKey, response);
    return response;
  }

  kindLabel(kind: SearchKind): string {
    return KIND_LABEL[kind];
  }
}
