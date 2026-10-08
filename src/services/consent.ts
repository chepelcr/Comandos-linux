import legal from '../data/legal.json';
import { config } from '../app/config';
import { fetchAuthSession } from 'aws-amplify/auth';
export type ConsentState={requiredPolicies:{privacy:{version:string;url:string};terms:{version:string;url:string}};current:boolean;record:null|{version:1;userId:string;revision:number;acceptances:{privacyVersion:string;termsVersion:string;recordedAt:string;method:string}[]}};
export type PolicyVersions={privacy:string;terms:string};
let registration:null|{email:string;versions:PolicyVersions}=null;
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
export async function visiblePolicyVersions():Promise<PolicyVersions>{const digest=async(policy:typeof legal.privacy|typeof legal.terms)=>`${policy.updated}:${hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(policy))))}`;return {privacy:await digest(legal.privacy),terms:await digest(legal.terms)}}
// Call only after the required unchecked registration checkboxes were accepted
// and signUp succeeded. This evidence is memory-only and bound to the same email.
export async function rememberRegistrationConsent(email:string,accepted:{privacy:true;terms:true}){if(accepted.privacy!==true||accepted.terms!==true)throw new Error('Explicit acknowledgement required');registration={email:email.trim().toLowerCase(),versions:await visiblePolicyVersions()}}
export function pendingRegistrationConsent(email?:string){return email&&registration?.email===email.trim().toLowerCase()?registration.versions:null}
export function clearRegistrationConsent(){registration=null}
async function request(method:'GET'|'POST',versions?:PolicyVersions,expectedSubject?:string):Promise<ConsentState>{const session=await fetchAuthSession();const token=session.tokens?.accessToken.toString();if(expectedSubject&&session.tokens?.accessToken.payload.sub!==expectedSubject)throw new Error('Session changed');if(!config.api||!token)throw new Error('Consent service unavailable');const response=await fetch(`${config.api.replace(/\/$/,'')}/api/me/consent`,{method,headers:{Authorization:`Bearer ${token}`,...(method==='POST'?{'Content-Type':'application/json'}:{})},...(versions?{body:JSON.stringify({privacy:{version:versions.privacy,accepted:true},terms:{version:versions.terms,accepted:true}})}:{})});if(!response.ok)throw new Error(response.status===409?'POLICY_CHANGED':'CONSENT_UNAVAILABLE');const data=await response.json() as ConsentState;if(typeof data.current!=='boolean'||!data.requiredPolicies?.privacy?.version||!data.requiredPolicies?.terms?.version)throw new Error('Invalid consent response');return data}
export const loadConsent=(subject?:string)=>request('GET',undefined,subject);
export const recordConsent=(versions:PolicyVersions,subject?:string)=>request('POST',versions,subject);
