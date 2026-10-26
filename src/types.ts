/**
 * Contratos do arquivo `public/space-law.json`.
 *
 * O JSON é carregado em tempo de execução. Trocar o arquivo é suficiente para
 * atualizar todo o conteúdo do visualizador, sem editar componentes.
 */

export interface Fonte {
  repositorio: string;
  branch: string;
  caminhos: string[];
  licenca: string;
  servidor: string;
}

export interface Crime {
  codigo: string;
  nome: string;
  descricao: string;
  detalhes: string[];
  ooc: string;
}

export interface Nivel {
  nivel: number;
  codigo: string;
  nome: string;
  cor: string;
  titulo: string;
  descricao: string;
  pena_maxima: string;
  pena_minima: string;
  observacoes_nivel: string[];
  crimes: Crime[];
}

export interface Modificador {
  codigo: string;
  nome: string;
  descricao: string;
  /** Efeito do modificador na pena, em texto livre. */
  modificacao: string;
}

export interface Modificadores {
  introducao: string;
  itens: Modificador[];
}

export interface SerieGuia {
  serie: string;
  /** Chaves no formato "0-XX" … "5-XX"; células vazias são esperadas. */
  crimes_por_nivel: Record<string, string>;
}

export interface GuiaRapido {
  titulo: string;
  descricao: string;
  niveis: string[];
  series: SerieGuia[];
}

export interface Documento {
  id: string;
  titulo: string;
  markdown: string;
}

export interface Verbete {
  id: string;
  capitulo: string;
  titulo: string;
  artigos: string[];
  markdown: string;
}

export interface LawData {
  fonte: Fonte;
  moeda: string;
  unidade_pena: string;
  niveis: Nivel[];
  modificadores: Modificadores;
  guia_rapido: GuiaRapido;
  documentos: Documento[];
  codigo_espacial: Verbete[];
}

/** Crime com o nível já resolvido, usado por listas, busca e links. */
export interface IndexedCrime extends Crime {
  nivel: Nivel;
}

export interface SearchableRecord {
  id: string;
  kind: 'crime' | 'modificador' | 'codigo' | 'documento';
  title: string;
  code: string;
  route: string;
  levelCode?: string;
  levelName?: string;
  levelColor?: string;
  levelInk?: string;
  chapter?: string;
  series?: string;
  body: string;
  extra: string;
}

export interface TocItem {
  id: string;
  label: string;
  level: number;
}

export interface SeriesPosition {
  serie: string;
  cells: Array<{ nivel: Nivel; crime?: IndexedCrime }>;
}
