import { describe,it,expect } from 'vitest';
import { FleetSlots,type SlotStore,type Slot } from '../src/labs/FleetSlots';
import type { Lab } from '../src/labs/LabLifecycle';
const lab=(id:string):Lab=>({id,owner:id,route:'foundations',state:'starting',startedAt:0,lastInputAt:0});
function memory(){const slots=new Map<number,Slot>();let revision=0;const store:SlotStore={async read(i){return slots.get(i)||{lab:null};},async write(i,lab,version){if(slots.get(i)?.version!==version)return false;slots.set(i,{lab,version:String(++revision)});return true;}};return {slots,fleet:new FleetSlots(store)};}
describe('durable fleet capacity',()=>{
 it('caps simultaneous launches and preserves claims across retries',async()=>{const {fleet,slots}=memory();const results=await Promise.allSettled(Array.from({length:20},(_,i)=>fleet.claim(lab(String(i)))));expect(results.filter(r=>r.status==='fulfilled').length).toBeLessThanOrEqual(4);const owner=[...slots.values()].find(s=>s.lab)!.lab!;expect(await fleet.claim(owner)).toBeTypeOf('number');expect([...slots.values()].filter(s=>s.lab).length).toBeLessThanOrEqual(4);});
 it('keeps occupied slots until teardown is confirmed, then reuses capacity',async()=>{const {fleet}=memory();for(let i=0;i<4;i++)await fleet.claim(lab(String(i)));await fleet.reap(async()=>false);await expect(fleet.claim(lab('next'))).rejects.toMatchObject({status:429});await fleet.reap(async l=>l.id==='1');await expect(fleet.claim(lab('next'))).resolves.toBe(1);});
});
