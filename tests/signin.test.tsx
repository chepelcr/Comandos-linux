// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot,type Root } from 'react-dom/client';
import { MemoryRouter,Routes,Route } from 'react-router-dom';
import { beforeEach,afterEach,describe,it,expect,vi } from 'vitest';
import '../src/app/i18n';
import AuthPage from '../src/features/auth/AuthPage';
import { AuthContext } from '../src/features/auth/AuthContext';
const rememberConsent=vi.hoisted(()=>vi.fn());
vi.mock('../src/services/consent',()=>({rememberRegistrationConsent:rememberConsent}));
const auth=vi.hoisted(()=>({signIn:vi.fn(),signUp:vi.fn(),confirmSignIn:vi.fn(),resetPassword:vi.fn(),confirmResetPassword:vi.fn(),confirmSignUp:vi.fn(),resendSignUpCode:vi.fn()}));
vi.mock('aws-amplify/auth',()=>auth);
vi.mock('../src/app/config',()=>({authConfigured:true}));
vi.mock('../src/app/providers',()=>({useApp:()=>({user:null,authReady:true,status:'guest',progressChoicePending:false})}));
let root:Root,container:HTMLDivElement;
async function fill(id:string,value:string){await act(async()=>{const input=container.querySelector<HTMLInputElement>(id)!;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});}
async function submit(){await act(async()=>{container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});}
async function render(path='/login'){await act(async()=>root.render(<MemoryRouter initialEntries={[path]}><AuthContext><Routes><Route path="*" element={<AuthPage/>}/></Routes></AuthContext></MemoryRouter>));}
beforeEach(async()=>{vi.resetAllMocks();Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const {default:i18n}=await import('../src/app/i18n');await i18n.changeLanguage('en');container=document.createElement('div');document.body.append(container);root=createRoot(container);});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
describe('dedicated Amplify authentication routes',()=>{
 it('uses SRP and clears the password before opening a challenge',async()=>{
  await render();auth.signIn.mockResolvedValue({nextStep:{signInStep:'CONFIRM_SIGN_IN_WITH_EMAIL_CODE'}});auth.confirmSignIn.mockResolvedValue({nextStep:{signInStep:'DONE'}});
  await fill('#signin-email','student@example.com');await fill('#signin-password','Existing9!');await submit();
  expect(auth.signIn).toHaveBeenCalledWith({username:'student@example.com',password:'Existing9!',options:{authFlowType:'USER_SRP_AUTH'}});
  expect(container.querySelector('#signin-password')).toBeNull();await fill('#signin-code','123456');await submit();expect(auth.confirmSignIn).toHaveBeenCalledWith({challengeResponse:'123456'});
 });
 it('requires confirmation and policy parity before resetting',async()=>{
  await render('/forgot-password');auth.resetPassword.mockResolvedValue({nextStep:{resetPasswordStep:'CONFIRM_RESET_PASSWORD_WITH_CODE'}});auth.confirmResetPassword.mockResolvedValue(undefined);
  await fill('#signin-email','student@example.com');await submit();await fill('#signin-code','123456');await fill('#signin-password','Replacement-password9!');await fill('#confirm-password','Different-password9!');await submit();
  expect(auth.confirmResetPassword).not.toHaveBeenCalled();expect(container.textContent).toContain('passwords do not match');
  await fill('#confirm-password','Replacement-password9!');await submit();expect(auth.confirmResetPassword).toHaveBeenCalledWith({username:'student@example.com',confirmationCode:'123456',newPassword:'Replacement-password9!'});expect(container.textContent).toContain('Password updated');expect(container.querySelector<HTMLInputElement>('#signin-password')!.value).toBe('');
 });
 it('verifies an unconfirmed student on a dedicated route',async()=>{
  await render();auth.signIn.mockResolvedValue({nextStep:{signInStep:'CONFIRM_SIGN_UP'}});auth.resendSignUpCode.mockResolvedValue({});auth.confirmSignUp.mockResolvedValue({});await fill('#signin-email','student@example.com');await fill('#signin-password','Valid-password9!');await submit();await fill('#signin-code','654321');await submit();expect(auth.confirmSignUp).toHaveBeenCalledWith({username:'student@example.com',confirmationCode:'654321'});expect(container.textContent).toContain('Your account is verified');
 });
 it('shows neutral credential errors without rejecting shorter existing passwords',async()=>{
  await render();auth.signIn.mockRejectedValue(Object.assign(new Error('internal AWS details'),{name:'NotAuthorizedException'}));await fill('#signin-email','student@example.com');await fill('#signin-password','wrong');await submit();expect(container.querySelector('[role=alert]')!.textContent).toContain('email or password is incorrect');expect(container.textContent).not.toContain('internal AWS details');
 });
 it('records explicit registration acknowledgement only after valid successful signup',async()=>{await render('/register');auth.signUp.mockResolvedValue({nextStep:{signUpStep:'CONFIRM_SIGN_UP'}});rememberConsent.mockResolvedValue(undefined);await fill('#signup-email','student@example.com');await fill('#signup-password','LongPassword9!');await fill('#confirm-password','LongPassword9!');await submit();expect(auth.signUp).not.toHaveBeenCalled();expect(rememberConsent).not.toHaveBeenCalled();await act(async()=>{container.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach(input=>input.click())});await submit();expect(auth.signUp).toHaveBeenCalledOnce();expect(rememberConsent).toHaveBeenCalledWith('student@example.com',{privacy:true,terms:true});expect(container.querySelector('#signin-code')).not.toBeNull();});
 it('shows strength and independent visibility controls on registration',async()=>{
  await render('/register');await fill('#signup-password','LongPassword9!');expect(container.textContent).toContain('Meets all requirements');await act(async()=>container.querySelector<HTMLButtonElement>('[aria-label="Show password"]')!.click());expect(container.querySelector('#signup-password')!.getAttribute('type')).toBe('text');expect(container.querySelector('#confirm-password')!.getAttribute('type')).toBe('password');
 });
});
