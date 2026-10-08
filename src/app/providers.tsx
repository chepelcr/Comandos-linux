import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Hub } from 'aws-amplify/utils';
import { useTranslation } from 'react-i18next';
import { points } from '../services/progress';
import { config } from './config';
import {loadCurriculum} from '../repositories/curriculum';
import i18n, { stored, persist } from './i18n';
import { empty, merge, sanitize, type Progress } from '../services/progress';
import { currentStudent, freshToken, logout, type Student } from './auth';
const AppContext = createContext({} as { user: Student | null; authReady: boolean; progressChoicePending: boolean; progress: Progress; update: (fn: (p: Progress) => Progress) => void; sync: () => Promise<void>; status: string; authError: string; signOut: () => void; closingSession: boolean; reset: () => Promise<void>; deleteAccount: () => Promise<void> });
export const useApp = () => useContext(AppContext);
function read(key: string) { try { return sanitize(JSON.parse(stored(key, '{}'))); } catch { return empty(); } }
export function Providers({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const needsChoice=useRef(true);
  const syncing=useRef(false);
  const signingOut=useRef(false);
  const [choice,setChoice]=useState<{local:Progress;online:Progress}|null>(null);
  const [choosing,setChoosing]=useState(false);
  const [user, setUser] = useState<Student | null>(null);
  const [authReady,setAuthReady]=useState(false);
  useEffect(()=>{if(authReady)void loadCurriculum(user?.profile.sub??null);},[authReady,user?.profile.sub]);
  const [progress, setProgress] = useState(() => read('progress:guest'));
  const [status, setStatus] = useState('guest');
  const [authError, setAuthError] = useState('');
  const [closingSession,setClosingSession]=useState(false);
  const generation = useRef(0);
  const latest = useRef(progress); latest.current = progress;
  const key = `progress:${user?.profile.sub || 'guest'}`;
  useEffect(() => {
    let disposed = false;
    const load = async () => {
      const session = await currentStudent();
      if (disposed) return;
      setAuthReady(true);
      if (!session) return;
      generation.current++;
      const accountKey = `progress:${session.profile.sub}`;
      const account = read(accountKey);
      const merged = merge(account, {...read('progress:guest'),epoch:account.epoch});
      persist(accountKey, JSON.stringify(merged));

      latest.current = merged; setProgress(merged); setUser(session); setStatus('pending');

    };
    void load();
    const cancel = Hub.listen('auth', ({payload}) => {
      if(payload.event === 'signedIn') { setAuthError(''); void load(); }
    });
    return () => { disposed=true;cancel(); };
  }, []);
  const update = useCallback((fn: (p: Progress) => Progress) => { setProgress(p => { const next = sanitize(fn(p)); latest.current = next; persist(key, JSON.stringify(next)); return next; }); setStatus(user ? 'pending' : 'guest'); }, [key, user]);
  const request = useCallback(async (method: string, body?: unknown) => {
    if (!user) throw new Error('Session expired');
    const token = await freshToken();
    if (!token) throw new Error('Session expired');
    const response = await fetch(`${config.api}/me`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (!response.ok) throw new Error(`Sync failed (${response.status})`);
    return response.status === 204 ? null : response.json();
  }, [user]);
  const sync = useCallback(async () => {
    if (!user || !config.api || choice || syncing.current) return;
    syncing.current=true;
    const session = generation.current;
    try {
      const saved = sanitize(await request('GET'));
      if(session !== generation.current)return;
      const hasWork=(p:Progress)=>p.completed.length+p.exercises.length+p.bookmarks.length>0;
      if(needsChoice.current && hasWork(latest.current) && hasWork(saved) && JSON.stringify({...latest.current,updated:''})!==JSON.stringify({...saved,updated:''})) {
        setChoice({local:latest.current,online:saved});setStatus('chooseProgressPending');return;
      }
      needsChoice.current=false;
      const snapshot = merge(latest.current, saved);
      const remote = sanitize(await request('POST', { completed: snapshot.completed, exercises: snapshot.exercises, bookmarks: snapshot.bookmarks, lastLesson: snapshot.lastLesson, epoch:snapshot.epoch, preferences:snapshot.preferences }));
      if (session !== generation.current) return;
      const next = merge(latest.current, remote); latest.current = next; setProgress(next); persist(key, JSON.stringify(next));
      persist('progress:guest',JSON.stringify(empty()));
      setStatus(JSON.stringify(snapshot) === JSON.stringify(latest.current) || next.completed.length === snapshot.completed.length && next.exercises.length === snapshot.exercises.length ? 'saved' : 'pending');
    } catch { if (session === generation.current) setStatus(navigator.onLine ? 'syncError' : 'offline'); } finally {syncing.current=false;}
  }, [user, key, request, choice]);
  useEffect(() => { if (!user) return; const timer = setTimeout(() => { void sync(); }, 1200); return () => clearTimeout(timer); }, [user, progress.completed.join(','), progress.exercises.join(','), progress.bookmarks.join(','), progress.lastLesson, progress.preferences.language, progress.preferences.theme, sync]);
  const retries=useRef(0);
  useEffect(()=>{if(status==='saved'||status==='guest'){retries.current=0;return;}if(status!=='syncError'||retries.current>=3)return;const timer=setTimeout(()=>{retries.current++;void sync();},5000*2**retries.current);return()=>clearTimeout(timer);},[status,sync]);
  useEffect(() => { const online = () => { void sync(); }; window.addEventListener('online', online); return () => window.removeEventListener('online', online); }, [sync]);
  useEffect(()=>{if(progress.preferences.language){persist('locale',progress.preferences.language);void i18n.changeLanguage(progress.preferences.language);}if(progress.preferences.theme){persist('theme',progress.preferences.theme);window.dispatchEvent(new Event('theme-preference'));}},[progress.preferences.language,progress.preferences.theme]);
  const clear = (value?: unknown) => { generation.current++; const next = value ? sanitize(value) : empty(); latest.current = next; setProgress(next); persist(key, JSON.stringify(next)); setStatus('saved'); };
  const resolveChoice=async(source:'local'|'online')=>{
    if(!choice || choosing)return;setChoosing(true);
    try {
      const session=generation.current;
      let next=sanitize(await request('GET'));
      if(session!==generation.current)return;
      const selectedLocal=latest.current;
      if(source==='local') {
        const reset=sanitize(await request('DELETE'));
        next={...selectedLocal,epoch:reset.epoch,updated:new Date().toISOString()};
        latest.current=next;setProgress(next);persist(key,JSON.stringify(next));
        next=sanitize(await request('POST',{completed:next.completed,exercises:next.exercises,bookmarks:next.bookmarks,lastLesson:next.lastLesson,epoch:next.epoch,preferences:next.preferences}));
      }
      if(session!==generation.current)return;
      latest.current=next;setProgress(next);persist(key,JSON.stringify(next));persist('progress:guest',JSON.stringify(empty()));needsChoice.current=false;setChoice(null);setStatus('saved');
    }catch{setStatus('choiceFailed');}finally{setChoosing(false);}
  };
  return <AppContext value={{ user, authReady, progressChoicePending:Boolean(choice), progress, update, sync, status, authError, closingSession,
    signOut: () => { if(signingOut.current)return;signingOut.current=true;setClosingSession(true);setAuthError('');void (async()=>{try{await logout();needsChoice.current=true;setChoice(null);generation.current++;setUser(null);setProgress(read('progress:guest'));setStatus('guest');setAuthError('');}catch(e){setAuthError(String(e));}finally{signingOut.current=false;setClosingSession(false);}})(); },
    reset: async () => { const next = user ? await request('DELETE') : undefined; clear(next); },
    deleteAccount: async () => { const {endActiveLab}=await import('../services/labs');await endActiveLab();await request('DELETE', { deleteAccount: true }); clear();const {signOut}=await import('aws-amplify/auth');await signOut(); setUser(null); setProgress(read('progress:guest')); },
  }}>{children}{choice && <section className="sync-choice" aria-labelledby="sync-choice-title"><h2 id="sync-choice-title">{t('chooseProgress')}</h2><p>{t('chooseProgressDesc')}</p><div className="choice-summaries"><div><strong>{t('localProgress')}</strong><span>{choice.local.completed.length} {t('lessons')} · {points(choice.local)} XP</span></div><div><strong>{t('onlineProgress')}</strong><span>{choice.online.completed.length} {t('lessons')} · {points(choice.online)} XP</span></div></div><div className="actions"><button className="button" disabled={choosing} onClick={()=>{void resolveChoice('online');}}>{t('keepOnline')}</button><button className="button secondary" disabled={choosing} onClick={()=>{void resolveChoice('local');}}>{t('keepLocal')}</button></div><p role="status">{t(status)}</p></section>}</AppContext>;
}
