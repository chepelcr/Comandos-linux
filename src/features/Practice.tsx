import { useEffect,useRef,useState } from 'react';
import { useNavigate,useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Terminal,Play,Square,RotateCcw,Download,Upload,Eye } from 'lucide-react';
import { useApp } from '../app/providers';
import { lessons,localized } from '../app/content';
import { Select } from '../components/Select';
import { workspace } from '../services/lab-storage';
import {exercises,useCurriculum} from '../repositories/curriculum';
import { CodeBlock } from '../components/ui';
import { previewDocument } from '../services/lab-preview';
type Reply={requestId?:string;error?:string;data?:string;status?:number;contentType?:string;verified?:boolean;id?:string};
export default function Practice(){
 useCurriculum();
 const {t,i18n}=useTranslation();const {lessonId}=useParams();const navigate=useNavigate();const lesson=lessons.some(l=>l.id===lessonId)?lessonId!:'intro';
 const [running,setRunning]=useState(false),[status,setStatus]=useState(''),[output,setOutput]=useState(''),[ready,setReady]=useState(false),[preview,setPreview]=useState(''),[busy,setBusy]=useState(false);
 const frame=useRef<HTMLIFrameElement>(null),previewFrame=useRef<HTMLIFrameElement>(null),file=useRef<HTMLInputElement>(null),pending=useRef(new Map<string,{resolve:(value:Reply)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>()),restore=useRef<string|undefined>(undefined),nonce=useRef(crypto.randomUUID());
 const {update,user}=useApp();const account=user?.profile.sub||'guest';const previousAccount=useRef(account);const runtime=`${import.meta.env.BASE_URL}lab/runtime/index.html`;
 function request(type:string,data:Record<string,unknown>={}):Promise<Reply>{return new Promise((resolve,reject)=>{const requestId=crypto.randomUUID();const timer=setTimeout(()=>{pending.current.delete(requestId);reject(Error('Lab request timed out'));},50000);pending.current.set(requestId,{resolve,reject,timer});frame.current?.contentWindow?.postMessage({channel:'linux-lab',type,requestId,...data},location.origin);});}
 async function save(){const result=await request('export');if(!result.data)throw Error('Empty export');await workspace(account,result.data);return result.data;}
 useEffect(()=>{if(previousAccount.current!==account){setRunning(false);setReady(false);setPreview('');previousAccount.current=account;}},[account]);
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{
   if(event.source===previewFrame.current?.contentWindow&&event.data?.channel==='linux-preview'&&event.data.nonce===nonce.current){
    const {id,path,method,body}=event.data;if(typeof id!=='string'||typeof path!=='string'||!/^\/api\/(health|notes(?:\/[a-zA-Z0-9-]+)?)$/.test(path)||!['GET','POST','PATCH'].includes(method))return;
    void request('http',{path,method,body}).then(result=>previewFrame.current?.contentWindow?.postMessage({...result,channel:'linux-preview',nonce:nonce.current,id},'*'),()=>previewFrame.current?.contentWindow?.postMessage({channel:'linux-preview',nonce:nonce.current,id,error:t('labPreviewError')},'*'));return;
   }
   if(event.origin!==location.origin||event.source!==frame.current?.contentWindow||event.data?.channel!=='linux-lab')return;
   const message=event.data;
   if(message.type==='status'){setStatus(String(message.value));if(message.value==='labReady'){setReady(true);if(restore.current){const data=restore.current;restore.current=undefined;void request('import',{data}).then(()=>setStatus('labRestored'),()=>setStatus('labRestoreError'));}}}
   if(message.type==='output')setOutput(p=>(p+String(message.value)).slice(-12000));
   const value=message.value as Reply;
   if(value?.requestId){const operation=pending.current.get(value.requestId);if(operation){clearTimeout(operation.timer);pending.current.delete(value.requestId);if(value.error)operation.reject(Error(value.error));else operation.resolve(value);}}
   if(message.type==='check'){if(value?.verified===true&&value.id===lesson){update(p=>({...p,exercises:[...p.exercises,lesson],updated:new Date().toISOString()}));setStatus('labVerified');}else setStatus('labCheckFailed');}
  };
  window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
 },[lesson,update,account,t]);
 useEffect(()=>{if(!running||!ready)return;const timer=setInterval(()=>{void save().then(()=>setStatus('labSaved'),()=>setStatus('labSaveError'));},30000);return()=>clearInterval(timer);},[running,ready,account]);
 useEffect(()=>()=>{for(const operation of pending.current.values()){clearTimeout(operation.timer);operation.reject(Error('Lab closed'));}pending.current.clear();},[]);
 async function boot(){setStatus('labStarting');try{const response=await fetch(`${import.meta.env.BASE_URL}lab/runtime/manifest.json`);if(!response.ok)throw Error();const manifest=await response.json();if(!manifest.engine)throw Error();try{restore.current=await workspace(account);}catch{restore.current=undefined;}setRunning(true);}catch{setStatus('labMissing');}}
 async function stop(){setBusy(true);try{if(ready)await save();setRunning(false);setReady(false);setPreview('');setStatus('labSaved');}catch{setStatus('labSaveError');}finally{setBusy(false);}}
 async function exportFiles(){setBusy(true);try{const data=await save();const blob=new Blob([Uint8Array.from(atob(data),c=>c.charCodeAt(0))],{type:'application/gzip'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='linux-lab-workspace.tar.gz';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('labSaved');}catch{setStatus('labSaveError');}finally{setBusy(false);}}
 async function importFiles(selected?:File){if(!selected)return;setBusy(true);try{if(selected.size>32*1024*1024)throw Error();const bytes=new Uint8Array(await selected.arrayBuffer());let data='';for(let i=0;i<bytes.length;i+=8192)data+=String.fromCharCode(...bytes.subarray(i,i+8192));const encoded=btoa(data);await request('import',{data:encoded});await workspace(account,encoded);setStatus('labRestored');}catch{setStatus('labRestoreError');}finally{setBusy(false);if(file.current)file.current.value='';}}
 async function showPreview(){setBusy(true);try{const get=async(path:string)=>{const response=await request('http',{path,method:'GET'});if(response.status!==200||!response.data)throw Error();return new TextDecoder().decode(Uint8Array.from(atob(response.data),c=>c.charCodeAt(0)));};nonce.current=crypto.randomUUID();setPreview(await previewDocument(await get('/'),get,nonce.current));setStatus('labPreviewReady');}catch{setStatus('labPreviewError');}finally{setBusy(false);}}
 return <div className="container page lab-page"><span className="eyebrow">{t('practice')}</span><h1>{t('labTitle')}</h1><p className="lead">{t('labDescription')}</p><div className="lab-toolbar"><Select id="exercise" label={t('exercise')} value={lesson} onChange={value=>navigate(`/practice/${value}`)} options={lessons.map(l=>({value:l.id,label:localized(l.title,i18n.language)}))}/>{!running?<button className="button" onClick={()=>void boot()}><Play size={17}/>{t('boot')}</button>:<><button disabled={busy} onClick={()=>void stop()}><Square size={17}/>{t('stop')}</button><button disabled={busy} onClick={()=>{if(confirm(t('labResetConfirm'))){void workspace(account,null);setRunning(false);setReady(false);setPreview('');setOutput('');setStatus('');}}}><RotateCcw size={17}/>{t('labReset')}</button><button disabled={!ready||busy} onClick={()=>void request('check',{id:lesson}).catch(()=>setStatus('labCheckFailed'))}>{t('labCheck')}</button></>}</div><p role="status">{status&&t(status)}</p><div className="lab-container">{running?<iframe ref={frame} src={runtime} title={t('labTitle')}/>:<div className="lab-empty"><Terminal size={48}/><h2>{t('labTitle')}</h2><p>{t('labRequirements')}</p><span className="pill">{t('localOnly')}</span></div>}</div>{running&&<div className="lab-toolbar"><button disabled={!ready||busy} onClick={()=>void exportFiles()}><Download size={17}/>{t('labExport')}</button><button disabled={!ready||busy} onClick={()=>file.current?.click()}><Upload size={17}/>{t('labImport')}</button><input ref={file} type="file" accept=".gz,.tgz" hidden onChange={event=>void importFiles(event.target.files?.[0])}/><button disabled={!ready||busy} onClick={()=>void showPreview()}><Eye size={17}/>{t('labPreview')}</button></div>}{preview&&<section className="lab-preview"><h2>{t('labPreview')}</h2><iframe ref={previewFrame} title={t('labPreview')} sandbox="allow-scripts" srcDoc={preview}/></section>}<details className="lab-instructions"><summary>{t('steps')}</summary><CodeBlock code={exercises.find(item=>item.id===lesson)!.code}/></details><details><summary>{t('labOutput')}</summary><pre className="lab-console">{output}</pre></details><div className="callout"><p>{t('privacy')}</p><p>{t('labExportHint')}</p></div></div>;
}
