import type { LawDataService } from '../data/data-service';
import type { SearchIndex } from '../data/search';
import type { AppRoute, Router } from '../lib/router';

/** Dependências compartilhadas por todas as páginas. */
export interface PageContext {
  route: AppRoute;
  data: LawDataService;
  search: SearchIndex;
  pageRoot: HTMLElement;
  router: Router;
}
