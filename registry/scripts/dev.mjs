import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const children = ['server', 'frontend'].map((dir) =>
  spawn('npm', ['run', 'dev'], {
    cwd: join(root, dir),
    stdio: 'inherit',
    shell: true,
    env: process.env,
  }),
);

function stop() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (signal) return;
    stop();
    process.exit(code || 0);
  });
}
