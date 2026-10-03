import { t } from './ui.ts';

import type { InstallPrompt } from './types/pwa.ts';

export function setupPWA(): void {
  const button = document.querySelector<HTMLButtonElement>('#install')!;
  const status = document.querySelector<HTMLElement>('#install-status')!;
  let pending: InstallPrompt | undefined;
  addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    pending = event as InstallPrompt;
    button.hidden = false;
  });
  button.addEventListener('click', async () => {
    if (!pending) return;
    button.disabled = true;
    const prompt = pending;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome !== 'accepted') status.textContent = t('installUnavailable');
    } catch {
      status.textContent = t('installUnavailable');
    } finally {
      pending = undefined;
      button.hidden = true;
      button.disabled = false;
    }
  });
  addEventListener('appinstalled', () => {
    pending = undefined;
    button.hidden = true;
    status.textContent = '';
  });
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(async () => {
        await navigator.serviceWorker.ready;
        document.documentElement.dataset.offlineReady = 'true';
      })
      .catch((error: unknown) => {
        console.error('FocusWord offline setup failed', error);
      });
  }
}
