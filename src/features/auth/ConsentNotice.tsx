import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../app/providers';
import { config } from '../../app/config';
import { clearRegistrationConsent, loadConsent, pendingRegistrationConsent, recordConsent, visiblePolicyVersions, type ConsentState } from '../../services/consent';
import { safeReturnPath } from './password';

// Mount once beneath Providers and the router. An absent record is never acceptance.
export function ConsentNotice({page=false}:{page?:boolean}) {
  const app = useApp();
  const location=useLocation();
  const active=page||!['/account/policies','/privacy','/terms'].includes(location.pathname.replace(/\/$/,''));
  const { t } = useTranslation();
  const [state, setState] = useState<ConsentState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [terms, setTerms] = useState(false);
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const subject = app.user?.profile.sub;

  useEffect(() => {
    const current = ++generation.current;
    setState(null); setError(''); setBusy(false); setPrivacy(false); setTerms(false);
    if (!active || !subject || !config.api) return;
    void (async () => {
      try {
        let remote = await loadConsent(subject);
        if (generation.current !== current) return;
        if (remote.record && remote.record.userId !== subject) throw new Error('Invalid consent owner');
        const pending = pendingRegistrationConsent(app.user?.profile.email);
        if (!remote.current && pending && pending.privacy === remote.requiredPolicies.privacy.version && pending.terms === remote.requiredPolicies.terms.version) {
          remote = await recordConsent(pending, subject);
          clearRegistrationConsent();
        }
        if (generation.current === current) setState(remote);
      } catch { if (generation.current === current) setError('consentLoadError'); }
    })();
    return () => { generation.current++; };
  }, [subject, retry, app.user?.profile.email, active]);

  const returnTo=safeReturnPath(location.state?.returnTo);
  if(!page){
    if(active&&subject&&(error||state&&!state.current))return <Navigate to="/account/policies" replace state={{returnTo:location.pathname}}/>;
    return null;
  }
  if(subject&&state?.current)return <Navigate to={returnTo==='/account/policies'?'/dashboard':returnTo} replace/>;
  async function accept() {
    if (!privacy || !terms || busy) return;
    const current = generation.current;
    setBusy(true); setError('');
    try {
      const versions = await visiblePolicyVersions();
      if (versions.privacy !== state?.requiredPolicies.privacy.version || versions.terms !== state?.requiredPolicies.terms.version) throw new Error('POLICY_CHANGED');
      const next = await recordConsent(versions, subject);
      if (generation.current !== current) return;
      setState(next); clearRegistrationConsent();
    } catch (cause) {
      if (generation.current === current) setError((cause as Error).message === 'POLICY_CHANGED' ? 'consentChangedError' : 'consentSaveError');
    } finally { if (generation.current === current) setBusy(false); }
  }

  return <section className="account-policies">
    <h1>{t('consentNoticeTitle')}</h1><p className="muted">{t('consentNoticeDescription')}</p>
    {!subject?<Link className="button" to="/login" state={{returnTo:'/account/policies'}}>{t('signIn')}</Link>:!state&&!error?<p role="status">{t('loading')}</p>:null}
    {state && !state.current && <>
      <label className="consent-check"><input type="checkbox" checked={privacy} onChange={event => setPrivacy(event.target.checked)} /><span>{t('consentPrivacyPrefix')} <Link to="/privacy" target="_blank" rel="noopener noreferrer">{t('privacyPage')} ↗</Link></span></label>
      <label className="consent-check"><input type="checkbox" checked={terms} onChange={event => setTerms(event.target.checked)} /><span>{t('consentTermsPrefix')} <Link to="/terms" target="_blank" rel="noopener noreferrer">{t('terms')} ↗</Link></span></label>
      <button className="button" type="button" disabled={!privacy || !terms || busy} onClick={() => void accept()}>{t(busy ? 'consentSaving' : 'consentSave')}</button>
    </>}
    {error && <><p role="alert" className="error">{t(error)}</p><button type="button" disabled={busy} onClick={() => setRetry(n => n + 1)}>{t('retry')}</button></>}
  </section>;
}
