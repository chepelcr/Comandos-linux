import { matchPath } from 'react-router-dom';
import { localized, lessons, courses, workshops } from './content';
import es from '../locales/es.json';
import en from '../locales/en.json';
import {legal,about} from '../repositories/curriculum';

export const siteOrigin = 'https://linux.jcampos.dev';
export function pageMetadata(pathname: string, language: string) {
 const lang = language.startsWith('en') ? 'en' : 'es';
 const t = lang === 'en' ? en : es;
 const path = pathname.replace(/\/+$/, '') || '/';
 const url = `${siteOrigin}${path==='/'?'/':`${path}/`}`;
 const lessonRoute = matchPath('/learn/:courseId/:lessonId', path);
 const courseRoute = matchPath('/courses/:courseId', path);
 const workshopRoute = matchPath('/workshops/:workshopId', path);
 const lesson = lessonRoute && lessons.find(item=>item.id===lessonRoute.params.lessonId&&item.course===lessonRoute.params.courseId);
 const course = courses.find(item=>item.id===(lesson?lesson.course:courseRoute?.params.courseId));
 const workshop = workshopRoute && workshops.find(item=>item.id===workshopRoute.params.workshopId);
 const pages = {'/courses':'courses','/dashboard':'dashboard','/account':'account','/settings':'account','/account/policies':'consentNoticeTitle','/resources':'resources','/about':'about','/privacy':'privacyPage','/terms':'terms','/practice':'practice','/login':'signIn','/register':'signUp','/verify-email':'verifyEmail','/forgot-password':'resetPassword','/reset-password':'resetPassword','/set-password':'newPassword','/auth/challenge':'verifySignIn','/support':'support'} as const;
 const key = pages[path as keyof typeof pages];
 let title = key ? t[key] : path.startsWith('/support/')?t.support:t.tagline;
 let description = t.heroDescription;
 let index = path==='/' || ['/courses','/resources','/about','/privacy','/terms'].includes(path);
 if(lessonRoute) {
  title=lesson?[localized(lesson.title,lang),...(course?[localized(course.title,lang)]:[])].join(' · '):t.notFound;
  description=lesson?localized(lesson.summary,lang):t.notFound;
  index=Boolean(lesson);
 }else if(courseRoute){
  title=course?localized(course.title,lang):t.notFound;
  description=course?localized(course.description,lang):t.notFound;
  index=Boolean(course);
 }else if(workshopRoute){
  title=workshop?localized(workshop.title,lang):t.notFound;
  description=workshop?workshop.lessons.map(id=>lessons.find(item=>item.id===id)).filter(Boolean).slice(0,3).map(item=>localized(item!.title,lang)).join(' · '):t.notFound;
  index=Boolean(workshop);
 }else if(path==='/about')description=localized(about.mission,lang);
 else if(path==='/privacy'||path==='/terms')description=localized(legal[path.slice(1) as 'privacy'|'terms'].intro,lang);
 else if(path==='/resources')description=t.resourcesDescription;
 else if(path==='/courses')description=t.pathDescription;
 const fullTitle=path==='/'?`${t.brand} · ${title}`:`${title} · ${t.brand}`;
 const provider={'@type':'Organization','@id':`${siteOrigin}/#publisher`,name:'Pacific Code Labs',url:'https://pacific-code-labs.jcampos.dev/',logo:`${siteOrigin}/images/pacific-code-labs.png`};
 const graph:object[]=[provider,{'@type':'WebSite','@id':`${siteOrigin}/#website`,name:t.brand,url:siteOrigin+'/',inLanguage:['es','en'],publisher:{'@id':`${siteOrigin}/#publisher`}}, {'@type':'WebPage','@id':url,name:fullTitle,description,url,inLanguage:lang,isPartOf:{'@id':`${siteOrigin}/#website`}}];
 if(path==='/about')graph.push({'@type':'Person',name:about.name,url:'https://jcampos.dev',image:`${siteOrigin}/${about.photo}`});
 if(course && courseRoute)graph.push({'@type':'Course',name:localized(course.title,lang),description:localized(course.description,lang),url,inLanguage:lang,provider:{'@id':`${siteOrigin}/#publisher`},hasPart:lessons.filter(item=>item.course===course.id).map(item=>({'@type':'LearningResource',name:localized(item.title,lang),url:`${siteOrigin}/learn/${course.id}/${item.id}/`}))});
 if(lesson)graph.push({'@type':'LearningResource',name:localized(lesson.title,lang),description,inLanguage:lang,url,learningResourceType:'Lesson',timeRequired:`PT${lesson.minutes}M`,isPartOf:{'@type':'Course',name:course?localized(course.title,lang):t.brand,url:`${siteOrigin}/courses/${lesson.course}/`}});
 if(index && path!=='/')graph.push({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:t.brand,item:siteOrigin+'/'},...(lesson&&course?[{'@type':'ListItem',position:2,name:localized(course.title,lang),item:`${siteOrigin}/courses/${course.id}/`}]:[]),{'@type':'ListItem',position:lesson&&course?3:2,name:title,item:url}]});
 return {title:fullTitle,description,url,index,lang,structuredData:{'@context':'https://schema.org','@graph':graph}};
}

export function updateMetadata(pathname:string, language:string) {
 const data=pageMetadata(pathname,language);
 document.title=data.title;
 document.documentElement.lang=data.lang;
 function meta(attribute:'name'|'property',name:string,content:string){
  let element=document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if(!element){element=document.createElement('meta');element.setAttribute(attribute,name);document.head.append(element);}
  element.content=content;
 }
 meta('name','description',data.description);
 meta('name','robots',data.index?'index, follow, max-image-preview:large':'noindex, follow');
 for(const [name,value] of Object.entries({'og:type':'website','og:site_name':'Linux Lab','og:title':data.title,'og:description':data.description,'og:url':data.url,'og:locale':data.lang==='es'?'es_CR':'en_US','og:image':`${siteOrigin}/images/social-card.png`,'og:image:alt':'Linux Lab · Linux, Git, React + Node.js'}))meta('property',name,value);
 for(const [name,value] of Object.entries({'twitter:card':'summary_large_image','twitter:title':data.title,'twitter:description':data.description,'twitter:image':`${siteOrigin}/images/social-card.png`,'twitter:image:alt':'Linux Lab · Linux, Git, React + Node.js'}))meta('name',name,value);
 let canonical=document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
 if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.append(canonical);}
 canonical.href=data.url;
 let structured=document.head.querySelector<HTMLScriptElement>('#structured-data');
 if(!structured){structured=document.createElement('script');structured.id='structured-data';structured.type='application/ld+json';document.head.append(structured);}
 structured.textContent=JSON.stringify(data.structuredData).replace(/</g,'\\u003c');
 document.documentElement.dataset.seoPath=pathname;
}
