import {describe,it,expect,vi} from 'vitest';
const transport=vi.hoisted(()=>vi.fn());
vi.mock('../src/services/courses',()=>({getPublishedCourses:transport}));
vi.mock('../src/app/config',()=>({config:{coursesApi:'https://courses.example',coursesIdentity:'guest-pool'}}));
import {bundledDocuments,compatibleDocuments,loadCurriculum,lessons} from '../src/repositories/curriculum';
describe('published curriculum boundary',()=>{
 it('accepts bilingual copy updates without changing lab or progression rules',()=>{
  const copy=structuredClone(bundledDocuments);
  copy.lessons[0].title.es='Introducción actualizada';
  copy.lessons[0].title.en='Updated introduction';
  expect(compatibleDocuments(copy)).toBe(true);
 });
 it('rejects rule changes and malformed documents without throwing',()=>{
  const changed=structuredClone(bundledDocuments);changed.lessons[0].id='different';
  expect(compatibleDocuments(changed)).toBe(false);
  for(const lessons of [[null],[{id:7}],null])expect(compatibleDocuments({...bundledDocuments,lessons})).toBe(false);
  expect(compatibleDocuments({...bundledDocuments,'source-documents':[]})).toBe(false);
 });
});

describe('curriculum identity changes',()=>{
 it('ignores a late guest response after switching to the student transport',async()=>{
  let finishGuest!:(response:Response)=>void;
  const guest=new Promise<Response>(resolve=>{finishGuest=resolve;});
  const studentDocs=structuredClone(bundledDocuments);studentDocs.lessons[0].title.en='Student published snapshot';
  const guestDocs=structuredClone(bundledDocuments);guestDocs.lessons[0].title.en='Obsolete guest response';
  transport.mockImplementation((subject:string|null)=>subject?Promise.resolve(new Response(JSON.stringify({version:1,releaseId:'student-release',sequence:1,documents:studentDocs}))):guest);
  const previous=loadCurriculum(null);const signal=transport.mock.calls[0][1] as AbortSignal;
  await loadCurriculum('student');expect(signal.aborted).toBe(true);
  finishGuest(new Response(JSON.stringify({version:1,releaseId:'guest-release',sequence:2,documents:guestDocs})));await previous;
  expect(lessons[0].title.en).toBe('Student published snapshot');
  transport.mockResolvedValue(new Response(JSON.stringify({version:1,releaseId:'guest-release',sequence:2,documents:bundledDocuments})));
  await loadCurriculum(null);expect(transport).toHaveBeenLastCalledWith(null,expect.any(AbortSignal));
  expect(lessons[0].title.en).toBe(bundledDocuments.lessons[0].title.en);
 });
});
