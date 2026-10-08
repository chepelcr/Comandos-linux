import { describe,it,expect } from 'vitest';
import { empty,complete,merge,sanitize,points } from '../src/services/progress';
import lessons from '../src/data/lessons.json';
describe('course rewards',()=>{
 it('awards each reading once, including after offline merge',()=>{const p=complete(empty(),'intro');expect(points(p)).toBe(10);expect(points(merge(p,complete(p,'intro')))).toBe(10);});
 it('rejects unknown ids and malformed stored data',()=>{expect(sanitize({completed:['intro','intro','invented',null],exercises:'intro'}).completed).toEqual(['intro']);expect(sanitize(null)).toEqual(empty());});
 it('awards the module once and ignores optional lesson for required completion',()=>{let p=empty();lessons.filter(l=>l.course==='legacy'&&!l.optional).forEach(l=>p=complete(p,l.id));expect(points(p)).toBe(p.completed.length*10+50);expect(points(merge(p,p))).toBe(points(p));});
});
