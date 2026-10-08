// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import '../src/app/i18n';
import SignIn from '../src/features/SignIn';
const auth = vi.hoisted(() => ({ signIn: vi.fn(), confirmSignIn: vi.fn(), resetPassword: vi.fn(), confirmResetPassword: vi.fn(), confirmSignUp: vi.fn(), resendSignUpCode: vi.fn() }));
vi.mock('aws-amplify/auth', () => auth);
let root: Root; let container: HTMLDivElement;
async function fill(id: string, value: string) { await act(async () => { const input = container.querySelector<HTMLInputElement>(id)!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); }); }
async function submit() { await act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }); }
async function click(text: string) { await act(async () => { [...container.querySelectorAll('button')].find(button => button.textContent === text)!.click(); }); }
beforeEach(async () => { vi.resetAllMocks(); Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); const { default: i18n } = await import('../src/app/i18n'); await i18n.changeLanguage('en'); container = document.createElement('div'); document.body.append(container); root = createRoot(container); await act(async () => root.render(<SignIn onRegister={vi.fn()} />)); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
describe('in-app Amplify authentication', () => {
 it('uses SRP and completes a challenge in the form without navigation', async () => {
  auth.signIn.mockResolvedValue({ nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE' } });
  auth.confirmSignIn.mockResolvedValue({ nextStep: { signInStep: 'DONE' } });
  await fill('#signin-email', 'student@example.com'); await fill('#signin-password', 'Valid-password9!'); await submit();
  expect(auth.signIn).toHaveBeenCalledWith({ username: 'student@example.com', password: 'Valid-password9!', options: { authFlowType: 'USER_SRP_AUTH' } });
  expect(container.querySelector('#signin-password')).toBeNull();
  await fill('#signin-code', '123456'); await submit();
  expect(auth.confirmSignIn).toHaveBeenCalledWith({ challengeResponse: '123456' });
 });
 it('recovers a password and returns to sign-in with cleared secrets', async () => {
  auth.resetPassword.mockResolvedValue({ nextStep: { resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE' } });
  auth.confirmResetPassword.mockResolvedValue(undefined);
  await fill('#signin-email', 'student@example.com'); await click('Forgot your password?'); await submit();
  await fill('#signin-code', '123456'); await fill('#signin-password', 'Replacement-password9!'); await submit();
  expect(auth.confirmResetPassword).toHaveBeenCalledWith({ username: 'student@example.com', confirmationCode: '123456', newPassword: 'Replacement-password9!' });
  expect(container.textContent).toContain('Password updated'); expect(container.querySelector<HTMLInputElement>('#signin-password')!.value).toBe('');
 });
 it('lets an unconfirmed student verify before signing in', async () => {
  auth.signIn.mockResolvedValue({ nextStep: { signInStep: 'CONFIRM_SIGN_UP' } }); auth.resendSignUpCode.mockResolvedValue({}); auth.confirmSignUp.mockResolvedValue({});
  await fill('#signin-email', 'student@example.com'); await fill('#signin-password', 'Valid-password9!'); await submit();
  expect(auth.resendSignUpCode).toHaveBeenCalledWith({ username: 'student@example.com' });
  await fill('#signin-code', '654321'); await submit();
  expect(auth.confirmSignUp).toHaveBeenCalledWith({ username: 'student@example.com', confirmationCode: '654321' });
  expect(container.textContent).toContain('Your account is verified');
 });
 it('shows a neutral credential error and allows another attempt', async () => {
  auth.signIn.mockRejectedValue(Object.assign(new Error('internal AWS details'), { name: 'NotAuthorizedException' }));
  await fill('#signin-email', 'student@example.com'); await fill('#signin-password', 'wrong'); await submit();
  expect(container.querySelector('[role=alert]')!.textContent).toContain('email or password is incorrect');
  expect(container.textContent).not.toContain('internal AWS details');
  expect(container.querySelector<HTMLButtonElement>('button[type=submit], .actions button')!.disabled).toBe(false);
 });
});
