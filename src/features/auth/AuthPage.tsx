import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { signIn,confirmSignIn,confirmSignUp,resendSignUpCode,resetPassword,confirmResetPassword,type SignInOutput } from 'aws-amplify/auth';
import { useTranslation } from 'react-i18next';
import { authConfigured } from '../../app/config';
import { useApp } from '../../app/providers';
import { useAuthFlow } from './AuthContext';
import Registration from './Registration';
import { RegistrationSteps } from './RegistrationSteps';
import { PasswordField } from './PasswordField';
import { passwordValid,safeReturnPath } from './password';
const titles:Record<string,string>={'/login':'signIn','/register':'signUp','/verify-email':'verifyEmail','/forgot-password':'resetPassword','/reset-password':'resetPassword','/set-password':'newPassword','/auth/challenge':'verifySignIn'};
export default function AuthPage(){
 const {t}=useTranslation(),app=useApp(),flow=useAuthFlow(),location=useLocation(),navigate=useNavigate();
 const path=location.pathname.replace(/\/+$/,'');
 const [password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[sent,setSent]=useState(false);
 const alert=useRef<HTMLParagraphElement>(null);
 const newPassword=['/register','/reset-password','/set-password'].includes(path),needsCode=['/verify-email','/reset-password','/auth/challenge'].includes(path),needsPassword=newPassword||path==='/login';
 useEffect(()=>{if(error)alert.current?.focus();},[error]);
 async function next(result:SignInOutput){
  setPassword('');setConfirmation('');setCode('');
  switch(result.nextStep.signInStep){
   case 'DONE':return; // Hub loads account and resolves progress before redirecting below.
   case 'CONFIRM_SIGN_UP':await resendSignUpCode({username:flow.email.trim()});navigate('/verify-email');return;
   case 'RESET_PASSWORD':await resetPassword({username:flow.email.trim()});navigate('/reset-password');return;
   case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':navigate('/set-password');return;
   case 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE':case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':navigate('/auth/challenge');return;
   default:setError(t('authStepUnavailable'));navigate('/login');
  }
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setError('');
  if(newPassword&&!passwordValid(password)){setError(t('passwordPolicyError'));return;}
  if(newPassword&&password!==confirmation){setError(t('passwordMismatch'));return;}
  if(!flow.email.trim()&&path!=='/auth/challenge'&&path!=='/set-password'){setError(t('emailRequired'));return;}
  if(!event.currentTarget.checkValidity()){event.currentTarget.reportValidity();return;}
  setBusy(true);flow.setNotice('');
  try{
   const username=flow.email.trim();
   if(path==='/login')await next(await signIn({username,password,options:{authFlowType:'USER_SRP_AUTH'}}));
   else if(path==='/verify-email'){await confirmSignUp({username,confirmationCode:code.trim()});flow.setNotice(t('accountVerified'));navigate('/login');}
   else if(path==='/forgot-password'){
    const result=await resetPassword({username});
    if(result.nextStep.resetPasswordStep==='DONE'){flow.setNotice(t('passwordUpdated'));navigate('/login');}else navigate('/reset-password');
   }else if(path==='/reset-password'){await confirmResetPassword({username,confirmationCode:code.trim(),newPassword:password});setPassword('');setConfirmation('');flow.setNotice(t('passwordUpdated'));navigate('/login');}
   else await next(await confirmSignIn({challengeResponse:path==='/set-password'?password:code.trim()}));
  }catch(cause){
   const name=(cause as Error).name;
   if(name==='UserUnconfirmedException'){navigate('/verify-email');return;}
   if(name==='PasswordResetRequiredException'){navigate('/forgot-password');return;}
   setError(t(name==='NotAuthorizedException'||name==='UserNotFoundException'?'invalidCredentials':name==='UsernameExistsException'?'emailExists':name==='CodeMismatchException'?'invalidCode':name==='ExpiredCodeException'?'expiredCode':name==='InvalidPasswordException'?'passwordPolicyError':name==='LimitExceededException'||name==='TooManyRequestsException'?'authRateLimit':name==='SignInException'?'authChallengeExpired':'authFormError'));
  }finally{setBusy(false);}
 }
 if(path==='/register')return <Registration/>;
 const returnTo=safeReturnPath(flow.returnTo);
 if(app.user&&!app.progressChoicePending&&app.status!=='pending')return <Navigate to={returnTo} replace/>;
 return <><span className="eyebrow">{t('authEyebrow')}</span><h1>{t(titles[path]||'signIn')}</h1>{path==='/verify-email'&&<RegistrationSteps step={4}/>}<p className="muted">{t(path==='/login'?'signInDescription':path==='/register'?'registerDescription':path==='/forgot-password'?'resetPasswordDescription':needsCode?'enterAuthCode':'passwordHelp')}</p>{!authConfigured?<p role="status">{t('authUnavailable')}</p>:<form onSubmit={event=>{void submit(event);}} aria-label={t(titles[path]||'signIn')} aria-busy={busy}>
  {!['/set-password','/auth/challenge'].includes(path)&&<><label htmlFor={path==='/register'?'signup-email':'signin-email'}>{t('email')}</label><input id={path==='/register'?'signup-email':'signin-email'} type="email" inputMode="email" autoComplete="username" value={flow.email} onChange={event=>flow.setEmail(event.target.value)} required/></>}
  {needsCode&&<><label htmlFor="signin-code">{t('verificationCode')}</label><input id="signin-code" autoComplete="one-time-code" inputMode="numeric" value={code} onChange={event=>setCode(event.target.value)} required/></>}
  {needsPassword&&<PasswordField id={path==='/register'?'signup-password':'signin-password'} value={password} onChange={setPassword} newPassword={newPassword}/>}
  {newPassword&&<PasswordField id="confirm-password" value={confirmation} onChange={setConfirmation} confirm newPassword/>}

  <p ref={alert} className="error" role="alert" tabIndex={-1}>{error}</p><p role="status">{flow.notice}</p>
  <button type="submit" className="button" disabled={busy||Boolean(app.user)}>{t(busy||app.user?'loading':path==='/register'?'signUp':path==='/forgot-password'?'sendResetCode':needsCode?'verifyEmail':path==='/set-password'?'updatePassword':'signIn')}</button>
  {path==='/verify-email'&&<button type="button" disabled={busy||sent} onClick={()=>{setBusy(true);setError('');void resendSignUpCode({username:flow.email.trim()}).then(()=>setSent(true),()=>setError(t('authFormError'))).finally(()=>setBusy(false));}}>{t(sent?'codeSent':'resendCode')}</button>}
 </form>}<div className="auth-links">{path==='/login'?<><Link to="/forgot-password">{t('forgotPassword')}</Link><Link to="/register">{t('signUp')}</Link></>:<Link to="/login">{t('backToSignIn')}</Link>}</div></>;
}
