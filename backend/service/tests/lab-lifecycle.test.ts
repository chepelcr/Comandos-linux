import { describe,it,expect } from 'vitest';
import { LabLifecycle,MAX_MS,IDLE_MS,type Lab,type LabStore,type Snapshot } from '../src/labs/LabLifecycle';
function setup(){
 const records=new Map<string,Snapshot>();let version=0,time=1000;const terminated:string[]=[];
 const store:LabStore={async read(owner){return structuredClone(records.get(owner)||{lab:null});},async write(lab,v){if(records.get(lab.owner)?.version!==v)return false;records.set(lab.owner,{lab:structuredClone(lab),version:String(++version)});return true;}};
 const launches:Lab[]=[];let release:(()=>void)|undefined;
 const compute={async launch(lab:Lab){launches.push(lab);if(release===undefined&&hold)await new Promise<void>(r=>{release=r;});return `i-${lab.id}`;},async terminate(lab:Lab){terminated.push(lab.id);return !!lab.instanceId||time-lab.startedAt>60000;}};
 let hold=false;const api=new LabLifecycle(store,compute,()=>time);
 return {api,terminated,launches,store,advance:(ms:number)=>{time+=ms;},hold:()=>{hold=true;},release:()=>release?.()};
}
describe('account-wide temporary lab lifecycle',()=>{
 it('allows exactly one concurrent start across routes, tabs and devices',async()=>{const x=setup();const results=await Promise.allSettled([x.api.start('alice','apache'),x.api.start('alice','node-install')]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(x.launches).toHaveLength(1);await expect(x.api.start('alice','git')).rejects.toMatchObject({status:409});});
 it('keeps accounts isolated and permits a new route only after ending',async()=>{const x=setup();const a=await x.api.start('alice','apache');await x.api.start('bob','git');await x.api.end('alice');expect(x.terminated).toContain(a.id);expect((await x.api.get('bob'))?.state).toBe('running');expect((await x.api.start('alice','git')).route).toBe('git');});
 it('logout during provisioning terminates a late EC2 launch and never unlocks early',async()=>{const x=setup();x.hold();const starting=x.api.start('alice','apache');await new Promise(r=>setTimeout(r,0));expect((await x.api.end('alice'))?.state).toBe('ending');await expect(x.api.start('alice','git')).rejects.toMatchObject({status:409});x.release();await expect(starting).rejects.toMatchObject({status:409});expect(x.terminated).toHaveLength(2);expect((await x.api.get('alice'))?.state).toBe('ended');});
 it('terminates idle labs after 30 minutes without a browser heartbeat',async()=>{const x=setup();await x.api.start('alice','git');x.advance(IDLE_MS);await x.api.reap('alice');expect((await x.api.get('alice'))?.state).toBe('ended');});
 it('terminal input can reset inactivity but cannot extend the absolute 90 minute maximum',async()=>{const x=setup();const lab=await x.api.start('alice','git');for(let i=0;i<4;i++){x.advance(20*60000);await x.api.activity('alice',lab.id);}x.advance(MAX_MS-80*60000);await expect(x.api.activity('alice',lab.id)).rejects.toMatchObject({status:410});expect((await x.api.get('alice'))?.state).toBe('ended');});
 it('does not release the lock when AWS termination fails',async()=>{const x=setup();const lab=await x.api.start('alice','git');const current=await x.store.read('alice');await x.store.write({...lab,instanceId:undefined},current.version);expect((await x.api.end('alice'))?.state).toBe('ending');await expect(x.api.start('alice','apache')).rejects.toMatchObject({status:409});});
});
