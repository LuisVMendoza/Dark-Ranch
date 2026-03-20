import { spawn } from 'node:child_process';

const children = [];
let shuttingDown = false;
const apiPort = process.env.API_PORT || '3001';

function spawnProcess(command, args, name) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });

  children.push(child);

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    for (const proc of children) {
      if (proc.pid && !proc.killed) {
        proc.kill('SIGTERM');
      }
    }

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error(`[dev] No se pudo iniciar ${name}:`, error);
    process.exit(1);
  });
}

spawnProcess('php', ['-S', `127.0.0.1:${apiPort}`, 'server/router.php'], 'API local PHP');
spawnProcess('vite', [], 'Vite');

const shutdown = () => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    if (child.pid && !child.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
