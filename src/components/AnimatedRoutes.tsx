import { useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Routes, useLocation } from 'react-router-dom';
import { transition } from '../app/transitions';
export function AnimatedRoutes({ children, prepare }: { children: ReactNode; prepare: (path: string) => Promise<unknown> }) {
 const location = useLocation();
 const [displayed, setDisplayed] = useState(location);
 const [error, setError] = useState<unknown>();
 const latest = useRef(location.key); latest.current = location.key;
 useEffect(() => {
  if (location.key === displayed.key) return;
  const requested = location;
  const samePath = location.pathname.startsWith('/learn/') && displayed.pathname.startsWith('/learn/') && location.pathname.split('/')[2] === displayed.pathname.split('/')[2];
  void transition(async () => {
   await prepare(requested.pathname);
   if (latest.current === requested.key) flushSync(() => setDisplayed(requested));
  }, { kind: 'page', selector: samePath ? '.lesson-content' : '#main', isCurrent: () => latest.current === requested.key }).catch(setError);
 }, [location, displayed, prepare]);
 if (error) throw error;
 return <Routes location={displayed}>{children}</Routes>;
}
