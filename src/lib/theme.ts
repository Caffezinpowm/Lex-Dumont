import { icon } from '../ui/icons';

const THEME_KEY = 'space-law:theme';
type Theme = 'dark' | 'light';

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function effectiveTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'dark' || explicit === 'light') return explicit;
  return systemTheme();
}

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

function updateControls(): void {
  const theme = effectiveTheme();
  const next = theme === 'dark' ? 'claro' : 'escuro';
  const button = document.querySelector<HTMLButtonElement>('[data-action="toggle-theme"]');
  if (!button) return;

  button.setAttribute('aria-label', `Ativar tema ${next}`);
  button.title = `Ativar tema ${next}`;
  button.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
}

function updateThemeColor(theme: Theme): void {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#07171b' : '#edf4f1');
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Preferência apenas em memória se o armazenamento estiver bloqueado.
  }
  updateThemeColor(theme);
  updateControls();
}

export function initTheme(): void {
  const media = window.matchMedia('(prefers-color-scheme: light)');
  updateThemeColor(effectiveTheme());
  media.addEventListener('change', () => {
    // Se o usuário nunca escolheu, acompanha a preferência do sistema.
    if (!savedTheme()) {
      updateThemeColor(systemTheme());
      updateControls();
    }
  });

  const button = document.querySelector<HTMLButtonElement>('[data-action="toggle-theme"]');
  button?.addEventListener('click', () => {
    applyTheme(effectiveTheme() === 'dark' ? 'light' : 'dark');
  });

  updateControls();
}
