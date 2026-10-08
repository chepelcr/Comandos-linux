import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, ArrowUpRight, Terminal, Code2, GitBranch, Shield, Server, CloudUpload } from 'lucide-react';
export const icons = { terminal: Terminal, code: Code2, git: GitBranch, shield: Shield, server: Server, cloud: CloudUpload };
export function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
 const { t } = useTranslation(); const [state, setState] = useState('copy');
 return <div className="code-block"><div className="code-bar"><span>{language}</span><button onClick={() => { void navigator.clipboard.writeText(code).then(() => { setState('copied'); setTimeout(() => setState('copy'), 1800); }, () => setState('copyFailed')); }}>{state === 'copied' ? <Check size={16} aria-hidden/> : <Copy size={16} aria-hidden/>}{t(state)}</button></div><pre tabIndex={0}><code>{code}</code></pre></div>;
}
export function ProgressBar({ value, label }: { value: number; label: string }) { return <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><span style={{ width: `${value}%` }}/></div>; }
export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) { return <a href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={16} aria-hidden/></a>; }
