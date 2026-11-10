#!/usr/bin/env node
const { execSync } = require('child_process');

// On Windows, OpenNext requires WSL or Linux. For local Windows builds, run next build directly.
if (process.platform === 'win32') {
  console.log('[build.js] Local Windows environment detected -> executing next build');
  execSync('npx next build', { stdio: 'inherit' });
} else {
  console.log('[build.js] Cloudflare / Linux environment detected -> executing opennextjs-cloudflare build');
  execSync('npx @opennextjs/cloudflare build', { stdio: 'inherit' });
}
