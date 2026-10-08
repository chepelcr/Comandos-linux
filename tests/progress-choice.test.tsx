// @vitest-environment jsdom
import React,{act} from 'react';
import { createRoot,type Root } from 'react-dom/client';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { Providers,useApp } from '../src/app/providers';
import { complete,empty } from '../src/services/progress';
const auth=vi.hoisted(()=>({student:null as unknown}));
vi.mock('../src/app/config',()=>({config:{api:'https://progress.example'},authConfigured:true}));
vi.mock('../src/app/auth',()=>({currentStudent:async()=>auth.student,freshToken:async()=>'token',login:vi.fn(),logout:vi.fn()}));
vi.mock('aws-amplify/utils',()=>({Hub:{listen:()=>()=>{}}}));
let root:Root;let container:HTMLDivElement;let requests:{method:string;body?:unknown}[];
function Probe(){const app=useApp();return <output data-testid="completed">{app.progress.completed.join(',')}</output>;}
async function render(){container=document.createElement('div');document.body.append(container);root=createRoot(container);await act(async()=>{root.render(<Providers><Probe/></Providers>);});await act(async()=>{await vi.advanceTimersByTimeAsync(1300);});}
async function click(text:string){const button=[...container.querySelectorAll('button')].find(el=>el.textContent===text);expect(button).toBeDefined();await act(async()=>button!.click());}
beforeEach(()=>{vi.useFakeTimers();localStorage.clear();localStorage.setItem('locale','en');auth.student={profile:{sub:'student-a'},access_token:'token'};requests=[];Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});});
afterEach(async()=>{if(root)await act(async()=>root.unmount());container?.remove();vi.useRealTimers();vi.unstubAllGlobals();});
function network(){let remote=complete(empty(),'apache');vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{const method=init.method;const body=init.body?JSON.parse(init.body):undefined;requests.push({method,body});if(method==='DELETE')remote={...empty(),epoch:1};if(method==='POST')remote={...remote,...body};return {ok:true,status:200,json:async()=>remote};}));}
describe('account progress choice',()=>{
 it('does not upload or merge until the learner chooses online progress',async()=>{
  localStorage.setItem('progress:guest',JSON.stringify(complete(empty(),'intro')));network();await render();
  expect(requests.map(r=>r.method)).toEqual(['GET']);expect(container.textContent).toContain('Keep online progress');
  await click('Keep online progress');expect(container.querySelector('output')!.textContent).toBe('apache');
  expect(requests.some(r=>r.method==='POST'||r.method==='DELETE')).toBe(false);
  expect(JSON.parse(localStorage.getItem('progress:guest')!).completed).toEqual([]);
 });
 it('replaces online progress with local progress using the reset epoch',async()=>{
  localStorage.setItem('progress:guest',JSON.stringify(complete(empty(),'intro')));network();await render();
  await click('Keep local progress');expect(requests.map(r=>r.method)).toEqual(['GET','GET','DELETE','POST']);
  expect(requests.at(-1)!.body).toMatchObject({completed:['intro'],epoch:1});
  expect(container.querySelector('output')!.textContent).toBe('intro');
 });
 it('keeps local progress and the pending choice when the service is unavailable',async()=>{
  localStorage.setItem('progress:guest',JSON.stringify(complete(empty(),'intro')));network();await render();
  vi.stubGlobal('fetch',vi.fn(async()=>{throw new Error('offline');}));await click('Keep local progress');
  expect(container.querySelector('output')!.textContent).toBe('intro');
  expect(JSON.parse(localStorage.getItem('progress:guest')!).completed).toEqual(['intro']);
  expect(container.textContent).toContain('Keep local progress');
 });
});
