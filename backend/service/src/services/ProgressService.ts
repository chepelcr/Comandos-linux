import { blank,calculatePoints,progressInput,type ProgressRecord } from '../models/ProgressSchema';
import type { ProgressStore } from '../repositories/ProgressRepository';
import { HttpError } from '../utils/HttpError';
export class ProgressService {
 constructor(private readonly repository:ProgressStore){}
 async get(userId:string){return await this.repository.get(userId)||blank(userId);}
 async sync(userId:string,body:unknown){const incoming=progressInput.parse(body);for(let attempt=0;attempt<5;attempt++){const old=await this.repository.get(userId);const current=old||blank(userId);if(incoming.epoch!==current.epoch)throw new HttpError(409,'Progress was reset. Reload current progress.');const next:ProgressRecord={...current,completed:[...new Set([...current.completed,...incoming.completed])],exercises:[...new Set([...current.exercises,...incoming.exercises])],bookmarks:incoming.bookmarks,lastLesson:incoming.lastLesson,preferences:{...current.preferences,...incoming.preferences},updated:new Date().toISOString(),revision:current.revision+1};next.points=calculatePoints(next);if(await this.repository.put(next,old))return next;}throw new HttpError(409,'Concurrent update. Retry sync.');}
 async reset(userId:string){for(let attempt=0;attempt<5;attempt++){const old=await this.repository.get(userId);const next={...blank(userId,(old?.epoch||0)+1),revision:(old?.revision||0)+1,updated:new Date().toISOString()};if(await this.repository.put(next,old))return next;}throw new HttpError(409,'Concurrent update. Retry reset.');}
 async delete(userId:string){await this.repository.delete(userId);}
}
