import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { ensureDependencies } from './ensure-deps.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
try {
  await ensureDependencies(root);
  if (!process.argv.includes('--ensure-only')) {
    const { createServer } = await import(pathToFileURL(join(root, 'node_modules/vite/dist/node/index.js')).href);
    const server = await createServer({ root, server: { host: '127.0.0.1', open: true } });
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
