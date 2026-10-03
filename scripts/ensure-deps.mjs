import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

export async function dependencyState(root) {
  const packageText = await readFile(join(root, 'package.json'), 'utf8');
  const lockText = await readFile(join(root, 'package-lock.json'), 'utf8');
  const fingerprint = createHash('sha256')
    .update(packageText + lockText + process.versions.node + process.platform + process.arch)
    .digest('hex');
  try {
    const installed = JSON.parse(await readFile(join(root, 'node_modules/.focusword-install.json'), 'utf8'));
    if (installed.fingerprint !== fingerprint) return { ready: false, fingerprint };
    const packageJSON = JSON.parse(packageText);
    const lock = JSON.parse(lockText);
    for (const name of Object.keys({ ...packageJSON.dependencies, ...packageJSON.devDependencies })) {
      const dependency = JSON.parse(await readFile(join(root, 'node_modules', name, 'package.json'), 'utf8'));
      if (dependency.version !== lock.packages[`node_modules/${name}`]?.version) return { ready: false, fingerprint };
    }
    return { ready: true, fingerprint };
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return { ready: false, fingerprint };
    throw error;
  }
}

export async function ensureDependencies(root) {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('FocusWord requires Node.js 24 or newer.');
  const state = await dependencyState(root);
  if (state.ready) {
    console.log('Dependencies are ready.');
    return;
  }
  console.log('Installing dependencies from package-lock.json…');
  await runNpm(['ci', '--include=dev'], root);
  await writeFile(join(root, 'node_modules/.focusword-install.json'), JSON.stringify({ fingerprint: state.fingerprint }) + '\n');
}

export async function runNpm(args, root) {
  const windows = process.platform === 'win32';
  const child = spawn(windows ? 'npm.cmd' : 'npm', args, { cwd: root, stdio: 'inherit', shell: windows });
  await new Promise((done, reject) => {
    child.on('error', reject);
    child.on('exit', (code, signal) =>
      code === 0 ? done() : reject(new Error(`npm command failed (${signal ?? code}). Check Node.js, npm and network access.`)),
    );
  });
}
