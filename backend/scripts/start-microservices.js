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
