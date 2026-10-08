import { useTranslation } from 'react-i18next';
import { Download, ArrowUpRight } from 'lucide-react';
import {about as aboutContent,useCurriculum} from '../repositories/curriculum';
import { localized } from '../app/content';
import { Link } from 'react-router-dom';

import { ExternalLink } from '../components/ui';
export default function Resources({ about = false }: { about?: boolean }) {
 useCurriculum();
 const { t,i18n } = useTranslation();
 if(about) return <div className="container page about-page"><section className="about-intro"><img className="author-photo" src={`${import.meta.env.BASE_URL}${aboutContent.photo}`} alt={aboutContent.name} width="320" height="380"/><div><span className="eyebrow">{t('about')}</span><h1>{localized(aboutContent.title,i18n.language)}</h1><h2>{aboutContent.name}</h2><p className="muted">{localized(aboutContent.role,i18n.language)}</p><p>{localized(aboutContent.bio,i18n.language)}</p><div className="actions"><a className="text-link" href={`mailto:${aboutContent.email}`}>{localized(aboutContent.contact,i18n.language)} ↗</a><a className="text-link" href={aboutContent.cv.url} target="_blank" rel="noopener noreferrer">{localized(aboutContent.cv.label,i18n.language)}<ArrowUpRight size={16} aria-hidden/></a></div></div></section><section className="about-mission panel"><h2>{t('brand')}</h2><p>{localized(aboutContent.mission,i18n.language)}</p><p>{localized(aboutContent.access,i18n.language)}</p><Link className="button" to="/courses">{t('courses')}</Link></section></div>;
 return <div className="container page"><span className="eyebrow">{t(about ? 'about' : 'resources')}</span><h1>{t(about ? 'authorTitle' : 'resourcesTitle')}</h1><p className="lead">{t(about ? 'authorDescription' : 'resourcesDescription')}</p>{!about && <><div className="resource-grid">{[['Cisco Networking Academy','https://www.netacad.com/'],['Microsoft Learn','https://learn.microsoft.com/'],['GitHub Education','https://education.github.com/']].map(([title,href])=><article className="panel" key={href}><h2>{title}</h2><ExternalLink href={href}>{title}</ExternalLink></article>)}</div><a className="button secondary" href={`${import.meta.env.BASE_URL}files/firewall.sh`} download><Download size={18}/>firewall.sh</a></>}</div>;
}
