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
