const { execSync } = require('child_process');

const SERVICE_PORTS = [5000, 5001, 5002, 5003, 5004, 5005, 5006, 5007];

const getListeningPidsWindows = () => {
  const output = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
  const pids = new Set();

  for (const line of output.split(/\r?\n/)) {
    if (!line.includes('LISTENING')) {
      continue;
    }

    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) {
      continue;
    }

    const localAddress = parts[1];
    const port = Number(localAddress.split(':').pop());

    if (SERVICE_PORTS.includes(port)) {
      pids.add(Number(parts[4]));
    }
  }

  return [...pids];
};

const getListeningPidsUnix = () => {
  const pids = new Set();

  for (const port of SERVICE_PORTS) {
    try {
      const output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: 'utf8' }).trim();
      for (const pid of output.split(/\r?\n/)) {
        if (pid) {
          pids.add(Number(pid));
        }
      }
    } catch (_error) {
      // No process is listening on this port.
    }
  }

  return [...pids];
};

const getListeningPids = () => {
  if (process.platform === 'win32') {
    return getListeningPidsWindows();
  }

  return getListeningPidsUnix();
};

const main = async () => {
  const pids = getListeningPids().filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid);

  if (pids.length === 0) {
    console.log('[microservices:stop] no backend microservice listeners found on ports 5000-5007.');
    return;
  }

  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM');
      console.log(`[microservices:stop] stopped process ${pid}`);
    } catch (error) {
      console.error(`[microservices:stop] failed to stop process ${pid}: ${error.message}`);
    }
  }
};

main().catch((error) => {
  console.error(`[microservices:stop] failed: ${error.message}`);
  process.exit(1);
});
const { execFileSync } = require('child_process');

const ports = [
    Number(process.env.API_GATEWAY_PORT || 5000),
    Number(process.env.AUTH_SERVICE_PORT || 5001),
    Number(process.env.USER_SERVICE_PORT || 5002),
    Number(process.env.ADMIN_SERVICE_PORT || 5003),
    Number(process.env.EQUIPMENT_SERVICE_PORT || 5004),
    Number(process.env.REQUEST_SERVICE_PORT || 5005),
    Number(process.env.REPORT_SERVICE_PORT || 5006),
    Number(process.env.SPATIAL_SERVICE_PORT || 5007)
];

const parseWindowsPids = () => {
    const output = execFileSync('netstat.exe', ['-ano', '-p', 'tcp'], { encoding: 'utf8' });
    const pids = new Set();

    for (const line of output.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('TCP')) {
            continue;
        }

        const columns = trimmed.split(/\s+/);
        if (columns.length < 5 || columns[3] !== 'LISTENING') {
            continue;
        }

        const localAddress = columns[1];
        const port = Number(localAddress.slice(localAddress.lastIndexOf(':') + 1));
        if (ports.includes(port)) {
            pids.add(Number(columns[4]));
        }
    }

    return [...pids];
};

const parsePosixPids = () => {
    const output = execFileSync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], { encoding: 'utf8' });
    const pids = new Set();

    for (const line of output.split(/\r?\n/).slice(1)) {
        const trimmed = line.trim();
        if (!trimmed) {
            continue;
        }

        const columns = trimmed.split(/\s+/);
        const address = columns[8];
        if (!address) {
            continue;
        }

        const port = Number(address.slice(address.lastIndexOf(':') + 1));
        if (ports.includes(port)) {
            pids.add(Number(columns[1]));
        }
    }

    return [...pids];
};

const stop = () => {
    const pids = process.platform === 'win32' ? parseWindowsPids() : parsePosixPids();

    if (pids.length === 0) {
        console.log(`[microservices:stop] no backend services were listening on ports ${ports.join(', ')}.`);
        return;
    }

    console.log(`[microservices:stop] stopping backend services on ports ${ports.join(', ')} (pids: ${pids.join(', ')}).`);

    if (process.platform === 'win32') {
        execFileSync('taskkill.exe', ['/F', ...pids.flatMap((pid) => ['/PID', String(pid)])], { stdio: 'inherit' });
    } else {
        execFileSync('kill', ['-9', ...pids.map(String)], { stdio: 'inherit' });
    }

    console.log('[microservices:stop] backend services stopped.');
};

try {
    stop();
} catch (error) {
    console.error('[microservices:stop] failed to stop backend services:', error.message);
    process.exit(1);
}
