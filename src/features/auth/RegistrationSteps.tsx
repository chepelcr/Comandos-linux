import {useTranslation} from 'react-i18next';
import {Check} from 'lucide-react';
export function RegistrationSteps({step}:{step:number}){
 const {t}=useTranslation('registration');
 return <ol className="registration-steps" aria-label={t('progress')}>{['details','password','policies','verify'].map((label,index)=><li key={label} className={index+1<step?'complete':index+1===step?'current':''} aria-current={index+1===step?'step':undefined}><span aria-hidden="true">{index+1<step?<Check size={14}/>:index+1}</span><small>{t(label)}</small></li>)}</ol>;
}
