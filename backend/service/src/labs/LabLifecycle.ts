import { randomUUID } from 'node:crypto';
import { HttpError } from '../utils/HttpError';
export type Lab = { id:string; owner:string; route:string; state:'starting'|'running'|'ending'|'ended'; startedAt:number; lastInputAt:number; instanceId?:string };
export type Snapshot = { lab:Lab|null; version?:string };
export interface LabStore { read(owner:string):Promise<Snapshot>; write(lab:Lab,version?:string):Promise<boolean>; }
export interface LabCompute { launch(lab:Lab):Promise<string>; terminate(lab:Lab):Promise<boolean>; }
export const IDLE_MS=30*60_000, MAX_MS=90*60_000;
export const expired=(lab:Lab,now:number)=>now-lab.startedAt>=MAX_MS||now-lab.lastInputAt>=IDLE_MS;
/** Single S3 object per verified subject is the account-wide CAS lock. Never a per-route key. */
export class LabLifecycle {
 constructor(private store:LabStore,private compute:LabCompute,private now=()=>Date.now()){}
 async get(owner:string){return (await this.store.read(owner)).lab;}
 async start(owner:string,route:string):Promise<Lab>{
  const previous=await this.store.read(owner);
  if(previous.lab&&previous.lab.state!=='ended')throw new HttpError(409,'End your current lab before starting another.');
  const now=this.now();const lab:Lab={id:randomUUID(),owner,route,state:'starting',startedAt:now,lastInputAt:now};
  if(!await this.store.write(lab,previous.version))throw new HttpError(409,'Another lab is already starting.');
  try {
   const instanceId=await this.compute.launch(lab);
   const current=await this.store.read(owner);
   if(current.lab?.id!==lab.id||current.lab.state!=='starting'){
    // Logout can arrive while EC2 is launching. The new instance must not escape it.
    await this.compute.terminate({...lab,instanceId});
    if(current.lab?.id===lab.id)await this.store.write({...lab,instanceId,state:'ended'},current.version);
    throw new HttpError(409,'Lab was ended while starting.');
   }
   const running:Lab={...lab,instanceId,state:'running'};
   if(!await this.store.write(running,current.version)){
    await this.compute.terminate(running);
    throw new HttpError(409,'Lab changed while starting.');
   }
   return running;
  }catch(error){
   // A network timeout may hide a successful RunInstances call. Keep the lock;
   // the reaper finds the tagged instance and ends it. Never unlock on ambiguity.
   const current=await this.store.read(owner);
   if(current.lab?.id===lab.id&&current.lab.state==='starting')await this.store.write({...current.lab,state:error instanceof HttpError&&[429,503].includes(error.status)?'ended':'ending'},current.version);
   throw error;
  }
 }
 async end(owner:string):Promise<Lab|null>{
  for(let retry=0;retry<6;retry++){
   const current=await this.store.read(owner);const lab=current.lab;
   if(!lab||lab.state==='ended')return lab;
   if(lab.state!=='ending'){
    if(!await this.store.write({...lab,state:'ending'},current.version))continue;
   }
   const stopped=await this.compute.terminate(lab);
   const after=await this.store.read(owner);
   if(after.lab?.id!==lab.id)return after.lab;
   if(stopped){if(!await this.store.write({...after.lab,state:'ended'},after.version))continue;return {...after.lab,state:'ended'};}
   return after.lab;
  }
  throw new HttpError(409,'Lab is changing. Please retry.');
 }
 async activity(owner:string,id:string){
  for(let retry=0;retry<6;retry++){
   const current=await this.store.read(owner);const lab=current.lab;
   if(!lab||lab.id!==id||lab.state!=='running')throw new HttpError(409,'This lab is no longer active.');
   if(expired(lab,this.now())){await this.end(owner);throw new HttpError(410,'Lab expired.');}
   if(await this.store.write({...lab,lastInputAt:this.now()},current.version))return;
  }
  throw new HttpError(409,'Please retry.');
 }
 async reap(owner:string){const lab=await this.get(owner);if(lab&&lab.state!=='ended'&&(lab.state==='ending'||expired(lab,this.now())))await this.end(owner);}
}
