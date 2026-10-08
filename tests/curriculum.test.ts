import {describe,it,expect} from 'vitest';
import {bundledDocuments,compatibleDocuments} from '../src/repositories/curriculum';
describe('published curriculum boundary',()=>{
 it('accepts bilingual copy updates without changing lab or progression rules',()=>{
  const copy=structuredClone(bundledDocuments);
  copy.lessons[0].title.es='Introducción actualizada';
  copy.lessons[0].title.en='Updated introduction';
  expect(compatibleDocuments(copy)).toBe(true);
 });
 it('rejects rule changes and malformed documents without throwing',()=>{
  const changed=structuredClone(bundledDocuments);changed.lessons[0].id='different';
  expect(compatibleDocuments(changed)).toBe(false);
  for(const lessons of [[null],[{id:7}],null])expect(compatibleDocuments({...bundledDocuments,lessons})).toBe(false);
  expect(compatibleDocuments({...bundledDocuments,'source-documents':[]})).toBe(false);
 });
});
