const path = require('path');
const fs = require('fs');
const { spawn, spawnSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const dockerCmd = isWin ? 'docker.exe' : 'docker';

const run = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: isWin
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureDependencies = (cwd, label) => {
  const nodeModulesDir = path.join(cwd, 'node_modules');

  if (fs.existsSync(nodeModulesDir)) {
    console.log(`[dev-up] ${label} dependencies already installed.`);
    return;
  }

  console.log(`[dev-up] installing ${label} dependencies...`);
  run(npmCmd, ['install'], cwd);
};

const start = (command, args, cwd) => {
  return spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: isWin
  });
};

const main = async () => {
  console.log('[dev-up] starting postgres container...');
  run(dockerCmd, ['compose', 'up', '-d', 'postgres'], backendDir);

  ensureDependencies(backendDir, 'backend');
  ensureDependencies(frontendDir, 'frontend');

  console.log('[dev-up] running database migrations...');
  run(npmCmd, ['run', 'db:migrate'], backendDir);

  console.log('[dev-up] seeding database if empty...');
  run('node', ['scripts/seed-if-empty.js'], backendDir);

  console.log('[dev-up] starting backend microservices...');
  const backendProc = start(npmCmd, ['run', 'microservices:start'], backendDir);

  await wait(3500);

  console.log('[dev-up] starting frontend dev server...');
  const frontendProc = start(npmCmd, ['run', 'dev'], frontendDir);

  const children = [backendProc, frontendProc];
  let shuttingDown = false;

  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  backendProc.on('exit', (code) => {
    if (!shuttingDown && code !== 0) {
      console.error(`[dev-up] backend exited with code ${code}`);
      shutdown();
    }
  });

  frontendProc.on('exit', (code) => {
    if (!shuttingDown && code !== 0) {
      console.error(`[dev-up] frontend exited with code ${code}`);
      shutdown();
    }
  });
};

main().catch((error) => {
  console.error('[dev-up] failed:', error.message);
  process.exit(1);
});

