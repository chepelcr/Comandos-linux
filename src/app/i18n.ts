import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from '../locales/es.json';
import en from '../locales/en.json';
export const stored = (key: string, fallback = '') => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
export const persist = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* UI continues when storage is unavailable. */ } };
void i18n.use(initReactI18next).init({ resources: { es: { translation: es }, en: { translation: en } }, lng: stored('locale', navigator.language.startsWith('en') ? 'en' : 'es'), fallbackLng: 'es', interpolation: { escapeValue: false } });
export default i18n;
