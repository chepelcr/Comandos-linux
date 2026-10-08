import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
// GitHub's configure-pages action supplies '' for a root site or '/repo' for a project.
// Set PAGES_BASE_PATH=/my-repo locally to reproduce the published asset paths.
const raw = process.env.PAGES_BASE_PATH ?? '';
if (raw && raw !== '/' && !/^\/[A-Za-z0-9._~-]+\/?$/.test(raw)) throw new Error('Use an empty base path or /repository-name');
const base = raw && raw !== '/' ? `${raw.replace(/\/$/, '')}/` : '/';
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
const result = spawnSync(process.execPath, [vite, 'build', '--base', base], { stdio: 'inherit' });
if (result.status === 0) writeFileSync('dist/.pages-base.json', JSON.stringify({ base }));
process.exit(result.status ?? 1);
