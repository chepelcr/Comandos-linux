import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Link,Navigate,useNavigate} from 'react-router-dom';
import {signUp} from 'aws-amplify/auth';
import {useTranslation} from 'react-i18next';
import {authConfigured} from '../../app/config';
import {useApp} from '../../app/providers';
import {useAuthFlow} from './AuthContext';
import {PasswordField} from './PasswordField';
import {passwordValid,safeReturnPath} from './password';
import {rememberRegistrationConsent} from '../../services/consent';
import {RegistrationSteps} from './RegistrationSteps';
export default function Registration(){
 const {t,i18n}=useTranslation(),{t:r}=useTranslation('registration');const app=useApp(),flow=useAuthFlow(),navigate=useNavigate();
 const [step,setStep]=useState(1),[name,setName]=useState(''),[handle,setHandle]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[privacy,setPrivacy]=useState(false),[terms,setTerms]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const heading=useRef<HTMLHeadingElement>(null),alert=useRef<HTMLParagraphElement>(null);
 useEffect(()=>{heading.current?.focus()},[step]);useEffect(()=>{if(error)alert.current?.focus()},[error]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setError('');
  if(!event.currentTarget.checkValidity()){event.currentTarget.reportValidity();return;}
  if(step===1){if(!name.trim()||!flow.email.trim()||!/^[A-Za-z0-9_][A-Za-z0-9_.-]{2,29}$/.test(handle)){setError(r('detailsError'));return;}setStep(2);return;}
  if(!passwordValid(password)){setError(t('passwordPolicyError'));setStep(2);return;}
  if(password!==confirmation){setError(t('passwordMismatch'));return;}
  if(step===2){setStep(3);return;}
  if(!privacy||!terms)return;
  setBusy(true);flow.setNotice('');
  try{
   const email=flow.email.trim();
   const result=await signUp({username:email,password,options:{userAttributes:{email,name:name.trim(),preferred_username:handle,locale:i18n.language.slice(0,2)}}});
   await rememberRegistrationConsent(email,{privacy:true,terms:true});setPassword('');setConfirmation('');
   if(result.nextStep.signUpStep==='CONFIRM_SIGN_UP')navigate('/verify-email');else{flow.setNotice(t('accountVerified'));navigate('/login');}
  }catch(cause){const code=(cause as Error).name;setError(t(code==='UsernameExistsException'?'emailExists':code==='InvalidPasswordException'?'passwordPolicyError':code==='LimitExceededException'||code==='TooManyRequestsException'?'authRateLimit':'authFormError'));}finally{setBusy(false);}
 }
 if(app.user&&!app.progressChoicePending&&app.status!=='pending')return <Navigate to={safeReturnPath(flow.returnTo)} replace/>;
 return <><span className="eyebrow">{t('authEyebrow')}</span><h1>{t('signUp')}</h1><RegistrationSteps step={step}/><h2 className="registration-step-title" ref={heading} tabIndex={-1}>{r(step===1?'detailsTitle':step===2?'passwordTitle':'policiesTitle')}</h2><p className="muted">{r(step===1?'detailsDescription':step===2?'passwordDescription':'policiesDescription')}</p>{!authConfigured?<p role="status">{t('authUnavailable')}</p>:<form onSubmit={event=>void submit(event)} aria-label={t('signUp')} aria-busy={busy}>
 {step===1&&<><label htmlFor="signup-name">{r('name')}</label><input id="signup-name" autoComplete="name" value={name} onChange={event=>setName(event.target.value)} required maxLength={100}/><label htmlFor="signup-email">{t('email')}</label><input id="signup-email" type="email" autoComplete="email" inputMode="email" value={flow.email} onChange={event=>flow.setEmail(event.target.value)} required/><label htmlFor="signup-username">{r('username')}</label><input id="signup-username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={handle} onChange={event=>setHandle(event.target.value)} required minLength={3} maxLength={30} pattern="[A-Za-z0-9_][A-Za-z0-9_.\-]{2,29}" aria-describedby="username-help"/><small id="username-help" className="muted">{r('usernameHelp')}</small></>}
 {step===2&&<><PasswordField id="signup-password" value={password} onChange={setPassword} newPassword/><PasswordField id="confirm-password" value={confirmation} onChange={setConfirmation} confirm newPassword/></>}
 {step===3&&<fieldset className="registration-policies"><legend>{r('policies')} <span aria-hidden="true">*</span></legend><label className="consent-check"><input type="checkbox" checked={privacy} onChange={event=>setPrivacy(event.target.checked)} required/><span>{t('privacyConsent')} <Link to="/privacy" target="_blank" rel="noopener noreferrer">{t('privacyPage')} ↗</Link></span></label><label className="consent-check"><input type="checkbox" checked={terms} onChange={event=>setTerms(event.target.checked)} required/><span>{t('termsConsent')} <Link to="/terms" target="_blank" rel="noopener noreferrer">{t('terms')} ↗</Link></span></label></fieldset>}
 <p ref={alert} className="error" role="alert" tabIndex={-1}>{error}</p><div className="registration-actions">{step>1&&<button type="button" disabled={busy} onClick={()=>{setError('');setStep(step-1)}}>{r('previous')}</button>}<button type="submit" className="button" disabled={busy||Boolean(app.user)}>{busy?t('loading'):step===3?t('signUp'):r('continue')}</button></div>
 </form>}<div className="auth-links"><Link to="/login">{t('backToSignIn')}</Link></div></>;
}
