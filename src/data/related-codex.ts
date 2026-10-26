import { normalizeKey } from '../lib/utils';

/**
 * Vínculos manuais entre crimes e verbetes do Código Espacial.
 *
 * Edite este objeto para mudar a seção "No Código Espacial" de cada crime.
 * As chaves são nomes de crimes normalizados (minúsculos, sem acentos e com
 * espaços simples), conforme normalizeKey(). O valor é o `id` do verbete.
 *
 * Além deste mapa, o LawDataService tenta um vínculo automático quando o nome
 * do crime e o título do verbete são exatamente iguais após normalização.
 */
export const VERBETES_POR_CRIME: Readonly<Record<string, string>> = {
  // Invasão e entrada indevida
  transgressao: 'invasao',
  'furto simples': 'furto',
  agressao: 'lesaoCorporal',
  'violacao de termos': 'estelionato',
  desacato: 'desrespeitoAutoridade',
  'contrabando departamental': 'porteArtefato',
  'furto qualificado': 'furto',
  'vandalismo grave': 'vandalismo',
  'denuncia falsa': 'calunia',
  'contrabando restrito': 'porteArtefato',
  'invasao restrita': 'invasao',
  assalto: 'roubo',
  'tentativa de homicidio': 'homicidio',
  'dano infraestrutural': 'sabotagem',
  fraude: 'estelionato',
  'contrabando perigoso': 'porteArtefato',
  arrombamento: 'invasao',
  'grande roubo': 'roubo',
  'dano a cela': 'vandalismo',
  'incitando revolta': 'insurreicao',
  'relacao a grupo externo': 'traicaoCorporativa',
  'captura de autoridade': 'sequestro',
  'contrabando letal': 'porteArtefato',
  'alta negligencia': 'negligencia',
  'invasao ao arsenal': 'invasao',
  massacre: 'homicidio',
  'grande sabotagem': 'sabotagem',
  'fuga de confinamento': 'evasaoPrisao',
  motim: 'insurreicao',
  'captura de refem': 'sequestro',
  'contrabando critico': 'porteArtefato',
  'desobedecer a central': 'insubordinacao',
  'invasao na central': 'invasao',
  aniquilacao: 'homicidio',
  'inimigo da estacao': 'traicaoCorporativa',
  'contrabando especial': 'porteArtefato',
};

/** Uso nos componentes: normaliza a chave antes de consultar. */
export function verbeteManualParaCrime(nomeDoCrime: string): string | undefined {
  return VERBETES_POR_CRIME[normalizeKey(nomeDoCrime)];
}
