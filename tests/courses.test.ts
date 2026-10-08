import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({session: vi.fn(), guest: vi.fn()}));
vi.mock('aws-amplify/auth', () => ({fetchAuthSession: mocks.session}));
vi.mock('../src/app/config', () => ({config: {coursesApi:'https://courses.example/',coursesIdentity:'guest-pool',region:'us-east-1'}}));
vi.mock('../src/services/public-content', () => ({signedPublicGet: mocks.guest}));
import { getPublishedCourses } from '../src/services/courses';
describe('published curriculum transport', () => {
 beforeEach(() => {vi.resetAllMocks();vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}')));});
 it('uses guest IAM without reading a student session for visitors', async () => {
  const signal=new AbortController().signal;
  await getPublishedCourses(null,signal);
  expect(mocks.guest).toHaveBeenCalledWith(expect.objectContaining({identityPoolId:'guest-pool'}),'/api/public/courses',{signal});
  expect(mocks.session).not.toHaveBeenCalled();expect(fetch).not.toHaveBeenCalled();
 });
 it('uses a refreshed student access token on the student endpoint after login',async()=>{
  mocks.session.mockResolvedValue({tokens:{accessToken:{payload:{sub:'student'},toString:()=> 'access-token'}}});
  const signal=new AbortController().signal;await getPublishedCourses('student',signal);
  expect(fetch).toHaveBeenCalledWith('https://courses.example/api/student/courses',{signal,headers:{Authorization:'Bearer access-token'}});
  expect(mocks.guest).not.toHaveBeenCalled();
 });
 it('rejects expired or switched accounts without silently using guest access',async()=>{
  for(const tokens of [undefined,{accessToken:{payload:{sub:'other'},toString:()=> 'wrong-token'}}]){
   mocks.session.mockResolvedValue({tokens});await expect(getPublishedCourses('student',new AbortController().signal)).rejects.toThrow('Student session changed');
  }
  expect(fetch).not.toHaveBeenCalled();expect(mocks.guest).not.toHaveBeenCalled();
 });
 it('does not issue a student request after its identity switch was cancelled',async()=>{
  mocks.session.mockResolvedValue({tokens:{accessToken:{payload:{sub:'student'},toString:()=> 'access-token'}}});
  const controller=new AbortController();controller.abort();
  await expect(getPublishedCourses('student',controller.signal)).rejects.toMatchObject({name:'AbortError'});expect(fetch).not.toHaveBeenCalled();
 });
});
