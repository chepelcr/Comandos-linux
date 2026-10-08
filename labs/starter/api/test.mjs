import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
test('API validates notes, persists data, and serves health', async () => {
  const dir = await mkdtemp(`${tmpdir()}/lab-notes-`), port = 31987;
  const child = spawn(process.execPath, ['api/server.mjs'], { env: { ...process.env, DATA_DIR: dir, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await new Promise((resolve, reject) => { child.stdout.once('data', resolve); child.once('error', reject); child.once('exit', c => reject(Error(`Server exited ${c}`))); setTimeout(() => reject(Error('Startup timeout')), 10000).unref(); });
    const base = `http://127.0.0.1:${port}`;
    assert.equal((await fetch(`${base}/api/health`)).status, 200);
    const post = text => fetch(`${base}/api/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    assert.equal((await post('')).status, 400);
    assert.equal((await post('Linux works')).status, 201);
    const notes = await (await fetch(`${base}/api/notes`)).json(); assert.equal(notes[0].text, 'Linux works');
    assert.match(await (await import('node:fs/promises')).readFile(`${dir}/notes.json`, 'utf8'), /Linux works/);
  } finally { child.kill(); await new Promise(resolve => child.once('exit', resolve)); await rm(dir, { recursive: true, force: true }); }
});
