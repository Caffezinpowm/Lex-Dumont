let toastTimer: number | undefined;

export function showToast(message: string, tone: 'success' | 'error' | 'info' = 'success'): void {
  const region = document.getElementById('toast-region');
  if (!region) return;

  window.clearTimeout(toastTimer);
  region.replaceChildren();

  const toast = document.createElement('div');
  toast.className = `toast toast--${tone}`;
  toast.textContent = message;
  region.append(toast);

  requestAnimationFrame(() => toast.classList.add('is-visible'));
  toastTimer = window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => toast.remove(), 200);
  }, 2800);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback para navegadores/contextos sem a Clipboard API.
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.append(textarea);
    textarea.select();

    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      textarea.remove();
    }
  }
}

interface CopyButtonState {
  label: string;
  icon: string;
}

const copyButtonStates = new WeakMap<HTMLButtonElement, { original: CopyButtonState; timer: number }>();

/**
 * Copia um texto e dá feedback visual no botão sem desmontar a página.
 */
export async function copyWithFeedback(
  button: HTMLButtonElement,
  text: string,
  successMessage = 'Copiado para a área de transferência.',
): Promise<void> {
  const copied = await copyText(text);
  if (!copied) {
    showToast('Não foi possível copiar. Selecione o texto manualmente.', 'error');
    return;
  }

  showToast(successMessage);

  const label = button.querySelector<HTMLElement>('[data-copy-label]');
  const iconTarget = button.querySelector<HTMLElement>('[data-copy-icon]');
  const existing = copyButtonStates.get(button);
  if (existing) window.clearTimeout(existing.timer);

  const original: CopyButtonState = existing?.original ?? {
    label: label?.textContent ?? '',
    icon: iconTarget?.innerHTML ?? '',
  };

  if (label) label.textContent = 'Copiado';
  if (iconTarget) iconTarget.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>';
  button.classList.add('is-copied');

  const timer = window.setTimeout(() => {
    if (label) label.textContent = original.label;
    if (iconTarget) iconTarget.innerHTML = original.icon;
    button.classList.remove('is-copied');
    copyButtonStates.delete(button);
  }, 1800);

  copyButtonStates.set(button, { original, timer });
}
