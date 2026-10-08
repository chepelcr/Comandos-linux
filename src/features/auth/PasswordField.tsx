import { useState } from 'react';
import { Eye, EyeOff, Check, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { passwordRules } from './password';
export function PasswordField({id,value,onChange,confirm=false,newPassword=false}:{id:string;value:string;onChange:(value:string)=>void;confirm?:boolean;newPassword?:boolean}) {
 const {t}=useTranslation();const [visible,setVisible]=useState(false);
 const rules=passwordRules(value),score=Object.values(rules).filter(Boolean).length;
 return <div className="password-field"><label htmlFor={id}>{t(confirm?'confirmPassword':newPassword?'newPassword':'password')}</label><div className="password-input"><input id={id} type={visible?'text':'password'} autoComplete={newPassword?'new-password':'current-password'} value={value} onChange={e=>onChange(e.target.value)} required aria-describedby={newPassword&&!confirm?`${id}-rules`:undefined}/><button type="button" className="icon-button" aria-label={t(visible?'hidePassword':'showPassword')} aria-controls={id} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{newPassword&&!confirm&&<div id={`${id}-rules`} className="password-rules"><div className="password-meter" aria-hidden="true">{Object.keys(rules).map((key,i)=><span key={key} className={i<score?'filled':''}/>)}</div><p>{t('passwordStrength')}: <strong>{t(score===0?'strengthEmpty':score<3?'strengthWeak':score<5?'strengthGood':'strengthStrong')}</strong></p><ul>{Object.entries(rules).map(([key,valid])=><li key={key} className={valid?'success':''}>{valid?<Check size={14} aria-hidden/>:<Circle size={14} aria-hidden/>}{t(`passwordRule_${key}`)}</li>)}</ul></div>}</div>;
}
