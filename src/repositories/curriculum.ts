import { useSyncExternalStore } from 'react';
import bundledLessons from '../data/lessons.json';
import bundledCourses from '../data/courses.json';
import bundledWorkshops from '../data/workshops.json';
import bundledExercises from '../data/lab-exercises.json';
import bundledRewards from '../data/rewards.json';
import bundledAbout from '../data/about.json';
import bundledFooter from '../data/footer.json';
import bundledLegal from '../data/legal.json';
import legacyExamples from '../data/legacy-examples.json';
import sourceDocuments from '../data/source-documents.json';
import sourceTranslations from '../data/source-translations.json';
import es from '../locales/es.json';
import en from '../locales/en.json';
import bundledRelease from '../generated/curriculum-release.json';
import { config } from '../app/config';
import i18n from '../app/i18n';
import { getPublishedCourses } from '../services/courses';
export const bundledDocuments={'lessons':bundledLessons,'courses':bundledCourses,'workshops':bundledWorkshops,'lab-exercises':bundledExercises,'rewards':bundledRewards,'about':bundledAbout,'footer':bundledFooter,'legal':bundledLegal,'legacy-examples':legacyExamples,'source-documents':sourceDocuments,'source-translations':sourceTranslations,'locales-es':es,'locales-en':en};
type Documents=typeof bundledDocuments;
export let lessons=bundledLessons,courses=bundledCourses,workshops=bundledWorkshops,exercises=bundledExercises,rewards=bundledRewards,about=bundledAbout,studio=bundledFooter,legal=bundledLegal;
const listeners=new Set<()=>void>();let revision=0,sequence=bundledRelease.sequence;let inflight:{subject:string|null;abort:AbortController;promise:Promise<void>}|undefined;
const cacheKey='curriculum:published:v1';
export function useCurriculum(){return useSyncExternalStore(callback=>{listeners.add(callback);return()=>{listeners.delete(callback);};},()=>revision,()=>0);}
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
// Runtime copy updates must not introduce rules/paths the bundled backend/image cannot serve.
// Structural changes enter via the exact-release CI build, which updates this baseline first.
export function compatibleDocuments(value:unknown):value is Documents{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 try {
 const docs=value as Documents;
 if(!Array.isArray(docs.lessons)||!Array.isArray(docs.courses)||!Array.isArray(docs.workshops))return false;
 const protectedLessons=(items:typeof lessons)=>items.map(item=>({id:item.id,course:item.course,optional:item.optional,code:item.code})).sort((a,b)=>a.id.localeCompare(b.id));
 const protectedCourses=(items:typeof courses)=>items.map(item=>({id:item.id,practice:item.practice,legacy:item.legacy})).sort((a,b)=>a.id.localeCompare(b.id));
 if(!same(protectedLessons(docs.lessons),protectedLessons(bundledLessons))||!same(protectedCourses(docs.courses),protectedCourses(bundledCourses))||!same(docs['lab-exercises'],bundledExercises)||!same(docs.rewards,bundledRewards)||!same(docs.workshops,bundledWorkshops))return false;
 // Validate every existing field recursively against its matching baseline item. No executable HTML.
 const shape=(candidate:unknown,baseline:unknown):boolean=>{
  if(typeof candidate!==typeof baseline||(candidate===null)!==(baseline===null))return false;
  if(baseline===null)return true;
  if(Array.isArray(baseline)){
   if(!Array.isArray(candidate)||candidate.length!==baseline.length)return false;
   return candidate.every((item,i)=>{const id=item&&typeof item==='object'?'id' in item?item.id:undefined:undefined;const reference=id===undefined?baseline[i]:baseline.find(ref=>ref&&typeof ref==='object'&&'id' in ref&&ref.id===id);return reference!==undefined&&shape(item,reference);});
  }
  if(typeof baseline==='object')return !Array.isArray(candidate)&&Object.keys(baseline).every(key=>Object.hasOwn(candidate as object,key)&&shape((candidate as Record<string,unknown>)[key],(baseline as Record<string,unknown>)[key]));
  return typeof candidate!=='number'||Number.isFinite(candidate);
 };
 return shape(docs,bundledDocuments)&&same(docs['legacy-examples'],legacyExamples)&&same(docs['source-documents'],sourceDocuments)&&same(docs['source-translations'],sourceTranslations);
 }catch{return false;}
}
function apply(value:unknown){
 if(!value||typeof value!=='object')return false;
 const envelope=value as {version:number;sequence:number;releaseId:string;documents:unknown};
 if(envelope.version!==1||!Number.isSafeInteger(envelope.sequence)||envelope.sequence<sequence||typeof envelope.releaseId!=='string'||!compatibleDocuments(envelope.documents))return false;
 const docs=envelope.documents;
 if(same(docs,{...bundledDocuments,lessons,courses,workshops,'lab-exercises':exercises,rewards,about,footer:studio,legal})){sequence=envelope.sequence;return true;}
 lessons=docs.lessons;courses=docs.courses;workshops=docs.workshops;exercises=docs['lab-exercises'];rewards=docs.rewards;about=docs.about;studio=docs.footer;legal=docs.legal;sequence=envelope.sequence;
 i18n.addResourceBundle('es','translation',docs['locales-es'],true,true);i18n.addResourceBundle('en','translation',docs['locales-en'],true,true);
 revision++;for(const callback of listeners)callback();return true;
}
export function loadCurriculum(subject:string|null = null){
 if(!config.coursesApi||(!subject&&!config.coursesIdentity))return;
 if(inflight?.subject===subject)return inflight.promise;
 // Abort the old transport when login/logout changes the reader identity.
 inflight?.abort.abort();
 try{const raw=localStorage.getItem(cacheKey);if(raw)apply(JSON.parse(raw));}catch{/* Storage unavailable. */}
 const abort=new AbortController();
 const timer=setTimeout(()=>abort.abort(),10000);
 const promise=(async()=>{try{
  const response=await getPublishedCourses(subject,abort.signal);
  if(!response.ok||abort.signal.aborted)return;
  const text=await response.text();if(text.length>5_000_000||abort.signal.aborted)return;
  const value:unknown=JSON.parse(text);
  if(apply(value))try{localStorage.setItem(cacheKey,text);}catch{/* Storage unavailable. */}
 }catch{/* Bundled/cached published content keeps the course available. */}
 finally{clearTimeout(timer);if(inflight?.abort===abort)inflight=undefined;}})();
 inflight={subject,abort,promise};return promise;
}
