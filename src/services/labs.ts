import { config } from '../app/config';
import { freshToken } from '../app/auth';
export type LabSession={id:string;route:string;state:'starting'|'running'|'ending';startedAt:number;lastInputAt:number;expiresAt:number;idleExpiresAt:number};
export type LabState={available:boolean;session:LabSession|null};
export class LabRequestError extends Error{constructor(public status:number){super(`Lab request failed (${status})`);}}
export async function labRequest<T>(path='',method='GET',body?:unknown):Promise<T>{
 const token=await freshToken();if(!token)throw new Error('Session expired');
 const result=await fetch(`${config.api}/labs${path}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
 if(!result.ok)throw new LabRequestError(result.status);
 return result.status===204?undefined as T:result.json();
}
export async function endActiveLab(){
 if(!config.api)return;
 // Keep credentials until AWS confirms termination. A second tab/device may own
 // the lab even if this browser has never visited the lesson.
 for(let attempt=0;attempt<20;attempt++){
  let result:{session:LabSession|null}|undefined;
  try{result=await labRequest<{session:LabSession|null}|undefined>('','DELETE');}catch(error){if(error instanceof LabRequestError&&[429,503].includes(error.status)&&attempt<19){await new Promise(resolve=>setTimeout(resolve,1500));continue;}throw error;}
  if(!result?.session){window.dispatchEvent(new Event('labs-ended'));return;}
  await new Promise(resolve=>setTimeout(resolve,1500));
 }
 throw new Error(document.documentElement.lang==='es'?'No se pudo finalizar el laboratorio. Reintenta cerrar sesión.':'Could not end your lab. Please retry signing out.');
}
