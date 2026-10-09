import { useEffect,useRef,useState,type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Terminal as TerminalIcon,Play,Square,Clock,ArrowUpRight,CheckCircle2 } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useApp } from '../app/providers';
import { useLab } from '../app/labs';
import { lessonPath,lessons,courses,localized } from '../app/content';
import { config } from '../app/config';
import { labRequest,LabRequestError } from '../services/labs';
import { connectTerminal } from '../services/ssm-terminal';
import { LabLoading } from './LabLoading';
type TerminalStatus='labConnecting'|'labConnected'|'labConnectionLost';
function LabTerminal({id,status,setStatus,attempt}:{id:string;status:TerminalStatus;setStatus:(status:TerminalStatus)=>void;attempt:number}){
 const host=useRef<HTMLDivElement>(null);const {t}=useTranslation();
 useEffect(()=>{
  if(!host.current)return;setStatus('labConnecting');let disposed=false;let channel:ReturnType<typeof connectTerminal>|undefined;
  const terminal=new Terminal({fontFamily:'JetBrains Mono, monospace',fontSize:13,theme:{background:'#101521',foreground:'#e4e8f7'},cursorBlink:true,convertEol:false,scrollback:3000});const fit=new FitAddon();terminal.loadAddon(fit);terminal.open(host.current);fit.fit();
  const observer=new ResizeObserver(()=>{fit.fit();channel?.resize(terminal.cols,terminal.rows);});observer.observe(host.current);
  const input=terminal.onData(data=>{channel?.input(data);});
  void (async()=>{
   for(let retry=0;retry<40&&!disposed;retry++){
    try{const result=await labRequest<{streamUrl:string;token:string}>('/connect','POST');if(disposed)return;channel=connectTerminal(result,{region:config.region,output:data=>terminal.write(data),ready:()=>{setStatus('labConnected');channel?.resize(terminal.cols,terminal.rows);terminal.focus();},closed:()=>{if(!disposed)setStatus('labConnectionLost');}});return;
    }catch(error){if(disposed)return;if(error instanceof LabRequestError&&[425,429,503].includes(error.status)&&retry<39){await new Promise(resolve=>setTimeout(resolve,3000));continue;}setStatus('labConnectionLost');return;}
   }
  })();
  return()=>{disposed=true;observer.disconnect();input.dispose();channel?.close();terminal.dispose();};
 },[id,attempt,setStatus]);
 return <div className="lab-terminal-shell" aria-busy={status==='labConnecting'}><div ref={host} className="ec2-terminal" aria-label={t('terminal')} />{status==='labConnecting'&&<LabLoading/>}</div>;
}
export function InlineLab({route,lesson}:{route:string;lesson:string}){
 const [mobile,setMobile]=useState(()=>matchMedia('(max-width:800px)').matches);const [drawerOpen,setDrawerOpen]=useState(false);const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const media=matchMedia('(max-width:800px)');const resize=()=>setMobile(media.matches);media.addEventListener('change',resize);return()=>media.removeEventListener('change',resize);},[]);
 useEffect(()=>{if(!mobile||!dialog.current)return;if(drawerOpen&&!dialog.current.open)dialog.current.showModal();else if(!drawerOpen&&dialog.current.open)dialog.current.close();},[mobile,drawerOpen]);
 const {t,i18n}=useTranslation();const {t:labText}=useTranslation('labControls');const {user,update,progress}=useApp();const [checking,setChecking]=useState(false);const [checkStatus,setCheckStatus]=useState('');const {state,busy,error,start,end}=useLab();const [now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const session=state.session;const scope=useRef('');scope.current=`${user?.profile.sub}:${session?.id}:${lesson}`;
 useEffect(()=>{setCheckStatus('');setChecking(false);},[lesson,user?.profile.sub,session?.id]);
 const [terminalStatus,setTerminalStatus]=useState<TerminalStatus>('labConnecting'),[connectionAttempt,setConnectionAttempt]=useState(0);
 const remainingSeconds=session?Math.max(0,Math.ceil((Math.min(session.expiresAt,session.idleExpiresAt)-now)/1000)):0;
 const countdown=`${Math.floor(remainingSeconds/60)}:${String(remainingSeconds%60).padStart(2,'0')}`;
 const timeLabel=`${t('labRemaining',{minutes:Math.ceil(remainingSeconds/60)})} (${countdown})`;
 const verified=progress.exercises.includes(lesson);
 const same=session?.route===route;const otherPath=courses.find(c=>c.id===session?.route);const firstLesson=lessons.find(l=>l.course===session?.route);
 const check=async()=>{if(checking)return;setChecking(true);setCheckStatus('');const expected=scope.current;try{
  const {command}=await labRequest<{command:string}>('/check','POST',{lesson});
  for(let i=0;i<20;i++){await new Promise(resolve=>setTimeout(resolve,1500));if(scope.current!==expected)return;const result=await labRequest<{pending:boolean;verified?:boolean;lesson?:string}>(`/check/${command}`);
   if(scope.current!==expected)return;if(result.pending)continue;if(result.verified&&result.lesson===lesson){update(p=>({...p,exercises:[...p.exercises,lesson],updated:new Date().toISOString()}));setCheckStatus('labVerified');}else setCheckStatus('labCheckFailed');return;
  }setCheckStatus('labCheckTimeout');
 }catch{if(scope.current===expected)setCheckStatus('labCheckUnavailable');}finally{if(scope.current===expected)setChecking(false);}};
 const content=<><div className="inline-lab-heading"><div><span className="eyebrow">{t('practice')}</span><h2 id="inline-lab-title"><TerminalIcon size={20}/>{t('terminal')}</h2></div>{session&&<div className="lab-header-indicators">{same&&session.state==='running'&&<div className="lab-header-hint"><button type="button" className={`icon-button lab-connection ${terminalStatus}`} aria-label={`${t(terminalStatus)}${terminalStatus==='labConnectionLost'?` · ${t('labReconnect')}`:''}`} onClick={()=>{if(terminalStatus==='labConnectionLost')setConnectionAttempt(n=>n+1);}}><span className="lab-connection-light" aria-hidden="true"/></button><span className="lab-header-tooltip">{labText(terminalStatus)}</span></div>}<div className="lab-header-hint"><button type="button" className="icon-button lab-timer" aria-label={timeLabel} style={{'--clock-angle':`${-remainingSeconds*6}deg`} as CSSProperties}><Clock size={20} aria-hidden="true"/></button><span className="lab-header-tooltip">{countdown}</span></div></div>}{mobile&&<button className="icon-button" aria-label={t('labCloseDrawer')} onClick={()=>setDrawerOpen(false)}>×</button>}{session&&<button className="danger lab-end-button" aria-label={t(busy?'labEnding':'labEnd')} disabled={busy} onClick={()=>{void end();}}><Square size={15}/><span className="lab-end-label">{t(busy?'labEnding':'labEnd')}</span></button>}</div>
 {session&&!same?<div className="lab-start-panel"><TerminalIcon size={36}/><h3>{t('labOtherRoute')}</h3><p>{t('labOtherRouteDescription')}</p><Link className="button secondary" to={lessonPath(firstLesson?.id||'intro')}>{otherPath?localized(otherPath.title,i18n.language):t('continue')}<ArrowUpRight size={16}/></Link></div>:same&&session.state==='running'?<LabTerminal id={session.id} status={terminalStatus} setStatus={setTerminalStatus} attempt={connectionAttempt}/>:busy&&!session||same&&session?.state==='starting'?<div className="lab-terminal-shell" aria-busy="true"><LabLoading/></div>:<div className="lab-start-panel"><TerminalIcon size={40}/><h3>{t('labStartTitle')}</h3>{mobile?<details className="lab-rules"><summary>{t('labSessionLimits')}</summary><p>{t('labSessionRules')}</p></details>:<p>{t('labSessionRules')}</p>}{!user?<Link className="button" to="/login" state={{returnTo:lessonPath(lesson)}}>{t('labSignIn')}</Link>:<><button className="button" disabled={busy||Boolean(session)||!state.available} onClick={()=>{void start(route);}}><Play size={17}/>{t(busy?'labStarting':session?'labEnding':'labStart')}</button>{!state.available&&<p className="muted">{t('labPreparing')}</p>}</>}</div>}
 {same&&session?.state==='running'&&<div className={`inline-lab-check${checkStatus==='labVerified'||!checkStatus&&verified?' is-verified':''}`}><button disabled={busy||checking} onClick={()=>{void check();}}>{t(checking?'loading':verified?'labRecheck':'labCheck')}</button><span role="status">{(checkStatus==='labVerified'||!checkStatus&&verified)&&<CheckCircle2 size={16} aria-hidden/>}{checkStatus?t(checkStatus):verified?t('labVerified'):''}</span></div>}
 {error&&<p className="error" role="alert">{t(error)}</p>}
 </>;
 return mobile?<><button className="button lab-drawer-trigger" aria-label={t('openLab')} title={t('openLab')} aria-haspopup="dialog" aria-expanded={drawerOpen} onClick={()=>setDrawerOpen(true)}><TerminalIcon size={22} aria-hidden="true"/>{session&&<span className="lab-active-dot" aria-label={t('labActive')}/>}</button><dialog ref={dialog} className="inline-lab mobile-lab-drawer" aria-labelledby="inline-lab-title" onCancel={e=>{e.preventDefault();setDrawerOpen(false);}} onClick={e=>{if(e.target===e.currentTarget){const rect=e.currentTarget.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)setDrawerOpen(false);}}}>{content}</dialog></>:<aside className="inline-lab" aria-labelledby="inline-lab-title">{content}</aside>;

}
