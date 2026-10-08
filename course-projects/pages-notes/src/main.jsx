import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { addNote, toggleNote, readNotes, saveNotes } from './notes.mjs';
import './style.css';
function App() {
  const [notes, setNotes] = useState(() => readNotes(localStorage));
  const [text, setText] = useState(''); const [error, setError] = useState('');
  function update(next) {
    try { saveNotes(localStorage, next); setNotes(next); setError(''); return true; }
    catch { setError('Storage is unavailable. Allow site storage and try again.'); return false; }
  }
  function submit(event) {
    event.preventDefault();
    try { if (update(addNote(notes, text))) setText(''); } catch (e) { setError(e.message); }
  }
  return <main><small>MY FIRST GITHUB PAGES DEPLOYMENT</small><h1>My Linux Notes</h1><p>Capture what you learn. Celebrate every step.</p><form onSubmit={submit}><label htmlFor="note">What did you learn?</label><div><input id="note" value={text} onChange={e => setText(e.target.value)} maxLength={200} required/><button>Add note</button></div></form>{error && <p role="alert">{error}</p>}<ul>{notes.map(n => <li key={n.id}><label><input type="checkbox" checked={n.done} onChange={() => update(toggleNote(notes, n.id))}/><span style={{textDecoration: n.done ? 'line-through' : 'none'}}>{n.text}</span></label></li>)}</ul>{!notes.length && <p>Your first note starts here.</p>}<footer>Saved in this browser. No account or server required.</footer></main>;
}
createRoot(document.getElementById('root')).render(<App/>);
