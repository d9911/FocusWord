// This route exists only on the local development server, never in dist.
export async function resetDevelopmentCache() {
  const scope = new URL('./', location.href).href;
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      const worker = registration.active ?? registration.waiting ?? registration.installing;
      if (registration.scope === scope && worker?.scriptURL === new URL('sw.js', scope).href) await registration.unregister();
    }
  }
  if ('caches' in globalThis) {
    const prefix = `focusword:${scope}:`;
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(prefix)).map((key) => caches.delete(key)));
  }
}
export const devResetPlugin = {
  name: 'focusword-dev-cache',
  configureServer(server) {
    server.middlewares.use('/__focusword_dev__', (_request, response) => {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.setHeader('Cache-Control', 'no-store');
      response.end(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Starting FocusWord</title><p id="status">Starting FocusWord…</p><script>
(${resetDevelopmentCache.toString()})().then(() => location.replace('./')).catch(() => {
  document.getElementById('status').textContent = 'Could not clear the old offline cache. Close other FocusWord tabs and try again.';
});</script></html>`);
    });
  },
};
