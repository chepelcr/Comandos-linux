// @vitest-environment jsdom
import { afterEach,describe,it,expect,vi } from 'vitest';
import { createRoot,type Root } from 'react-dom/client';
import { act } from 'react';
const mocks=vi.hoisted(()=>({user:{profile:{sub:'alice'}} as {profile:{sub:string}}|null,request:vi.fn(),end:vi.fn()}));
vi.mock('../src/app/providers',()=>({useApp:()=>({user:mocks.user})}));
vi.mock('../src/services/labs',()=>({labRequest:mocks.request,endActiveLab:mocks.end}));
import { LabProvider,useLab } from '../src/app/labs';
let root:Root|undefined,container:HTMLDivElement;
function Test(){const {state,start}=useLab();return <><span>{state.session?.route||'none'}</span><button onClick={()=>{void start('modern');}}>Start</button></>;}
async function render(){await act(async()=>{root!.render(<LabProvider><Test/></LabProvider>);});}
afterEach(async()=>{if(root)await act(async()=>root!.unmount());container?.remove();vi.resetAllMocks();mocks.user={profile:{sub:'alice'}};});
describe('persistent account lab UI',()=>{
 it('keeps the session while a lesson view rerenders',async()=>{
  mocks.request.mockResolvedValue({available:true,session:{id:'lab',route:'modern',state:'running'}});
  container=document.createElement('div');document.body.append(container);root=createRoot(container);await render();await render();expect(container.textContent).toContain('modern');
 });
 it('restores the existing server session after a full page remount without provisioning another instance',async()=>{
  mocks.request.mockResolvedValue({available:true,session:{id:'lab',route:'modern',state:'running'}});
  container=document.createElement('div');document.body.append(container);root=createRoot(container);await render();
  await act(async()=>root!.unmount());root=createRoot(container);await render();
  expect(container.textContent).toContain('modern');expect(mocks.request).toHaveBeenCalledTimes(2);
  for(const call of mocks.request.mock.calls)expect(call).toEqual([]);
 });
 it('only provisions a lab after the student explicitly starts it',async()=>{
  mocks.request.mockResolvedValue({available:true,session:null});
  container=document.createElement('div');document.body.append(container);root=createRoot(container);await render();await render();
  expect(mocks.request).toHaveBeenCalledTimes(1);expect(mocks.request).toHaveBeenCalledWith();
  mocks.request.mockResolvedValueOnce({session:{id:'new-lab',route:'modern',state:'running'}});
  await act(async()=>container.querySelector('button')!.click());
  expect(mocks.request).toHaveBeenLastCalledWith('','POST',{route:'modern'});
 });
 it('does not resurrect a lab from a late start response after logout',async()=>{
  let finish:(value:unknown)=>void=()=>{};mocks.request.mockResolvedValueOnce({available:true,session:null}).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
  container=document.createElement('div');document.body.append(container);root=createRoot(container);await render();
  await act(async()=>container.querySelector('button')!.click());mocks.user=null;await render();
  await act(async()=>finish({session:{id:'old',route:'modern',state:'running'}}));expect(container.querySelector('span')!.textContent).toBe('none');
 });
 it('invalidates an old status response when termination is confirmed in another UI action',async()=>{
  let finish:(value:unknown)=>void=()=>{};mocks.request.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
  container=document.createElement('div');document.body.append(container);root=createRoot(container);await render();
  await act(async()=>{window.dispatchEvent(new Event('labs-ended'));finish({available:true,session:{id:'old',route:'modern',state:'running'}});});expect(container.querySelector('span')!.textContent).toBe('none');
 });
});
