import type { Lab } from './LabLifecycle';
import { HttpError } from '../utils/HttpError';
export type Slot = { lab: Lab | null; version?: string };
export interface SlotStore { read(slot:number):Promise<Slot>; write(slot:number,lab:Lab|null,version?:string):Promise<boolean>; }
/** Durable slots never expire automatically: only confirmed EC2 teardown frees capacity. */
export class FleetSlots {
 constructor(private store:SlotStore,private capacity=4){}
 async claim(lab:Lab){
  for(let slot=0;slot<this.capacity;slot++){
   const current=await this.store.read(slot);
   if(current.lab?.id===lab.id)return slot;
   if(!current.lab&&await this.store.write(slot,lab,current.version))return slot;
  }
  throw new HttpError(429,'All four lab slots are in use. Please try again later.');
 }
 async reap(canRelease:(lab:Lab)=>Promise<boolean>){
  for(let slot=0;slot<this.capacity;slot++){
   const current=await this.store.read(slot);
   if(current.lab&&await canRelease(current.lab))await this.store.write(slot,null,current.version);
  }
 }
}
