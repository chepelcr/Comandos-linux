import { mkdir, rm, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const output = resolve('public/downloads');
await mkdir(output, { recursive: true });
const archive = resolve(output, 'pages-notes.zip');
await rm(archive, { force: true });
// Explicit allowlist excludes credentials, Git history, dependencies and builds.
execFileSync('zip', ['-q', '-r', archive, 'README.md', 'package.json', 'package-lock.json',
  'index.html', 'vite.config.js', 'src', 'scripts', '.github', '.gitignore', '.nvmrc'], {
  cwd: resolve('course-projects/pages-notes'), env: { ...process.env, COPYFILE_DISABLE: '1' },
});
await copyFile('course-projects/pages-notes/.github/workflows/pages.yml', resolve(output, 'pages-workflow.yml'));
console.log('Packaged the student React starter and GitHub Pages workflow.');
