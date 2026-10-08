import { fetchAuthSession } from 'aws-amplify/auth';
import { config } from '../app/config';
import { signedPublicRequest } from './public-content';
export async function sendActivity(subject:string|null,signal:AbortSignal){
 if(subject){
  const session=await fetchAuthSession(),token=session.tokens?.accessToken;
  if(!token||token.payload.sub!==subject||signal.aborted)return;
  const response=await fetch(`${config.coursesApi.replace(/\/$/,'')}/api/student/activity`,{method:'POST',signal,headers:{Authorization:`Bearer ${token.toString()}`,'Content-Type':'application/json'},body:'{}'});
  if(!response.ok)throw new Error('Activity unavailable');
 }else if(config.coursesIdentity){
  const response=await signedPublicRequest({url:config.coursesApi,identityPoolId:config.coursesIdentity,region:config.region},'/api/public/activity',{method:'POST',body:'{}',signal});
  if(!response.ok)throw new Error('Activity unavailable');
 }
}
export function trackActivity(subject:string|null){
 if(!config.coursesApi||navigator.doNotTrack==='1'||(navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl)return ()=>{};
 let lastActivity=Date.now(),pending=true,busy=false;const abort=new AbortController();
 const interacted=()=>{lastActivity=Date.now();pending=true;};
 const tick=async()=>{
  if(busy||!pending||document.visibilityState!=='visible'||Date.now()-lastActivity>=300000)return;
  busy=true;pending=false;
  try{await sendActivity(subject,AbortSignal.any([abort.signal,AbortSignal.timeout(10000)]));}catch{pending=true;/* Operational counts must never block learning. */}finally{busy=false;}
 };
 const events=['pointerdown','keydown','scroll'] as const;
 for(const name of events)window.addEventListener(name,interacted,{passive:true});
 const visible=()=>{if(document.visibilityState==='visible'){interacted();void tick();}};
 document.addEventListener('visibilitychange',visible);
 void tick();const timer=setInterval(()=>{void tick();},60000);
 return ()=>{abort.abort();clearInterval(timer);for(const name of events)window.removeEventListener(name,interacted);document.removeEventListener('visibilitychange',visible);};
}
