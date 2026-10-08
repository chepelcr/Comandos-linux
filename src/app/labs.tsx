import { createContext,useContext,useEffect,useState,useCallback,useRef,type ReactNode } from 'react';
import { useApp } from './providers';
import { labRequest,endActiveLab,LabRequestError,type LabState } from '../services/labs';
const LabContext=createContext({} as {state:LabState;busy:boolean;error:string;refresh:()=>Promise<void>;start:(route:string)=>Promise<void>;end:()=>Promise<void>});
export const useLab=()=>useContext(LabContext);
export function LabProvider({children}:{children:ReactNode}){
 const {user}=useApp();
 const owner=useRef(user?.profile.sub);owner.current=user?.profile.sub;
 const revision=useRef(0),working=useRef(false);
 const [state,setState]=useState<LabState>({available:false,session:null});
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const refresh=useCallback(async()=>{
  if(!user){revision.current++;setState({available:false,session:null});return;}
  if(working.current)return;
  const expected=user.profile.sub,request=++revision.current;
  const result=await labRequest<LabState>();
  if(owner.current===expected&&request===revision.current){setState(result);setError(value=>value==='labLoadFailed'?'':value);}
 },[user]);
 useEffect(()=>{
  let disposed=false;
  const load=()=>{void refresh().catch(()=>{if(!disposed&&owner.current===user?.profile.sub)setError('labLoadFailed');});};
  const ended=()=>{revision.current++;setState(s=>({...s,session:null}));};
  load();const timer=setInterval(load,15_000);
  window.addEventListener('focus',load);window.addEventListener('labs-ended',ended);
  return()=>{disposed=true;clearInterval(timer);window.removeEventListener('focus',load);window.removeEventListener('labs-ended',ended);};
 },[refresh]);
 useEffect(()=>{
  const session=state.session;if(!user||session?.state!=='running')return;
  let lastSent=0,timer:ReturnType<typeof setTimeout>|undefined;
  const send=()=>{lastSent=Date.now();void labRequest('/activity','POST',{id:session.id}).catch(()=>{});};
  const interact=(event:Event)=>{
   // Browser-generated terminal replies and hidden tabs cannot renew inactivity.
   if(!event.isTrusted||document.visibilityState!=='visible'||!(event.target instanceof Element)||!event.target.closest('.lesson-layout,.mobile-lab-drawer,.lab-drawer-trigger'))return;
   if(timer)clearTimeout(timer);
   if(Date.now()-lastSent>=10_000)send();else timer=setTimeout(send,10_000-(Date.now()-lastSent));
  };
  const events=['keydown','pointerdown','wheel','touchstart','paste'];for(const name of events)document.addEventListener(name,interact,{capture:true,passive:true});
  return()=>{if(timer)clearTimeout(timer);for(const name of events)document.removeEventListener(name,interact,true);};
 },[user,state.session?.id,state.session?.state]);
 const start=async(route:string)=>{
  if(working.current||!user)return;
  working.current=true;setBusy(true);setError('');
  const expected=user.profile.sub,request=++revision.current;
  try{
   const result=await labRequest<{session:LabState['session']}>('','POST',{route});
   if(owner.current===expected&&request===revision.current)setState(s=>({...s,session:result.session}));
  }catch(error){
   if(owner.current===expected)setError(error instanceof LabRequestError&&error.status===429?'labCapacityReached':'labStartFailed');
   working.current=false;await refresh().catch(()=>{});
  }finally{working.current=false;setBusy(false);}
 };
 const end=async()=>{
  if(working.current)return;
  working.current=true;revision.current++;setBusy(true);setError('');
  try{await endActiveLab();}catch{setError('labEndFailed');}
  finally{working.current=false;setBusy(false);}
 };
 return <LabContext value={{state,busy,error,refresh,start,end}}>{children}</LabContext>;
}
