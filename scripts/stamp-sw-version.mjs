// Stamps a unique CACHE_VERSION into dist/sw.js after every build so a deploy
// can never ship a stale cache key. public/sw.js keeps a stable version for
// local dev; only the built copy is rewritten.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SW_PATH = new URL('../dist/sw.js', import.meta.url);

let hash = 'nogit';
try {
  hash = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // not a git checkout — timestamp alone still guarantees uniqueness
}

const stamp = `cody-on-a-boat-${hash}-${Date.now()}`;
const src = readFileSync(SW_PATH, 'utf8');
const out = src.replace(
  /const CACHE_VERSION = '[^']*';/,
  `const CACHE_VERSION = '${stamp}';`
);

if (out === src) {
  console.error('[stamp-sw-version] CACHE_VERSION line not found in dist/sw.js');
  process.exit(1);
}

writeFileSync(SW_PATH, out);
console.log(`[stamp-sw-version] dist/sw.js CACHE_VERSION -> ${stamp}`);
