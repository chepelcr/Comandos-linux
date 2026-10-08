import { describe,it,expect,vi,afterEach } from 'vitest';
vi.mock('../src/app/config',()=>({config:{api:'https://course.test'},authConfigured:false}));
vi.mock('../src/app/auth',()=>({freshToken:async()=>'verified-test-token'}));
import { endActiveLab } from '../src/services/labs';
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
describe('lab teardown before sign out',()=>{
 it('ends the account lab even when this browser has no local lab state',async()=>{const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({session:null})));vi.stubGlobal('fetch',fetch);vi.stubGlobal('window',{dispatchEvent:vi.fn()});await endActiveLab();expect(fetch).toHaveBeenCalledWith('https://course.test/labs',expect.objectContaining({method:'DELETE',headers:expect.objectContaining({Authorization:'Bearer verified-test-token'})}));});
 it('waits for an in-flight launch to terminate rather than treating HTTP 202 as success',async()=>{vi.useFakeTimers();const fetch=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({session:{state:'ending'}}),{status:202})).mockResolvedValueOnce(new Response(JSON.stringify({session:null})));const dispatchEvent=vi.fn();vi.stubGlobal('fetch',fetch);vi.stubGlobal('window',{dispatchEvent});const ending=endActiveLab();await vi.advanceTimersByTimeAsync(1499);expect(dispatchEvent).not.toHaveBeenCalled();await vi.advanceTimersByTimeAsync(1);await ending;expect(fetch).toHaveBeenCalledTimes(2);expect(dispatchEvent).toHaveBeenCalledOnce();});
 it('retries transient AWS throttling while retaining credentials',async()=>{vi.useFakeTimers();const fetch=vi.fn().mockResolvedValueOnce(new Response('{}',{status:429})).mockResolvedValueOnce(new Response(JSON.stringify({session:null})));vi.stubGlobal('fetch',fetch);vi.stubGlobal('window',{dispatchEvent:vi.fn()});const end=endActiveLab();await vi.advanceTimersByTimeAsync(1500);await end;expect(fetch).toHaveBeenCalledTimes(2);});
 it('propagates AWS failure so callers keep auth credentials for retry',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}',{status:500})));vi.stubGlobal('window',{dispatchEvent:vi.fn()});await expect(endActiveLab()).rejects.toThrow('500');});
});
