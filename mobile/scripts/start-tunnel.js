const { spawn } = require('child_process');
const path = require('path');
const { bin: cloudflaredBin } = require('cloudflared');

const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const port = portIdx !== -1 && args[portIdx + 1] ? args[portIdx + 1] : '8081';
const expoExtraArgs = args.filter((_, i) => i !== portIdx && i !== portIdx + 1);

console.log('[tunnel] Starting Cloudflare Quick Tunnel (stable alternative to ngrok)...');

const cfProc = spawn(cloudflaredBin, ['tunnel', '--no-autoupdate', '--url', `http://localhost:${port}`], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

let expoProc = null;
let startedExpo = false;
let shuttingDown = false;

const cleanup = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  if (expoProc && !expoProc.killed) {
    try {
      expoProc.kill();
    } catch {}
  }
  if (cfProc && !cfProc.killed) {
    try {
      cfProc.kill();
    } catch {}
  }
  process.exit(code);
};

process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));

const startupTimeout = setTimeout(() => {
  if (!startedExpo) {
    console.error('[tunnel] Timed out waiting for Cloudflare Quick Tunnel URL.');
    cleanup(1);
  }
}, 40000);

const handleChunk = (chunk) => {
  const text = chunk.toString();
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !startedExpo) {
    startedExpo = true;
    clearTimeout(startupTimeout);
    const tunnelUrl = match[0];
    console.log(`\n[tunnel] Connected: ${tunnelUrl}`);
    console.log('[tunnel] Launching Expo Metro server with Cloudflare proxy URL...\n');

    const isWin = process.platform === 'win32';
    const cmd = isWin ? (process.env.ComSpec || 'cmd.exe') : 'npx';
    const cmdArgs = isWin
      ? ['/c', 'npx.cmd', 'expo', 'start', '--localhost', '--port', port, ...expoExtraArgs]
      : ['expo', 'start', '--localhost', '--port', port, ...expoExtraArgs];

    expoProc = spawn(cmd, cmdArgs, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      env: {
        ...process.env,
        EXPO_PACKAGER_PROXY_URL: tunnelUrl,
      },
    });

    expoProc.on('exit', (code) => {
      cleanup(code || 0);
    });
  }
};

cfProc.stdout.on('data', handleChunk);
cfProc.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  handleChunk(chunk);
  if (!startedExpo && /error|failed/i.test(text)) {
    process.stderr.write(`[cloudflared] ${text}`);
  }
});

cfProc.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`[tunnel] cloudflared exited unexpectedly with code ${code}`);
    cleanup(code || 1);
  }
});
