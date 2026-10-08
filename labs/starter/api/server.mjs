import express from 'express';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const app = express(), directory = process.env.DATA_DIR || fileURLToPath(new URL('./data/', import.meta.url));
await mkdir(directory, { recursive: true });
let notes; try { notes = JSON.parse(await readFile(`${directory}/notes.json`, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; notes = []; }
let saving = Promise.resolve();
function save() { const snapshot = JSON.stringify(notes); saving = saving.then(async () => { await writeFile(`${directory}/notes.tmp`, snapshot); await rename(`${directory}/notes.tmp`, `${directory}/notes.json`); }); return saving; }
app.use(express.json({ limit: '8kb' }));
app.get('/api/health', (_, res) => res.json({ ok: true }));
app.get('/api/notes', (_, res) => res.json(notes));
app.post('/api/notes', async (req, res) => { const text = req.body?.text; if (typeof text !== 'string' || !text.trim() || text.length > 200) return res.status(400).json({ error: 'Invalid note' }); const note = { id: randomUUID(), text: text.trim(), done: false }; notes.push(note); await save(); res.status(201).json(note); });
app.patch('/api/notes/:id', async (req, res) => { const note = notes.find(n => n.id === req.params.id); if (!note) return res.sendStatus(404); if (typeof req.body?.done !== 'boolean') return res.sendStatus(400); note.done = req.body.done; await save(); res.json(note); });
app.use(express.static(fileURLToPath(new URL('../frontend/dist/', import.meta.url))));
app.use((err, req, res, next) => { console.error(err.message); res.status(err.status || 500).json({ error: 'Request failed' }); });
app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Linux Lab Notes ready'));
