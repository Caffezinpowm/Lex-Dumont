import type { LawDataService } from '../data/data-service';

/**
 * Resolve links internos do JSON, como [Listagem de Crimes](#SpaceLawCrimeList)
 * e futuros links por id de documento, verbete, crime ou modificador.
 */
export function createHashResolver(data: LawDataService): (hash: string) => string | null {
  return (rawHash: string) => {
    const hash = decodeURIComponent(rawHash).trim();

    if (hash === 'SpaceLawCrimeList' || hash === 'ListagemDeCrimes') return '/crimes';
    if (data.getDocumento(hash)) return `/documentos/${hash}`;
    if (data.getVerbete(hash)) return `/codigo/${hash}`;
    if (data.getCrime(hash.toUpperCase())) return `/crimes/${hash.toUpperCase()}`;
    if (data.getModificador(hash.toUpperCase())) {
      return `/modificadores/${hash.toLowerCase()}`;
    }

    return null;
  };
}
