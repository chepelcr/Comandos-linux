import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
function App() {
  const [notes, setNotes] = useState([]), [text, setText] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  async function refresh() { try { const r = await fetch('./api/notes'); if (!r.ok) throw Error('API unavailable'); setNotes(await r.json()); setError(''); } catch (e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { void refresh(); }, []);
  async function add(e) { e.preventDefault(); const r = await fetch('./api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }); if (!r.ok) { setError('Enter a note between 1 and 200 characters.'); return; } setText(''); await refresh(); }
  async function toggle(n) { await fetch(`./api/notes/${n.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done: !n.done }) }); await refresh(); }
  return <main><small>YOUR FIRST LINUX DEPLOYMENT</small><h1>Linux Lab Notes</h1><p>A React interface. A Node API. Your Linux server.</p>{loading && <p role="status">Loading…</p>}{error && <p role="alert">{error}</p>}<form onSubmit={add}><label htmlFor="note">What did you learn?</label><div><input id="note" value={text} maxLength={200} onChange={e => setText(e.target.value)} required/><button>Add note</button></div></form><ul>{notes.map(n => <li key={n.id}><label><input type="checkbox" checked={n.done} onChange={() => toggle(n)}/><span style={{ textDecoration: n.done ? 'line-through' : 'none' }}>{n.text}</span></label></li>)}</ul></main>;
}
createRoot(document.getElementById('root')).render(<App/>);
