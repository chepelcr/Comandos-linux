// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {afterEach,it,expect,vi} from 'vitest';
const session={id:'lab-1',route:'foundations',state:'running',expiresAt:Date.now()+90*60_000,idleExpiresAt:Date.now()+30*60_000};
vi.mock('../src/app/providers',()=>({useApp:()=>({user:{profile:{sub:'student'}},progress:{exercises:[]},update:vi.fn()})}));
vi.mock('../src/app/labs',()=>({useLab:()=>({state:{session,available:true},busy:false,error:'',start:vi.fn(),end:vi.fn()})}));
vi.mock('../src/app/content',()=>({courses:[],lessons:[],localized:vi.fn(),lessonPath:()=>'/learn/foundations/intro'}));
vi.mock('../src/app/config',()=>({config:{region:'us-east-1'}}));
vi.mock('../src/services/labs',()=>({labRequest:vi.fn(async()=>({streamUrl:'wss://example.invalid',token:'test'})),LabRequestError:class extends Error{status=500}}));
vi.mock('../src/services/ssm-terminal',()=>({connectTerminal:vi.fn((_credentials,callbacks)=>{queueMicrotask(callbacks.ready);return {resize:vi.fn(),close:vi.fn(),input:vi.fn()}})}));
vi.mock('@xterm/xterm',()=>({Terminal:class{cols=80;rows=24;loadAddon(){}open(){}onData(){return {dispose(){}}}dispose(){}write(){}focus(){}}}));
vi.mock('@xterm/addon-fit',()=>({FitAddon:class{fit(){}}}));
vi.mock('react-i18next',()=>({useTranslation:()=>({t:(key:string,args?:{minutes:number})=>args?`${key} ${args.minutes}`:key,i18n:{language:'en'}})}));
import {InlineLab} from '../src/components/InlineLab';
afterEach(()=>vi.unstubAllGlobals());
it('puts live connection and countdown in the header, keeping the footer for exercise checks',async()=>{
 vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener(){},removeEventListener(){}}));
 vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 try{
  await act(async()=>root.render(<MemoryRouter><InlineLab route="foundations" lesson="intro"/></MemoryRouter>));
  const header=host.querySelector('.inline-lab-heading')!;
  expect(header.querySelector('.lab-connection')?.getAttribute('aria-label')).toBe('labConnected');
  expect(header.querySelector('.lab-timer')?.getAttribute('aria-label')).toMatch(/labRemaining 30 \(\d+:\d{2}\)/);
  expect(host.querySelector('.terminal-status')).toBeNull();expect(host.querySelector('.lab-deadline')).toBeNull();expect(host.querySelector('.lab-session-note')).toBeNull();
  expect(host.querySelector('.inline-lab-check button')?.textContent).toBe('labCheck');
 }finally{await act(async()=>root.unmount());host.remove()}
});
