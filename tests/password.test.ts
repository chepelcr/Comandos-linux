import { describe,it,expect } from 'vitest';
import { passwordRules,passwordValid,safeReturnPath } from '../src/features/auth/password';
describe('Cognito-aligned password policy',()=>{
 it('requires all five rules and preserves the twelve-character minimum',()=>{
  expect(passwordValid('ShortPass9!')).toBe(false);
  expect(passwordValid('LongPassword9!')).toBe(true);
  for(const value of ['lowercaseonly9!','UPPERCASEONLY9!','NoNumbersHere!!','NoSymbolsHere99'])expect(passwordValid(value)).toBe(false);
  expect(Object.values(passwordRules('LongPassword9!')).filter(Boolean)).toHaveLength(5);
 });
 it('does not mistake unicode letters for supported symbols or trim passwords',()=>{
  expect(passwordValid('LongPassword9é')).toBe(false);
  expect(passwordValid(' LongPassword9!')).toBe(false);
  expect(passwordValid('LongPassword9! ')).toBe(false);
  expect(passwordValid('Long Password9!')).toBe(true);
  expect(passwordValid('aA9!'.repeat(65))).toBe(false);
 });
 it('keeps auth return paths local, clean and outside the auth flow',()=>{
  expect(safeReturnPath('/learn/foundations/intro')).toBe('/learn/foundations/intro');
  expect(safeReturnPath('/support/abc')).toBe('/support/abc');
  for(const path of ['//evil.example','https://evil.example','/\\evil.example','/login','/auth/challenge','/support?email=a','/foo#bar','/foo\nbar','/foo/../login','/%2e%2e/login',null])expect(safeReturnPath(path)).toBe('/dashboard');
 });
});
