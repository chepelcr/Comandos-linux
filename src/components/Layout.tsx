import { Suspense, useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Terminal, Menu, X, Sun, Moon, UserRound } from 'lucide-react';
import { useApp } from '../app/providers';
import { stored, persist } from '../app/i18n';
import studio from '../data/footer.json';
import { localized } from '../app/content';
import { transition } from '../app/transitions';
import { LanguageButton } from './LanguageButton';
export default function Layout() {
 const { t, i18n } = useTranslation(); const { user, update } = useApp(); const [open, setOpen] = useState(false); const [theme, setTheme] = useState<'light'|'dark'>(stored('theme', 'light') === 'dark' ? 'dark' : 'light'); const location = useLocation();

 useEffect(() => { document.documentElement.dataset.theme = theme; persist('theme', theme); }, [theme]);
 useEffect(() => { setOpen(false);document.getElementById('main')?.focus();window.scrollTo(0,0); }, [location.pathname]);
 useEffect(()=>{document.documentElement.lang=i18n.language;document.title=`${t('brand')} · ${t('tagline')}`;},[i18n.language,t]);
 const changeLocale=(locale:'es'|'en')=>{void transition(async()=>{persist('locale',locale);await i18n.changeLanguage(locale);update(p=>({...p,preferences:{...p.preferences,language:locale},updated:new Date().toISOString()}));},{kind:'language'});};
 const changeTheme=()=>{const value=theme==='light'?'dark':'light';void transition(()=>{setTheme(value);update(p=>({...p,preferences:{...p.preferences,theme:value},updated:new Date().toISOString()}));},{kind:'theme'});};
 useEffect(()=>{const apply=()=>setTheme(stored('theme','light')==='dark'?'dark':'light');window.addEventListener('theme-preference',apply);return()=>window.removeEventListener('theme-preference',apply);},[]);
 useEffect(()=>{const measure=()=>{document.documentElement.style.setProperty('--header-height',`${document.querySelector('.header')?.getBoundingClientRect().height||85}px`);document.documentElement.style.setProperty('--footer-height',`${document.querySelector('.footer')?.getBoundingClientRect().height||60}px`);};const observer=new ResizeObserver(measure);for(const element of document.querySelectorAll('.header,.footer'))observer.observe(element);measure();return()=>observer.disconnect();},[]);
 const ThemeIcon = theme === 'dark' ? Moon : Sun;
 return <div className={location.pathname.startsWith('/learn/')?'app-shell learning-shell':'app-shell'}><a className="skip" href="#main" onClick={e=>{e.preventDefault();document.getElementById('main')?.focus();}}>{t('skip')}</a><header className="header"><div className="header-inner"><Link className="brand" to="/"><span className="brand-icon"><Terminal size={23} aria-hidden/></span>linux<span className="brand-accent">lab</span><span className="brand-dot">.</span></Link><button className="icon-button menu-toggle" aria-label={t(open ? 'close' : 'menu')} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button><nav aria-label={t('courses')} className={open ? 'nav open' : 'nav'}>{[['courses','/courses'],['dashboard','/dashboard'],['resources','/resources'],['about','/about']].map(([label,path]) => <NavLink key={path} to={path}>{t(label)}</NavLink>)}</nav><div className="header-tools"><LanguageButton language={i18n.language} onChange={changeLocale}/><button className="icon-button theme-button" aria-label={`${t('theme')}: ${t(theme)}`} onClick={changeTheme}><ThemeIcon size={20}/></button><Link className="button small account-link" to="/account" aria-label={t(user ? 'account' : 'signIn')}><span>{t(user ? 'account' : 'signIn')}</span><UserRound size={18} aria-hidden/></Link></div></div></header><main id="main" tabIndex={-1}><div className="route-enter" key={location.pathname.startsWith('/learn/')?'/learn':location.pathname}><Suspense fallback={<div className="container page" role="status">{t('loading')}</div>}><Outlet/></Suspense></div></main><footer className="footer"><div><Link className="brand" to="/">linux<span className="brand-accent">lab.</span></Link></div><div><Link to="/about">{t('about')}</Link><Link to="/resources">{t('resources')}</Link><a href="https://github.com/chepelcr/Comandos-linux">GitHub</a></div><div className="footer-studio"><a href={studio.url} target="_blank" rel="noopener noreferrer"><span>{localized(studio.label,i18n.language)}</span><img src={`${import.meta.env.BASE_URL}${studio.logo}`} alt="" width="32" height="32" loading="lazy"/><strong>{studio.name}</strong></a></div></footer></div>;
}
