import lessons from '../data/lessons.json';
import courses from '../data/courses.json';
import workshops from '../data/workshops.json';
export { lessons, courses, workshops };
export type Lesson = typeof lessons[number];
export const localized = (value: { es: string; en: string }, language: string) => language.startsWith('en') ? value.en : value.es;
export const lessonPath = (id: string) => { const l = lessons.find(l => l.id === id); return l ? `/learn/${l.course}/${l.id}` : '/courses'; };
