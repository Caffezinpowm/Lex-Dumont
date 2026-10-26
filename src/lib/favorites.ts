const STORAGE_KEY = 'space-law:favorites:v1';

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((item): item is string => typeof item === 'string'))];
  } catch {
    return [];
  }
}

let favorites = new Set(read());

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    // A lista continua válida durante a sessão mesmo sem localStorage.
  }

  window.dispatchEvent(
    new CustomEvent<ReadonlySet<string>>('favorites:changed', {
      detail: new Set(favorites),
    }),
  );
}

export function getFavorites(): ReadonlySet<string> {
  return new Set(favorites);
}

export function isFavorite(code: string): boolean {
  return favorites.has(code);
}

export function toggleFavorite(code: string): boolean {
  const added = !favorites.has(code);
  if (added) favorites.add(code);
  else favorites.delete(code);
  persist();
  return added;
}

export function removeFavorite(code: string): void {
  if (!favorites.delete(code)) return;
  persist();
}

export function clearFavorites(): void {
  if (favorites.size === 0) return;
  favorites = new Set();
  persist();
}

export function favoriteCount(): number {
  return favorites.size;
}

// Mantém a lista sincronizada entre abas abertas.
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  favorites = new Set(read());
  window.dispatchEvent(
    new CustomEvent<ReadonlySet<string>>('favorites:changed', {
      detail: new Set(favorites),
    }),
  );
});
