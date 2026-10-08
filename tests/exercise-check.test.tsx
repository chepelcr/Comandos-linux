// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import '../src/app/i18n';
import { empty, type Progress } from '../src/services/progress';
const mocks = vi.hoisted(() => ({ progress: {} as Progress, result: {} as unknown, fail: false, update: vi.fn() }));
vi.mock('../src/app/providers', () => ({ useApp: () => ({ user: { profile: { sub: 'learner' } }, progress: mocks.progress, update: mocks.update }) }));
vi.mock('../src/app/labs', () => ({ useLab: () => ({ state: { available: true, session: { id: 'lab', route: 'foundations', state: 'running', expiresAt: Date.now() + 60000, idleExpiresAt: Date.now() + 60000 } }, busy: false, error: '', start: vi.fn(), end: vi.fn() }) }));
vi.mock('../src/services/labs', () => ({ LabRequestError: class extends Error {}, labRequest: async (path: string) => { if (path === '/connect') return {}; if (mocks.fail) throw new Error('Service unavailable'); return path === '/check' ? { command: 'command' } : mocks.result; } }));
vi.mock('../src/services/ssm-terminal', () => ({ connectTerminal: () => ({ resize() {}, close() {}, input() {} }) }));
vi.mock('@xterm/xterm', () => ({ Terminal: class { cols = 80; rows = 24; loadAddon() {} open() {} onData() { return { dispose() {} }; } dispose() {} } }));
vi.mock('@xterm/addon-fit', () => ({ FitAddon: class { fit() {} } }));
import { InlineLab } from '../src/components/InlineLab';
let root: Root, container: HTMLDivElement;
async function render() { await act(async () => root.render(<MemoryRouter><InlineLab route="foundations" lesson="intro" /></MemoryRouter>)); }
async function check() { await act(async () => [...container.querySelectorAll('button')].find(button => /Check exercise|Check again/.test(button.textContent!))!.click()); await act(async () => { await vi.advanceTimersByTimeAsync(1500); }); }
beforeEach(async () => {
 vi.useFakeTimers(); mocks.progress = empty(); mocks.fail = false; mocks.update.mockImplementation((fn: (p: Progress) => Progress) => { mocks.progress = fn(mocks.progress); });
 Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
 vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} })); vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
 const { default: i18n } = await import('../src/app/i18n'); await i18n.changeLanguage('en');
 container = document.createElement('div'); document.body.append(container); root = createRoot(container); await render();
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe('lesson exercise button', () => {
 it('records only a matching verified result and keeps its success indicator on rerender', async () => {
  mocks.result = { pending: false, verified: true, lesson: 'intro' }; await check();
  expect(mocks.progress.exercises).toEqual(['intro']); expect(container.textContent).toContain('Result verified in Linux'); expect(container.textContent).toContain('Check again'); await render(); expect(container.querySelector('.inline-lab-check.is-verified')).not.toBeNull();
 });
 it('does not award an exercise when the check fails or belongs to another lesson', async () => {
  for (const result of [{ pending: false, verified: false, lesson: 'intro' }, { pending: false, verified: true, lesson: 'cli' }]) { mocks.result = result; await check(); }
  expect(mocks.update).not.toHaveBeenCalled(); expect(container.textContent).toContain('The exercise does not pass yet');
 });
 it('distinguishes service faults from an unfinished student exercise', async () => {
  mocks.fail = true; await check(); expect(mocks.update).not.toHaveBeenCalled(); expect(container.textContent).toContain('We could not check the exercise'); expect(container.textContent).not.toContain('The exercise does not pass yet');
 });
});
