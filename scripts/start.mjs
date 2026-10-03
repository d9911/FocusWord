import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { ensureDependencies, runNpm } from './ensure-deps.mjs';
import { devResetPlugin } from './dev-cache.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
try {
  await ensureDependencies(root);
  if (process.argv.includes('--build')) await runNpm(['run', 'build'], root);
  if (!process.argv.includes('--ensure-only')) {
    const { createServer } = await import(pathToFileURL(join(root, 'node_modules/vite/dist/node/index.js')).href);
    const server = await createServer({ root, plugins: [devResetPlugin], server: { host: '127.0.0.1', open: '/__focusword_dev__' } });
    await server.listen();
    server.printUrls();
    const stop = async () => {
      await server.close();
      process.exit(0);
    };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
