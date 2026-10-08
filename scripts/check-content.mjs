import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { z } from 'zod';
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const localized = z.object({ es: z.string().min(1), en: z.string().min(1) });
const lessons = z.array(z.object({ id: z.string(), course: z.string(), title: localized, summary: localized, steps: z.array(localized).min(1), code: z.string(), optional: z.boolean(), minutes: z.number().positive() })).parse(await read('src/data/lessons.json'));
const examples = await read('src/data/legacy-examples.json');
const docs = await read('src/data/source-documents.json');
const manifest = await read('docs/migration-manifest.json');
if (examples.length !== 28 || docs.length !== 18 || lessons.length < 40) throw new Error('Content coverage regression');
if (new Set(lessons.map(l => l.id)).size !== lessons.length) throw new Error('Duplicate lesson IDs');
for (const e of examples) {
  if (!lessons.some(l => l.id === e.id)) throw new Error(`Unmapped ${e.id}`);
  const digest = createHash('sha256').update(e.code).digest('hex');
  if (manifest.examples.find(m => m.id === e.id)?.sha256 !== digest) throw new Error(`Altered original example ${e.id}`);
}
for (const d of docs) {
  const entry = manifest.documents.find(m => m.source === d.source);
  if (!entry || entry.sha256 !== d.sha256) throw new Error(`Source provenance changed ${d.source}`);
}
const es = await read('src/locales/es.json'), en = await read('src/locales/en.json');
if (JSON.stringify(Object.keys(es).sort()) !== JSON.stringify(Object.keys(en).sort())) throw new Error('UI locale key mismatch');
console.log(`${lessons.length} bilingual lessons; 28 original examples; 18 source documents; UI locale parity verified.`);

const sourceTranslations = JSON.parse(await readFile("src/data/source-translations.json", "utf8"));
for (const doc of docs) { if(sourceTranslations[doc.id]?.length !== doc.blocks.length) throw new Error(`Missing source translations: ${doc.id}`); }

const exercises=z.array(z.object({id:z.string(),goal:localized,code:z.string().min(1),environment:z.enum(['linux','github']),language:z.string()})).parse(await read('src/data/lab-exercises.json'));
const checks=await readFile('labs/check.py','utf8');
const courses=await read('src/data/courses.json');
for(const lesson of lessons){if(lesson.steps.some(step=>Object.values(step).some(text=>/\bcourse-check\b/.test(text))))throw Error(`Internal checker exposed in lesson instructions: ${lesson.id}`);const exercise=exercises.find(item=>item.id===lesson.id);if(courses.find(c=>c.id===lesson.course)?.practice==='github'){if(exercise?.environment!=='github')throw Error(`Missing GitHub exercise: ${lesson.id}`);continue;}if(!exercise||/\bcourse-check\b/.test(exercise.code)||!checks.includes(`'${lesson.id}':`))throw Error(`Missing offline lab exercise/check: ${lesson.id}`);}
if(exercises.length!==lessons.length||new Set(exercises.map(item=>item.id)).size!==lessons.length)throw Error('Offline lab exercise IDs do not match the curriculum');
for(const workshop of await read('src/data/workshops.json'))for(const id of workshop.lessons)if(!lessons.some(lesson=>lesson.id===id))throw Error(`Unknown workshop lesson ${id}`);
console.log(`${exercises.filter(e=>e.environment==='linux').length} offline lab mappings; ${exercises.filter(e=>e.environment==='github').length} external GitHub exercises verified (execution is a separate release gate).`);
