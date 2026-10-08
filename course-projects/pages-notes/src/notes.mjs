export const storageKey = 'linux-pages-notes-v1';
export function readNotes(storage) {
  try {
    const value = JSON.parse(storage.getItem(storageKey) || '[]');
    return Array.isArray(value) ? value.filter(n => n && typeof n.id === 'string' && typeof n.text === 'string' && typeof n.done === 'boolean') : [];
  } catch { return []; }
}
export function saveNotes(storage, notes) { storage.setItem(storageKey, JSON.stringify(notes)); }
export function addNote(notes, text, id = crypto.randomUUID()) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 200) throw new Error('Use 1–200 characters.');
  return [...notes, { id, text: trimmed, done: false }];
}
export function toggleNote(notes, id) { return notes.map(n => n.id === id ? { ...n, done: !n.done } : n); }
