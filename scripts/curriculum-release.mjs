import {createHash,createHmac} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {SSMClient} from '@aws-sdk/client-ssm';
import {execFileSync} from 'node:child_process';
const digest=value=>createHash('sha256').update(value).digest('hex');
const files=Object.fromEntries(['courses','lessons','workshops','lab-exercises','rewards','about','footer','legal','legacy-examples','source-documents','source-translations'].map(key=>[key,`src/data/${key}.json`]));
files['locales-es']='src/locales/es.json';files['locales-en']='src/locales/en.json';
const settings={...process.env};
try{for(const line of (await readFile('.env.production.local','utf8')).split('\n')){const index=line.indexOf('=');if(index>0){const key=line.slice(0,index);settings[key]??=JSON.parse(line.slice(index+1));}}}catch(error){if(error.code!=='ENOENT')throw error;}
const region=settings.AWS_REGION||settings.VITE_AWS_REGION||'us-east-1';
const hash=value=>digest(JSON.stringify(value));
const hmac=(key,value)=>createHmac('sha256',key).update(value).digest();
async function signedRequest(url,credentials,method='GET',body){
 const target=new URL(url);if(target.protocol!=='https:')throw Error('Curriculum endpoints must use HTTPS');
 const amzDate=new Date().toISOString().replace(/[:-]|\.\d{3}/g,''),date=amzDate.slice(0,8),text=body===undefined?'':JSON.stringify(body);
 const headers={'host':target.host,'x-amz-date':amzDate,...(credentials.sessionToken?{'x-amz-security-token':credentials.sessionToken}:{})};
 const signed=Object.keys(headers).sort(),canonical=[method,target.pathname,'',signed.map(key=>`${key}:${headers[key]}\n`).join(''),signed.join(';'),digest(text)].join('\n');
 const scope=`${date}/${region}/execute-api/aws4_request`;let key=hmac(`AWS4${credentials.secretAccessKey}`,date);for(const part of [region,'execute-api','aws4_request'])key=hmac(key,part);
 const signature=createHmac('sha256',key).update(['AWS4-HMAC-SHA256',amzDate,scope,digest(canonical)].join('\n')).digest('hex');
 const response=await fetch(target,{method,headers:{'X-Amz-Date':amzDate,...(credentials.sessionToken?{'X-Amz-Security-Token':credentials.sessionToken}:{}),Authorization:`AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${scope}, SignedHeaders=${signed.join(';')}, Signature=${signature}`,...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:text}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error(`Curriculum API failed (${response.status})`);return response.json();
}
async function guestCredentials(){
 const pool=settings.VITE_COURSES_IDENTITY_POOL_ID;if(!pool)throw Error('Missing guest identity pool');
 const identity=async(target,body)=>{const response=await fetch(`https://cognito-identity.${region}.amazonaws.com/`,{method:'POST',headers:{'Content-Type':'application/x-amz-json-1.1','X-Amz-Target':`AWSCognitoIdentityService.${target}`},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error(`Guest identity failed (${response.status})`);return response.json();};
 const {IdentityId}=await identity('GetId',{IdentityPoolId:pool});const {Credentials:c}=await identity('GetCredentialsForIdentity',{IdentityId});return {accessKeyId:c.AccessKeyId,secretAccessKey:c.SecretKey,sessionToken:c.SessionToken};
}
const roleCredentials=()=>new SSMClient({region}).config.credentials();
const mode=process.argv[2]||'pull',releaseId=settings.COURSES_RELEASE_ID,operationId=settings.COURSES_PUBLICATION_ID;
if(mode==='pull'){
 if(!settings.VITE_COURSES_API_BASE_URL&&!releaseId){console.log('Curriculum API not configured; using versioned bundled content.');process.exit(0);}
 let release;
 if(releaseId){
  if(!/^release-[a-f0-9-]{36}$/.test(releaseId)||!/^publish-[a-f0-9]{32}$/.test(operationId||'')||!settings.COURSES_CI_API_BASE_URL)throw Error('A candidate build requires an exact release, publication ID and CI gateway');
  const credentials=await roleCredentials();
  const operation=await signedRequest(`${settings.COURSES_CI_API_BASE_URL}/api/internal/courses/publications/${operationId}`,credentials);
  if(operation.releaseId!==releaseId||operation.state!=='building-site')throw Error('Publication is not awaiting this release');
  release=await signedRequest(`${settings.COURSES_CI_API_BASE_URL}/api/internal/courses/releases/${releaseId}`,credentials);
  release.sequence=operation.expectedPublishedVersion+1;
  const source=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  if(release.sourceRef!==source)throw Error('Candidate source ref must match the checked-out commit');
 }else{
  try{release=await signedRequest(`${settings.VITE_COURSES_API_BASE_URL}/api/public/courses`,await guestCredentials());}
  catch(error){if(settings.COURSES_REQUIRE_PUBLISHED==='true')throw error;console.log('Published curriculum unavailable; retaining bundled content.');process.exit(0);}
 }
 if(release.version!==1||typeof release.releaseId!=='string'||!release.documents||hash(release.documents)!==release.digest)throw Error('Invalid curriculum release or digest');
 for(const key of Object.keys(files))if(!Object.hasOwn(release.documents,key))throw Error(`Release is missing ${key}`);
 for(const key of ['legacy-examples','source-documents','source-translations'])if(hash(JSON.parse(await readFile(files[key],'utf8')))!==hash(release.documents[key]))throw Error(`Original content changed: ${key}`);
 // The subsequent content/type/SEO gates validate the full candidate before deployment.
 for(const [key,file]of Object.entries(files))await writeFile(file,JSON.stringify(release.documents[key],null,2)+'\n');
 const meta={releaseId:release.releaseId,sequence:release.sequence||0,digest:release.digest,sourceRef:release.sourceRef,capabilities:release.capabilities};
 await mkdir('src/generated',{recursive:true});await writeFile('src/generated/curriculum-release.json',JSON.stringify(meta,null,2)+'\n');
 await mkdir('build-release',{recursive:true});await writeFile('build-release/proof.json',JSON.stringify({...meta,operationId},null,2)+'\n');
 console.log(`Prepared exact curriculum release ${release.releaseId}.`);
}else if(mode==='finalize'){
 if(!releaseId||!operationId)throw Error('Finalization requires candidate inputs');
 const proof=JSON.parse(await readFile('build-release/proof.json','utf8'));
 if(proof.releaseId!==releaseId||proof.operationId!==operationId)throw Error('Build proof does not match publication inputs');
 const deployment=await fetch('https://linux.jcampos.dev/curriculum-release.json',{cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!deployment.ok)throw Error('Deployed release marker is unavailable');const actual=await deployment.json();
 if(actual.releaseId!==proof.releaseId||actual.digest!==proof.digest||actual.sourceRef!==proof.sourceRef)throw Error('Deployed site does not match the candidate');
 for(const path of ['/','/courses/','/sitemap.xml']){const response=await fetch(`https://linux.jcampos.dev${path}`,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error(`Deployed route failed: ${path}`);}
 const artifactDigest=await readFile('build-release/artifact.sha256','utf8');
 await signedRequest(`${settings.COURSES_CI_API_BASE_URL}/api/internal/courses/publications/${operationId}/finalize`,await roleCredentials(),'POST',{releaseId,artifactDigest:artifactDigest.trim(),deploymentUrl:'https://linux.jcampos.dev',siteVerified:true,sourceRef:proof.sourceRef,capabilities:proof.capabilities});
 console.log(`Activated verified curriculum release ${releaseId}.`);
}else throw Error('Expected pull or finalize');
