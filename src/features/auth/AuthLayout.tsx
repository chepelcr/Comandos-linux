import { Suspense, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Terminal, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageButton } from '../../components/LanguageButton';
import { stored,persist } from '../../app/i18n';
import { transition } from '../../app/transitions';
import { updateMetadata } from '../../app/seo';
import { useApp } from '../../app/providers';
import { useAuthFlow } from './AuthContext';
import { safeReturnPath } from './password';
export default function AuthLayout(){
 const {t,i18n}=useTranslation(),app=useApp(),flow=useAuthFlow(),location=useLocation();
 const [theme,setTheme]=useState(()=>stored('theme','light')==='dark'?'dark':'light');
 useEffect(()=>{updateMetadata(location.pathname,i18n.language);document.getElementById('main')?.focus();window.scrollTo(0,0);},[location.pathname,i18n.language]);
 useEffect(()=>{if(location.state?.returnTo)flow.setReturnTo(safeReturnPath(location.state.returnTo));},[location.state,flow.setReturnTo]);
 useEffect(()=>{const apply=()=>setTheme(stored('theme','light')==='dark'?'dark':'light');window.addEventListener('theme-preference',apply);return()=>window.removeEventListener('theme-preference',apply);},[]);
 const language=(value:'es'|'en')=>{void transition(async()=>{persist('locale',value);await i18n.changeLanguage(value);app.update(p=>({...p,preferences:{...p.preferences,language:value}}));},{kind:'language'});};
 const toggle=()=>{const value=theme==='dark'?'light':'dark';void transition(()=>{setTheme(value);document.documentElement.dataset.theme=value;persist('theme',value);app.update(p=>({...p,preferences:{...p.preferences,theme:value}}));},{kind:'theme'});};
 return <div className="auth-shell"><a className="skip" href="#main">{t('skip')}</a><header className="header auth-header"><div className="header-inner"><Link className="brand" to="/"><span className="brand-icon"><Terminal size={23} aria-hidden/></span>linux<span className="brand-accent">lab.</span></Link><div className="header-tools"><LanguageButton language={i18n.language} onChange={language}/><button className="icon-button theme-button" onClick={toggle} aria-label={`${t('theme')}: ${t(theme)}`}>{theme==='dark'?<Moon size={20}/>:<Sun size={20}/>}</button><Link className="icon-button" to="/" aria-label={t('backHome')}><ArrowLeft size={20}/></Link></div></div></header><main id="main" tabIndex={-1} className="auth-main"><div className="auth-grid"><section className="auth-card"><Suspense fallback={<div className="form-skeleton" aria-busy="true" aria-label={t('loading')}><h1>{t('loading')}</h1><span/><span/><span/></div>}><Outlet/></Suspense></section><aside className="auth-story"><span className="eyebrow">{t('authEyebrow')}</span><h2>{t('authStoryTitle')}</h2><p className="lead">{t('authStoryDescription')}</p><div className="auth-command" aria-hidden="true">$ next_step --keep-learning<span className="cursor"/></div></aside></div></main><footer className="auth-footer"><Link to="/privacy">{t('privacyPage')}</Link><Link to="/terms">{t('terms')}</Link><a href="https://pacific-code-labs.jcampos.dev/" target="_blank" rel="noopener noreferrer">Pacific Code Labs</a></footer></div>;
}
