import lessons from '../data/lessons.json';
import courses from '../data/courses.json';
import rewards from '../data/rewards.json';
export type Progress = { version: 1; epoch: number; preferences: {language?: 'es'|'en'; theme?: 'light'|'dark'}; completed: string[]; exercises: string[]; bookmarks: string[]; lastLesson: string; updated: string };
export const empty = (): Progress => ({ version: 1, epoch: 0, preferences: {}, completed: [], exercises: [], bookmarks: [], lastLesson: 'intro', updated: '' });
const ids = new Set(lessons.map(l => l.id));
export function sanitize(value: unknown): Progress {
  const p = (value && typeof value === 'object' ? value : {}) as Partial<Progress>;
  const list = (v: unknown) => Array.isArray(v) ? [...new Set(v.filter((id): id is string => typeof id === 'string' && ids.has(id)))] : [];
  return { version: 1, epoch: typeof p.epoch === 'number' && Number.isInteger(p.epoch) && p.epoch >= 0 ? p.epoch : 0, preferences: { ...(p.preferences?.language && ['es','en'].includes(p.preferences.language) ? {language:p.preferences.language} : {}), ...(p.preferences?.theme && ['light','dark'].includes(p.preferences.theme) ? {theme:p.preferences.theme} : {}) }, completed: list(p.completed), exercises: list(p.exercises), bookmarks: list(p.bookmarks), lastLesson: typeof p.lastLesson === 'string' && ids.has(p.lastLesson) ? p.lastLesson : 'intro', updated: typeof p.updated === 'string' ? p.updated : '' };
}
export function merge(a: Progress, b: Progress): Progress {
  if(a.epoch !== b.epoch) return a.epoch > b.epoch ? a : b;
  return sanitize({ ...a, preferences:{...b.preferences,...a.preferences}, completed: [...a.completed, ...b.completed], exercises: [...a.exercises, ...b.exercises], bookmarks: a.updated >= b.updated ? a.bookmarks : b.bookmarks, lastLesson: a.updated > b.updated ? a.lastLesson : b.lastLesson, updated: a.updated > b.updated ? a.updated : b.updated });
}
export function points(p: Progress) {
  const modules = courses.filter(c => lessons.filter(l => l.course === c.id && !l.optional).every(l => p.completed.includes(l.id))).length;
  return p.completed.length * rewards.lesson + p.exercises.length * rewards.exercise + modules * rewards.module;
}
export function complete(p: Progress, id: string): Progress { return sanitize({ ...p, completed: [...p.completed, id], lastLesson: id, updated: new Date().toISOString() }); }
