import { useTranslation } from 'react-i18next';

/** Indeterminate activity: only the terminal's ready event confirms completion. */
export function LabLoading() {
 const { t } = useTranslation();
 return <div className="lab-loading" role="status">
  <div className="lab-loading-prompt" aria-hidden="true"><span>linux@lab</span>:~$ <span className="lab-loading-cursor">▍</span></div>
  <p className="lab-loading-title">{t('labConnecting')}</p>
  <div className="lab-loading-meter" role="progressbar" aria-label={t('labConnecting')}>
   <span aria-hidden="true">[</span><div className="lab-loading-segments" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <span key={index} style={{ animationDelay: `${index * 90}ms` }} />)}</div><span aria-hidden="true">]</span>
  </div>
  <p className="lab-loading-hint">{t('labLoadingHint')}</p>
 </div>;
}
