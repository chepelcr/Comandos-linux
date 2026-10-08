import { beforeEach,describe,it,expect,vi } from 'vitest';
import { createHash } from 'node:crypto';
import legal from '../src/data/legal.json';
const session=vi.hoisted(()=>vi.fn());
vi.mock('aws-amplify/auth',()=>({fetchAuthSession:session}));
vi.mock('../src/app/config',()=>({config:{api:'https://api.example'}}));
import { visiblePolicyVersions,rememberRegistrationConsent,pendingRegistrationConsent,clearRegistrationConsent,recordConsent } from '../src/services/consent';
beforeEach(()=>{clearRegistrationConsent();session.mockReset();vi.restoreAllMocks()});
describe('explicit registration evidence',()=>{
 it('uses actual displayed policy content hashes and stable dates',async()=>{const versions=await visiblePolicyVersions();expect(versions.privacy).toBe(`${legal.privacy.updated}:${createHash('sha256').update(JSON.stringify(legal.privacy)).digest('hex')}`);expect(versions.terms).toBe(`${legal.terms.updated}:${createHash('sha256').update(JSON.stringify(legal.terms)).digest('hex')}`)});
 it('has no inferred old acceptance and scopes pending signup acknowledgement to same email only',async()=>{expect(pendingRegistrationConsent('old@example.com')).toBeNull();await rememberRegistrationConsent('New@Example.com',{privacy:true,terms:true});expect(pendingRegistrationConsent('new@example.com')).not.toBeNull();expect(pendingRegistrationConsent('another@example.com')).toBeNull();clearRegistrationConsent();expect(pendingRegistrationConsent('new@example.com')).toBeNull()});
 it('rejects recording under another account session and transmits no user-supplied timestamps',async()=>{const fetch=vi.fn();vi.stubGlobal('fetch',fetch);session.mockResolvedValue({tokens:{accessToken:{toString:()=> 'token',payload:{sub:'bob'}}}});await expect(recordConsent(await visiblePolicyVersions(),'alice')).rejects.toThrow('Session changed');expect(fetch).not.toHaveBeenCalled();session.mockResolvedValue({tokens:{accessToken:{toString:()=> 'token',payload:{sub:'alice'}}}});const versions=await visiblePolicyVersions();fetch.mockResolvedValue({ok:true,json:async()=>({current:true,record:null,requiredPolicies:{privacy:{version:versions.privacy},terms:{version:versions.terms}}})});await recordConsent(versions,'alice');const body=JSON.parse(fetch.mock.calls[0][1].body);expect(body).toEqual({privacy:{version:versions.privacy,accepted:true},terms:{version:versions.terms,accepted:true}});expect(body).not.toHaveProperty('userId');expect(body).not.toHaveProperty('recordedAt');vi.unstubAllGlobals()});
});
