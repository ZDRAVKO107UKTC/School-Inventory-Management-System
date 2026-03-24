const http = require('http');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');

const rootDir = path.join(__dirname, '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const SERVICE_PORTS = [
  { name: 'gateway', port: Number(process.env.API_GATEWAY_PORT || 5000) },
  { name: 'auth', port: Number(process.env.AUTH_SERVICE_PORT || 5001) },
  { name: 'user', port: Number(process.env.USER_SERVICE_PORT || 5002) },
  { name: 'admin', port: Number(process.env.ADMIN_SERVICE_PORT || 5003) },
  { name: 'equipment', port: Number(process.env.EQUIPMENT_SERVICE_PORT || 5004) },
  { name: 'request', port: Number(process.env.REQUEST_SERVICE_PORT || 5005) },
  { name: 'report', port: Number(process.env.REPORT_SERVICE_PORT || 5006) },
  { name: 'spatial', port: Number(process.env.SPATIAL_SERVICE_PORT || 5007) }
];

const requestHealth = (port) => new Promise((resolve) => {
  const request = http.get(`http://127.0.0.1:${port}/health`, (response) => {
    if (response.statusCode !== 200) {
      response.resume();
      resolve(false);
      return;
    }

    let body = '';
    response.setEncoding('utf8');
    response.on('data', (chunk) => {
      body += chunk;
    });
    response.on('end', () => {
      try {
        const payload = JSON.parse(body);
        resolve(payload.status === 'ok');
      } catch (_error) {
        resolve(false);
      }
    });
  });

  request.on('error', () => resolve(false));
  request.setTimeout(1500, () => {
    request.destroy();
    resolve(false);
  });
});

const checkPortOpen = (port) => new Promise((resolve) => {
  const socket = net.connect({ port, host: '127.0.0.1' });

  const finish = (result) => {
    socket.destroy();
    resolve(result);
  };

  socket.once('connect', () => finish(true));
  socket.once('error', () => finish(false));
  socket.setTimeout(1000, () => finish(false));
});

const runRawStart = () => {
  const child = spawn(npmCmd, ['run', 'microservices:start:raw'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: isWin
  });

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on('SIGINT', () => forwardSignal('SIGINT'));
  process.on('SIGTERM', () => forwardSignal('SIGTERM'));

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code || 0);
  });
};

const main = async () => {
  const healthChecks = await Promise.all(
    SERVICE_PORTS.map(async (service) => ({
      ...service,
      healthy: await requestHealth(service.port)
    }))
  );

  if (healthChecks.every((service) => service.healthy)) {
    const runningSummary = healthChecks.map((service) => `${service.name}:${service.port}`).join(', ');
    console.log(`[microservices:start] backend already appears to be running (${runningSummary}).`);
    console.log('[microservices:start] use the existing stack, or run `npm run microservices:stop` before starting fresh.');
    process.exit(0);
    return;
  }

  const occupiedChecks = await Promise.all(
    SERVICE_PORTS.map(async (service) => ({
      ...service,
      open: await checkPortOpen(service.port)
    }))
  );

  const occupiedServices = occupiedChecks.filter((service) => service.open);

  if (occupiedServices.length === 0) {
    runRawStart();
    return;
  }

  const occupiedSummary = occupiedServices.map((service) => `${service.name}:${service.port}`).join(', ');
  const healthySummary = healthChecks
    .filter((service) => service.healthy)
    .map((service) => `${service.name}:${service.port}`)
    .join(', ');
  console.error(`[microservices:start] cannot start because these ports are already in use: ${occupiedSummary}`);
  if (healthySummary) {
    console.error(`[microservices:start] healthy services already running: ${healthySummary}`);
  }
  console.error('[microservices:start] if this is a stale local backend, run `npm run microservices:stop` and try again.');
  process.exit(1);
};

main().catch((error) => {
  console.error(`[microservices:start] failed: ${error.message}`);
  process.exit(1);
const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

const backendRoot = path.resolve(__dirname, '..');

const services = [
    { name: 'gateway', port: Number(process.env.API_GATEWAY_PORT || 5000) },
    { name: 'auth', port: Number(process.env.AUTH_SERVICE_PORT || 5001) },
    { name: 'user', port: Number(process.env.USER_SERVICE_PORT || 5002) },
    { name: 'admin', port: Number(process.env.ADMIN_SERVICE_PORT || 5003) },
    { name: 'equipment', port: Number(process.env.EQUIPMENT_SERVICE_PORT || 5004) },
    { name: 'request', port: Number(process.env.REQUEST_SERVICE_PORT || 5005) },
    { name: 'report', port: Number(process.env.REPORT_SERVICE_PORT || 5006) },
    { name: 'spatial', port: Number(process.env.SPATIAL_SERVICE_PORT || 5007) }
];

const checkPort = (port) => new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    let settled = false;

    const finish = (listening) => {
        if (settled) {
            return;
        }

        settled = true;
        socket.destroy();
        resolve(listening);
    };

    socket.setTimeout(400);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
});

const formatServices = (entries) => entries.map(({ name, port }) => `${name}:${port}`).join(', ');

const start = async () => {
    const listening = [];

    for (const service of services) {
        if (await checkPort(service.port)) {
            listening.push(service);
        }
    }

    if (listening.length === services.length) {
        console.log(`[microservices:start] backend already appears to be running (${formatServices(listening)}).`);
        console.log('[microservices:start] use the existing stack, or run `npm run microservices:stop` before starting fresh.');
        process.exit(0);
    }

    if (listening.length > 0) {
        console.error(`[microservices:start] some backend ports are already in use (${formatServices(listening)}).`);
        console.error('[microservices:start] run `npm run microservices:stop` before starting fresh.');
        process.exit(1);
    }

    const child = process.platform === 'win32'
        ? spawn('cmd.exe', ['/d', '/s', '/c', 'npm run microservices:start:raw'], {
            cwd: backendRoot,
            stdio: 'inherit'
        })
        : spawn('npm', ['run', 'microservices:start:raw'], {
            cwd: backendRoot,
            stdio: 'inherit'
        });

    const forwardSignal = (signal) => {
        if (!child.killed) {
            child.kill(signal);
        }
    };

    process.on('SIGINT', () => forwardSignal('SIGINT'));
    process.on('SIGTERM', () => forwardSignal('SIGTERM'));

    child.on('exit', (code) => {
        process.exit(code ?? 0);
    });
};

start().catch((error) => {
    console.error('[microservices:start] failed to start backend:', error);
    process.exit(1);
});
