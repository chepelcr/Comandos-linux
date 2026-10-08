import {useCurriculum} from '../repositories/curriculum';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Circle, Search, Clock } from 'lucide-react';
import { CourseCards } from './Landing';
import { courses, lessons, workshops, localized, lessonPath } from '../app/content';
import { useApp } from '../app/providers';
import { ProgressBar } from '../components/ui';
export default function Courses() {
 useCurriculum();
 const { t, i18n } = useTranslation(); const { courseId, workshopId } = useParams(); const { progress } = useApp(); const [query,setQuery] = useState('');
 const course = courses.find(c => c.id === courseId);
 const workshop = workshops.find(w => w.id === workshopId);
 const list = lessons.filter(l => workshop ? workshop.lessons.includes(l.id) : course ? l.course === course.id : localized(l.title,i18n.language).toLowerCase().includes(query.toLowerCase()));
 if ((courseId && !course) || (workshopId && !workshop)) return <div className="container page"><h1>{t('notFound')}</h1><Link to="/courses">{t('back')}</Link></div>;
 return <div className="container page"><span className="eyebrow">{t('courses')}</span><h1>{course ? localized(course.title,i18n.language) : workshop ? localized(workshop.title,i18n.language) : t('pathTitle')}</h1><p className="lead">{course ? localized(course.description,i18n.language) : t('pathDescription')}</p>{course || workshop ? <><div className="course-progress"><span>{list.filter(l => progress.completed.includes(l.id)).length} / {list.length} {t('lessons')}</span><ProgressBar value={list.filter(l => progress.completed.includes(l.id)).length/list.length*100} label={t('totalProgress')}/></div><div className="lesson-list">{list.map((l,i) => <Link className="lesson-row" key={l.id} to={lessonPath(l.id)}>{progress.completed.includes(l.id) ? <CheckCircle2 className="success" aria-label={t('completed')}/> : <Circle className="muted" aria-hidden/>}<span className="lesson-number">{String(i+1).padStart(2,'0')}</span><div><h2>{localized(l.title,i18n.language)}</h2><p>{localized(l.summary,i18n.language)}</p></div><span className="lesson-time"><Clock size={15} aria-hidden/>{l.minutes} {t('minutes')}</span><ArrowRight size={18} aria-hidden/></Link>)}</div></> : <><label className="search"><Search size={20} aria-hidden/><span className="sr-only">{t('search')}</span><input placeholder={t('search')} value={query} onChange={e => setQuery(e.target.value)}/></label>{query ? <div className="lesson-list">{list.map(l => <Link className="lesson-row" key={l.id} to={lessonPath(l.id)}><h2>{localized(l.title,i18n.language)}</h2><ArrowRight size={18}/></Link>)}{!list.length && <p>{t('noResults')}</p>}</div> : <CourseCards/>}<div className="workshop-links">{workshops.map(w => <Link className="text-link" key={w.id} to={`/workshops/${w.id}`}>{localized(w.title,i18n.language)}<ArrowRight size={18}/></Link>)}</div></>}</div>;
}
