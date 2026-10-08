import { describe,it,expect } from 'vitest';
import { ProgressService } from '../src/services/ProgressService';
import { progressInput,calculatePoints,type ProgressRecord } from '../src/models/ProgressSchema';
import type { ProgressStore } from '../src/repositories/ProgressRepository';
class Store implements ProgressStore {rows=new Map<string,ProgressRecord>();conflict=true;async get(id:string){return this.rows.get(id);}async put(p:ProgressRecord,old?:ProgressRecord){if(this.conflict){this.conflict=false;return false;}if(this.rows.get(p.userId)?.revision!==old?.revision)return false;this.rows.set(p.userId,p);return true;}async delete(id:string){this.rows.delete(id);}}
const input={completed:['intro'],exercises:[],bookmarks:[],lastLesson:'intro',epoch:0,preferences:{}};
describe('account progress service',()=>{
 it('isolates users and retries conditional writes without duplicate XP',async()=>{const store=new Store(),service=new ProgressService(store);await service.sync('alice',input);const repeat=await service.sync('alice',input);expect(repeat.points).toBe(10);expect((await service.get('bob')).completed).toEqual([]);});
 it('reset epoch prevents stale devices resurrecting deleted progress',async()=>{const service=new ProgressService(new Store());await service.sync('alice',input);await service.reset('alice');await expect(service.sync('alice',input)).rejects.toMatchObject({status:409});expect((await service.get('alice')).points).toBe(0);});
 it('rejects unknown lessons and client-supplied points or ownership',()=>{expect(()=>progressInput.parse({...input,points:10000})).toThrow();expect(()=>progressInput.parse({...input,userId:'bob'})).toThrow();expect(()=>progressInput.parse({...input,completed:['fake']})).toThrow();});
 it('separates reading and client reported Linux verification',()=>{expect(calculatePoints({...input,exercises:['intro']})).toBe(30);});
});
