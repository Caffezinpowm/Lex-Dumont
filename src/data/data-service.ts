import type {
  Documento,
  IndexedCrime,
  LawData,
  Modificador,
  Nivel,
  SeriesPosition,
  Verbete,
} from '../types';
import { normalizeKey } from '../lib/utils';
import { verbeteManualParaCrime } from './related-codex';

export class LawDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LawDataError';
  }
}

/**
 * Carrega o JSON uma única vez e oferece índices prontos para páginas e busca.
 * Nenhum texto legal fica no código: a fonte de verdade é public/space-law.json.
 */
export class LawDataService {
  readonly data: LawData;
  readonly niveis: Nivel[];
  readonly crimes: IndexedCrime[];
  readonly modificadores: Modificador[];
  readonly agravantes: Modificador[];
  readonly atenuantes: Modificador[];
  readonly documentos: Documento[];
  readonly verbetes: Verbete[];
  readonly series: SeriesPosition[];

  private readonly crimesByCode = new Map<string, IndexedCrime>();
  private readonly niveisByCode = new Map<string, Nivel>();
  private readonly modifiersByCode = new Map<string, Modificador>();
  private readonly documentosById = new Map<string, Documento>();
  private readonly verbetesById = new Map<string, Verbete>();
  private readonly seriesByCrimeCode = new Map<string, SeriesPosition>();
  private readonly relatedVerbeteByCrimeCode = new Map<string, string>();
  private readonly relatedCrimesByVerbeteId = new Map<string, IndexedCrime[]>();

  private constructor(data: LawData) {
    this.data = data;
    this.niveis = data.niveis;
    this.crimes = data.niveis.flatMap((nivel) => nivel.crimes.map((crime) => ({ ...crime, nivel })));
    this.modificadores = data.modificadores.itens;
    this.agravantes = this.modificadores.filter((item) => item.codigo.toUpperCase().startsWith('M'));
    this.atenuantes = this.modificadores.filter((item) => item.codigo.toUpperCase().startsWith('A'));
    this.documentos = data.documentos;
    this.verbetes = data.codigo_espacial;

    for (const nivel of data.niveis) this.niveisByCode.set(nivel.codigo, nivel);
    for (const crime of this.crimes) this.crimesByCode.set(crime.codigo, crime);
    for (const item of this.modificadores) this.modifiersByCode.set(item.codigo, item);
    for (const documento of this.documentos) this.documentosById.set(documento.id, documento);
    for (const verbete of this.verbetes) this.verbetesById.set(verbete.id, verbete);

    this.series = this.buildSeries();
    this.buildRelatedCodex();
  }

  static async load(): Promise<LawDataService> {
    const endpoint = `${import.meta.env.BASE_URL}space-law.json`;
    let response: Response;

    try {
      response = await fetch(endpoint, { cache: 'no-cache' });
    } catch {
      throw new LawDataError(
        'Não foi possível carregar space-law.json. Verifique sua conexão e se o arquivo está na raiz publicada.',
      );
    }

    if (!response.ok) {
      throw new LawDataError(
        `Não foi possível carregar space-law.json (HTTP ${response.status}). Confirme se o arquivo está em public/space-law.json.`,
      );
    }

    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      throw new LawDataError('O arquivo space-law.json não contém um JSON válido.');
    }

    if (!LawDataService.isLawData(raw)) {
      throw new LawDataError(
        'O space-law.json carregado não possui a estrutura esperada (fonte, niveis, modificadores, guia_rapido, documentos e codigo_espacial).',
      );
    }

    return new LawDataService(raw);
  }

  private static isLawData(value: unknown): value is LawData {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<LawData>;
    return (
      Array.isArray(candidate.niveis) &&
      candidate.niveis.every(
        (nivel) =>
          typeof nivel?.codigo === 'string' &&
          typeof nivel?.nome === 'string' &&
          typeof nivel?.cor === 'string' &&
          Array.isArray(nivel?.crimes),
      ) &&
      Array.isArray(candidate.documentos) &&
      Array.isArray(candidate.codigo_espacial) &&
      typeof candidate.fonte?.repositorio === 'string' &&
      typeof candidate.fonte?.licenca === 'string'
    );
  }

  private buildSeries(): SeriesPosition[] {
    const crimeNameIndex = new Map<string, IndexedCrime>();
    for (const crime of this.crimes) crimeNameIndex.set(normalizeKey(crime.nome), crime);

    return this.data.guia_rapido.series.map((serie) => {
      const cells = this.data.guia_rapido.niveis.map((nivelCode) => {
        const nivel = this.niveisByCode.get(nivelCode);
        const crimeName = serie.crimes_por_nivel[nivelCode] ?? '';
        const crime = crimeName ? crimeNameIndex.get(normalizeKey(crimeName)) : undefined;

        if (!nivel) {
          throw new LawDataError(`O guia rápido referencia o nível desconhecido ${nivelCode}.`);
        }

        return { nivel, ...(crime ? { crime } : {}) };
      });

      const position: SeriesPosition = { serie: serie.serie, cells };
      for (const cell of cells) {
        if (cell.crime) this.seriesByCrimeCode.set(cell.crime.codigo, position);
      }
      return position;
    });
  }

  private buildRelatedCodex(): void {
    const byNormalizedTitle = new Map<string, Verbete[]>();

    for (const verbete of this.verbetes) {
      const key = normalizeKey(verbete.titulo);
      const current = byNormalizedTitle.get(key) ?? [];
      current.push(verbete);
      byNormalizedTitle.set(key, current);
    }

    for (const crime of this.crimes) {
      const manualId = verbeteManualParaCrime(crime.nome);
      const automaticMatches = byNormalizedTitle.get(normalizeKey(crime.nome)) ?? [];
      const relatedId = manualId ?? (automaticMatches.length === 1 ? automaticMatches[0]?.id : undefined);

      if (!relatedId || !this.verbetesById.has(relatedId)) continue;

      this.relatedVerbeteByCrimeCode.set(crime.codigo, relatedId);
      const list = this.relatedCrimesByVerbeteId.get(relatedId) ?? [];
      list.push(crime);
      this.relatedCrimesByVerbeteId.set(relatedId, list);
    }
  }

  getNivel(code: string): Nivel | undefined {
    return this.niveisByCode.get(code);
  }

  getCrime(code: string): IndexedCrime | undefined {
    return this.crimesByCode.get(code);
  }

  getModificador(code: string): Modificador | undefined {
    return this.modifiersByCode.get(code.toUpperCase());
  }

  getDocumento(id: string): Documento | undefined {
    return this.documentosById.get(id);
  }

  getVerbete(id: string): Verbete | undefined {
    return this.verbetesById.get(id);
  }

  getSeriesForCrime(code: string): SeriesPosition | undefined {
    return this.seriesByCrimeCode.get(code);
  }

  getRelatedVerbeteForCrime(code: string): Verbete | undefined {
    const verbeteId = this.relatedVerbeteByCrimeCode.get(code);
    return verbeteId ? this.verbetesById.get(verbeteId) : undefined;
  }

  getRelatedCrimesForVerbete(id: string): IndexedCrime[] {
    return this.relatedCrimesByVerbeteId.get(id) ?? [];
  }

  getCrimeNeighbors(code: string): { previous?: IndexedCrime; next?: IndexedCrime } {
    const index = this.crimes.findIndex((crime) => crime.codigo === code);
    if (index < 0) return {};
    return {
      ...(this.crimes[index - 1] ? { previous: this.crimes[index - 1] } : {}),
      ...(this.crimes[index + 1] ? { next: this.crimes[index + 1] } : {}),
    };
  }

  getDocumentoNeighbors(id: string): { previous?: Documento; next?: Documento } {
    const index = this.documentos.findIndex((documento) => documento.id === id);
    if (index < 0) return {};
    return {
      ...(this.documentos[index - 1] ? { previous: this.documentos[index - 1] } : {}),
      ...(this.documentos[index + 1] ? { next: this.documentos[index + 1] } : {}),
    };
  }

  getVerbeteNeighbors(id: string): { previous?: Verbete; next?: Verbete } {
    const index = this.verbetes.findIndex((verbete) => verbete.id === id);
    if (index < 0) return {};
    return {
      ...(this.verbetes[index - 1] ? { previous: this.verbetes[index - 1] } : {}),
      ...(this.verbetes[index + 1] ? { next: this.verbetes[index + 1] } : {}),
    };
  }

  /** Códigos de crime próximos de um nível, útil em atalhos. */
  getCrimesForNivel(code: string): IndexedCrime[] {
    return this.crimes.filter((crime) => crime.nivel.codigo === code);
  }
}
