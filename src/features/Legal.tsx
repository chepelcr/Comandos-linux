import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import legal from '../data/legal.json';
import { localized } from '../app/content';

export default function Legal({ page }: { page: 'privacy' | 'terms' }) {
 const { t, i18n } = useTranslation();
 const content = legal[page];
 return <article className="container page legal-page">
  <span className="eyebrow">Linux Lab · Pacific Code Labs</span>
  <h1>{localized(content.title, i18n.language)}</h1>
  <p className="lead">{localized(content.intro, i18n.language)}</p>
  <p className="muted">{t('lastUpdated')}: <time dateTime={content.updated}>{content.updated}</time></p>
  <nav aria-label={t(page==='privacy'?'privacyPage':'terms')} className="legal-navigation">{content.sections.map((section, index) => <a key={index} href={`#section-${index+1}`}>{localized(section.title, i18n.language)}</a>)}</nav>
  {content.sections.map((section, index) => <section id={`section-${index+1}`} key={index}><h2>{localized(section.title, i18n.language)}</h2><p>{localized(section.body, i18n.language)}</p></section>)}
  {page==='privacy' && <p><a className="text-link" href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub Privacy Statement ↗</a> · <a className="text-link" href="https://aws.amazon.com/privacy/" target="_blank" rel="noopener noreferrer">AWS Privacy Notice ↗</a></p>}
  <div className="actions"><a className="text-link" href="mailto:chepelcr@outlook.com">chepelcr@outlook.com</a><Link className="text-link" to={page==='privacy'?'/terms':'/privacy'}>{t(page==='privacy'?'terms':'privacyPage')}</Link></div>
 </article>;
}
