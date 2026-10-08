import React, { lazy, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Navigate, useParams } from 'react-router-dom';
import './app/i18n';
import { LabProvider } from './app/labs';
import { lessonPath } from './app/content';
import { Providers } from './app/providers';
import Layout from './components/Layout';
import { ConsentNotice } from './features/auth/ConsentNotice';
import AuthLayout from './features/auth/AuthLayout';
import { AuthContext } from './features/auth/AuthContext';
import { AnimatedRoutes } from './components/AnimatedRoutes';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import './style.css';
const modules={landing:()=>import('./features/Landing'),courses:()=>import('./features/Courses'),lesson:()=>import('./features/Lesson'),dashboard:()=>import('./features/Dashboard'),account:()=>import('./features/Account'),resources:()=>import('./features/Resources'),legal:()=>import('./features/Legal'),auth:()=>import('./features/auth/AuthPage'),support:()=>import('./features/Support')};
const Landing=lazy(modules.landing),Courses=lazy(modules.courses),Lesson=lazy(modules.lesson),Dashboard=lazy(modules.dashboard),Account=lazy(modules.account),Resources=lazy(modules.resources),Legal=lazy(modules.legal),AuthPage=lazy(modules.auth),Support=lazy(modules.support);
const prepareRoute=(path:string)=>/^\/(login|register|verify-email|forgot-password|reset-password|set-password|auth)(\/|$)/.test(path)?modules.auth():path.startsWith('/support')?modules.support():path.startsWith('/learn/')?modules.lesson():/^\/(courses|workshops)/.test(path)?modules.courses():/^\/(privacy|terms)/.test(path)?modules.legal():path==='/dashboard'?modules.dashboard():/^\/(account|settings)/.test(path)?modules.account():/^\/(about|resources)/.test(path)?modules.resources():modules.landing();
function LegacyPractice(){const {lessonId}=useParams();return <Navigate to={lessonPath(lessonId||'intro')} replace/>;}
class Boundary extends Component<{children:ReactNode},{error:boolean}> { state={error:false}; static getDerivedStateFromError(){return {error:true};} render(){return this.state.error?<div className="container page"><p>Something went wrong / Algo salió mal.</p><button onClick={()=>location.reload()}>Retry / Reintentar</button></div>:this.props.children;} }
createRoot(document.getElementById('root')!).render(<React.StrictMode><Boundary><Providers><BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/,'') || '/'}><LabProvider><AuthContext><ConsentNotice/><AnimatedRoutes prepare={prepareRoute}><Route element={<Layout/>}><Route index element={<Landing/>}/><Route path="courses" element={<Courses/>}/><Route path="courses/:courseId" element={<Courses/>}/><Route path="workshops/:workshopId" element={<Courses/>}/><Route path="learn/:courseId/:lessonId" element={<Lesson/>}/><Route path="dashboard" element={<Dashboard/>}/><Route path="account" element={<Account/>}/><Route path="settings" element={<Account/>}/><Route path="support" element={<Support/>}/><Route path="support/:ticketId" element={<Support/>}/><Route path="resources" element={<Resources/>}/><Route path="about" element={<Resources about/>}/><Route path="privacy" element={<Legal page="privacy"/>}/><Route path="terms" element={<Legal page="terms"/>}/><Route path="practice" element={<LegacyPractice/>}/><Route path="practice/:lessonId" element={<LegacyPractice/>}/><Route path="*" element={<Navigate to="/courses" replace/>}/></Route><Route element={<AuthLayout/>}><Route path="account/policies" element={<ConsentNotice page/>}/>{["login","register","verify-email","forgot-password","reset-password","set-password","auth/challenge"].map(path=><Route key={path} path={path} element={<AuthPage key={path}/>}/>)}</Route></AnimatedRoutes></AuthContext></LabProvider></BrowserRouter></Providers></Boundary></React.StrictMode>);
