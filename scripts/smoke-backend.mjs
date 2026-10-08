import { spawnSync } from 'node:child_process';
import { mkdtemp,writeFile,readFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const profile=process.env.AWS_PROFILE||'PACIFIC-PROD';
const run=args=>{const r=spawnSync('aws',[...args,'--profile',profile,'--region','us-east-1'],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);return r.stdout;};
const functionName=run(['cloudformation','describe-stack-resource','--stack-name','linux-lab-progress','--logical-resource-id','ProgressFunction','--query','StackResourceDetail.PhysicalResourceId','--output','text']).trim();
const bucket=run(['cloudformation','describe-stack-resource','--stack-name','linux-lab-progress','--logical-resource-id','ProgressBucket','--query','StackResourceDetail.PhysicalResourceId','--output','text']).trim();
const dir=await mkdtemp(`${tmpdir()}/linux-api-smoke-`),prefix=`smoke-${randomUUID()}`;
async function invoke(sub,method,body){await writeFile(`${dir}/event.json`,JSON.stringify({version:'2.0',routeKey:'ANY /me',rawPath:'/me',headers:{'content-type':'application/json'},requestContext:{http:{method,path:'/me',protocol:'HTTP/1.1',sourceIp:'127.0.0.1'},authorizer:{jwt:{claims:{sub,token_use:'access'}}}},...(body?{body:JSON.stringify(body)}:{})}));run(['lambda','invoke','--function-name',functionName,'--cli-binary-format','raw-in-base64-out','--payload',`file://${dir}/event.json`,`${dir}/result.json`]);const result=JSON.parse(await readFile(`${dir}/result.json`,'utf8'));if(result.errorMessage)throw Error(result.errorMessage);return {status:result.statusCode,body:result.body?JSON.parse(result.body):null};}
try{
 const input={completed:['intro'],exercises:[],bookmarks:[],lastLesson:'intro',epoch:0,preferences:{}};
 const first=await invoke(prefix+'-a','POST',input);assert.equal(first.status,200,JSON.stringify(first));assert.equal(first.body.points,10);
 const original=JSON.parse(run(['s3api','get-object','--bucket',bucket,'--key',`progress/${prefix}-a.json`,`${dir}/snapshot.json`]));
 const repeat=await invoke(prefix+'-a','POST',input);assert.equal(repeat.body.points,10);
 const staleWrite=spawnSync('aws',['s3api','put-object','--bucket',bucket,'--key',`progress/${prefix}-a.json`,'--body',`${dir}/snapshot.json`,'--if-match',original.ETag,'--profile',profile,'--region','us-east-1'],{encoding:'utf8'});assert.notEqual(staleWrite.status,0);assert.match(staleWrite.stderr,/PreconditionFailed/);
 const second=await invoke(prefix+'-b','GET');assert.deepEqual(second.body.completed,[]);
 const reset=await invoke(prefix+'-a','DELETE');assert.equal(reset.body.points,0);
 const stale=await invoke(prefix+'-a','POST',input);assert.equal(stale.status,409);
 const {ApiUrl}=JSON.parse(await readFile('docs/deployment-state.json','utf8'));
 assert.equal((await fetch(`${ApiUrl}/me`)).status,401);
 const preflight=await fetch(`${ApiUrl}/me`,{method:'OPTIONS',headers:{Origin:'https://linux.jcampos.dev','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});assert.equal(preflight.headers.get('access-control-allow-origin'),'https://linux.jcampos.dev');
 console.log('Live S3 API passed: rejected stale ETag writes, account isolation, idempotent points, reset epochs, unauthorized rejection, CORS. No students or emails were created.');
}finally{for(const suffix of ['-a','-b'])run(['s3api','delete-object','--bucket',bucket,'--key',`progress/${prefix+suffix}.json`]);await rm(dir,{recursive:true,force:true});}
