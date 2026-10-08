// @vitest-environment jsdom
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({guest:vi.fn().mockResolvedValue(new Response(null,{status:204})),session:vi.fn()}));
vi.mock('../src/app/config',()=>({config:{coursesApi:'https://courses.example',coursesIdentity:'guest',region:'us-east-1'}}));
vi.mock('../src/services/public-content',()=>({signedPublicRequest:mocks.guest}));
vi.mock('aws-amplify/auth',()=>({fetchAuthSession:mocks.session}));
import {trackActivity,sendActivity} from '../src/services/activity';
describe('minimal activity signals',()=>{
 beforeEach(()=>{vi.useFakeTimers();vi.clearAllMocks();vi.spyOn(document,'visibilityState','get').mockReturnValue('visible');vi.stubGlobal('navigator',{doNotTrack:'0'});});
 afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
 it('respects privacy signals without sending telemetry',async()=>{
  vi.stubGlobal('navigator',{doNotTrack:'1'});const stop=trackActivity(null);await vi.advanceTimersByTimeAsync(120000);expect(mocks.guest).not.toHaveBeenCalled();stop();
 });
 it('stops signals for hidden and idle tabs and aborts on logout/unmount',async()=>{
  const stop=trackActivity(null);await vi.advanceTimersByTimeAsync(0);expect(mocks.guest).toHaveBeenCalledTimes(1);
  vi.spyOn(document,'visibilityState','get').mockReturnValue('hidden');await vi.advanceTimersByTimeAsync(60000);expect(mocks.guest).toHaveBeenCalledTimes(1);
  vi.spyOn(document,'visibilityState','get').mockReturnValue('visible');await vi.advanceTimersByTimeAsync(300000);expect(mocks.guest).toHaveBeenCalledTimes(1);
  window.dispatchEvent(new Event('pointerdown'));await vi.advanceTimersByTimeAsync(60000);expect(mocks.guest).toHaveBeenCalledTimes(2);
  stop();await vi.advanceTimersByTimeAsync(60000);expect(mocks.guest).toHaveBeenCalledTimes(2);
 });
 it('never sends a student signal for a switched session',async()=>{
  mocks.session.mockResolvedValue({tokens:{accessToken:{payload:{sub:'other'}}}});await sendActivity('student',new AbortController().signal);expect(mocks.guest).not.toHaveBeenCalled();
 });
});
