import { useState, type FormEvent } from 'react';
import { confirmResetPassword, confirmSignIn, confirmSignUp, resendSignUpCode, resetPassword, signIn, type SignInOutput } from 'aws-amplify/auth';
import { useTranslation } from 'react-i18next';

type Step = 'signin' | 'reset' | 'resetCode' | 'verify' | 'challenge' | 'newPassword';
export default function SignIn({ onRegister }: { onRegister: () => void }) {
 const { t } = useTranslation();
 const [step, setStep] = useState<Step>('signin');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [code, setCode] = useState('');
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [notice, setNotice] = useState('');
 const [sent, setSent] = useState(false);
 const changeStep = (next: Step) => { setStep(next); setPassword(''); setCode(''); setError(''); setNotice(''); setSent(false); };
 async function startReset() {
  const result = await resetPassword({ username: email.trim() });
  changeStep(result.nextStep.resetPasswordStep === 'DONE' ? 'signin' : 'resetCode');
 }
 async function next(result: SignInOutput) {
  setPassword(''); setCode('');
  switch (result.nextStep.signInStep) {
   case 'DONE': return; // Amplify's signedIn event loads the account and reconciles progression.
   case 'CONFIRM_SIGN_UP':
    await resendSignUpCode({ username: email.trim() }); changeStep('verify'); return;
   case 'RESET_PASSWORD': await startReset(); return;
   case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
   case 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE':
   case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE': changeStep('challenge'); return;
   case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED': changeStep('newPassword'); return;
   default: changeStep('signin'); setError(t('authStepUnavailable'));
  }
 }
 async function submit(event: FormEvent) {
  event.preventDefault(); if (busy) return;
  setBusy(true); setError(''); setNotice('');
  try {
   if (step === 'signin') await next(await signIn({ username: email.trim(), password, options: { authFlowType: 'USER_SRP_AUTH' } }));
   else if (step === 'reset') await startReset();
   else if (step === 'resetCode') {
    await confirmResetPassword({ username: email.trim(), confirmationCode: code.trim(), newPassword: password });
    changeStep('signin'); setNotice(t('passwordUpdated'));
   } else if (step === 'verify') {
    await confirmSignUp({ username: email.trim(), confirmationCode: code.trim() });
    changeStep('signin'); setNotice(t('accountVerified'));
   } else await next(await confirmSignIn({ challengeResponse: step === 'newPassword' ? password : code.trim() }));
  } catch (cause) {
   const name = (cause as Error).name;
   setError(t(name === 'NotAuthorizedException' || name === 'UserNotFoundException' ? 'invalidCredentials' : name === 'CodeMismatchException' ? 'invalidCode' : name === 'ExpiredCodeException' ? 'expiredCode' : name === 'InvalidPasswordException' ? 'passwordHelp' : name === 'LimitExceededException' || name === 'TooManyRequestsException' ? 'authRateLimit' : 'authFormError'));
  } finally { setBusy(false); }
 }
 const needsCode = step === 'resetCode' || step === 'verify' || step === 'challenge';
 const needsPassword = step === 'signin' || step === 'resetCode' || step === 'newPassword';
 const newPassword = step === 'resetCode' || step === 'newPassword';
 const title = step === 'signin' ? 'signIn' : step === 'verify' || step === 'challenge' ? 'verifyEmail' : 'resetPassword';
 return <div className="register-panel signin-panel">
  <h2>{t(title)}</h2>
  <p className="muted">{t(step === 'signin' ? 'signInDescription' : step === 'reset' ? 'resetPasswordDescription' : needsCode ? 'enterAuthCode' : 'passwordHelp')}</p>
  <form onSubmit={event => { void submit(event); }} aria-label={t(title)} aria-busy={busy}>
   <label htmlFor="signin-email">{t('email')}</label>
   <input id="signin-email" type="email" autoComplete="username" inputMode="email" value={email} readOnly={step !== 'signin' && step !== 'reset'} onChange={event => setEmail(event.target.value)} required />
   {needsCode && <><label htmlFor="signin-code">{t('verificationCode')}</label><input id="signin-code" autoComplete="one-time-code" inputMode="numeric" value={code} onChange={event => setCode(event.target.value)} required /></>}
   {needsPassword && <><label htmlFor="signin-password">{t(newPassword ? 'newPassword' : 'password')}</label><input id="signin-password" type="password" autoComplete={newPassword ? 'new-password' : 'current-password'} minLength={newPassword ? 12 : undefined} value={password} onChange={event => setPassword(event.target.value)} aria-describedby={newPassword ? 'signin-password-help' : undefined} required />{newPassword && <p id="signin-password-help">{t('passwordHelp')}</p>}</>}
   <p className="error" role="alert">{error}</p><p role="status">{notice}</p>
   <div className="actions"><button className="button" disabled={busy}>{t(busy ? 'loading' : step === 'signin' ? 'signIn' : step === 'reset' ? 'sendResetCode' : step === 'verify' || step === 'challenge' ? 'verifyEmail' : 'updatePassword')}</button>{step !== 'signin' && <button type="button" disabled={busy} onClick={() => changeStep('signin')}>{t('backToSignIn')}</button>}</div>
   {step === 'signin' && <div className="auth-alternatives"><button type="button" disabled={busy} onClick={() => changeStep('reset')}>{t('forgotPassword')}</button><button type="button" disabled={busy} onClick={onRegister}>{t('signUp')}</button></div>}
   {step === 'verify' && <button type="button" disabled={sent || busy} onClick={() => { setBusy(true); setError(''); void resendSignUpCode({ username: email.trim() }).then(() => setSent(true), () => setError(t('authFormError'))).finally(() => setBusy(false)); }}>{t(sent ? 'codeSent' : 'resendCode')}</button>}
  </form>
 </div>;
}
