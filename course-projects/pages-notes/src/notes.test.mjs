import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addNote, toggleNote, readNotes, saveNotes } from './notes.mjs';
test('notes persist, toggle and reject invalid input', () => {
  const values = new Map(); const storage = { getItem: k => values.get(k), setItem: (k, v) => values.set(k, v) };
  const notes = addNote([], '  My first deployment  ', 'first');
  saveNotes(storage, toggleNote(notes, 'first'));
  assert.deepEqual(readNotes(storage), [{ id: 'first', text: 'My first deployment', done: true }]);
  assert.throws(() => addNote([], '  ')); assert.throws(() => addNote([], 'x'.repeat(201)));
});
test('malformed saved data does not break the application', () => {
  assert.deepEqual(readNotes({ getItem: () => '{' }), []);
  assert.deepEqual(readNotes({ getItem: () => '{"private":"value"}' }), []);
});
