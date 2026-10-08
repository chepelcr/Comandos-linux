import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// Reuse the last build's base path so preview works without exporting shell variables.
const { base } = JSON.parse(readFileSync('dist/.pages-base.json', 'utf8'));
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
const result = spawnSync(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--base', base, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(result.status ?? 1);
