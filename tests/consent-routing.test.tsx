// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {MemoryRouter,Routes,Route,useLocation} from 'react-router-dom';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({load:vi.fn(),record:vi.fn(),user:{profile:{sub:'student',email:'student@example.invalid'}}}));
vi.mock('../src/app/providers',()=>({useApp:()=>({user:mocks.user})}));
vi.mock('../src/app/config',()=>({config:{api:'https://api.example'}}));
vi.mock('react-i18next',()=>({useTranslation:()=>({t:(key:string)=>key})}));
vi.mock('../src/services/consent',()=>({loadConsent:mocks.load,recordConsent:mocks.record,pendingRegistrationConsent:()=>null,clearRegistrationConsent:vi.fn(),visiblePolicyVersions:async()=>({privacy:'privacy-v1',terms:'terms-v1'})}));
import {ConsentNotice} from '../src/features/auth/ConsentNotice';
let host:HTMLDivElement,root:Root;
const missing={current:false,record:null,requiredPolicies:{privacy:{version:'privacy-v1'},terms:{version:'terms-v1'}}};
function Destination(){const location=useLocation();return <div data-destination>{location.pathname}:{location.state?.returnTo}</div>}
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});mocks.load.mockResolvedValue(missing);mocks.record.mockResolvedValue({...missing,current:true});host=document.createElement('div');document.body.append(host);root=createRoot(host)});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.clearAllMocks()});
describe('account policy flow',()=>{
 it('moves missing acceptance to a focused page with a return path, rather than a landing popup',async()=>{
  await act(async()=>root.render(<MemoryRouter initialEntries={['/learn/foundations/intro']}><ConsentNotice/><Routes><Route path="*" element={<Destination/>}/></Routes></MemoryRouter>));
  expect(host.querySelector('[data-destination]')?.textContent).toBe('/account/policies:/learn/foundations/intro');
  expect(host.querySelector('.consent-notice')).toBeNull();
 });
 it('allows policy documents to be read without redirecting back to acceptance',async()=>{
  await act(async()=>root.render(<MemoryRouter initialEntries={['/privacy']}><ConsentNotice/><Destination/></MemoryRouter>));
  expect(mocks.load).not.toHaveBeenCalled();expect(host.textContent).toBe('/privacy:');
 });
 it('records both explicit acceptances before returning to the lesson',async()=>{
  await act(async()=>root.render(<MemoryRouter initialEntries={[{pathname:'/account/policies',state:{returnTo:'/learn/foundations/intro'}}]}><Routes><Route path="/account/policies" element={<ConsentNotice page/>}/><Route path="*" element={<Destination/>}/></Routes></MemoryRouter>));
  expect(host.querySelector('h1')?.textContent).toBe('consentNoticeTitle');
  const button=host.querySelector('button')!;expect(button.disabled).toBe(true);
  await act(async()=>{host.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach(input=>input.click())});
  expect(button.disabled).toBe(false);expect(mocks.record).not.toHaveBeenCalled();
  await act(async()=>button.click());
  expect(mocks.record).toHaveBeenCalledWith({privacy:'privacy-v1',terms:'terms-v1'},'student');
  expect(host.querySelector('[data-destination]')?.textContent).toBe('/learn/foundations/intro:');
 });
});
