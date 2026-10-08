import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
let previous={};try{previous=JSON.parse(await readFile('docs/deployment-state.json','utf8'));}catch{}
const profile=process.env.AWS_PROFILE||'PACIFIC-PROD',region=process.env.AWS_REGION||'us-east-1';
const run=(args)=>{const result=spawnSync('aws',[...args,'--profile',profile,'--region',region],{encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr||result.stdout);return result.stdout;};
const deploy=(file,stack,params=[])=>{console.log(`Deploying ${stack}`);run(['cloudformation','deploy','--template-file',`infra/${file}.yml`,'--stack-name',stack,'--capabilities','CAPABILITY_NAMED_IAM','--no-fail-on-empty-changeset',...(params.length?['--parameter-overrides',...params]:[])]);};
const outputs=stack=>Object.fromEntries(JSON.parse(run(['cloudformation','describe-stacks','--stack-name',stack,'--query','Stacks[0].Outputs','--output','json'])).map(o=>[o.OutputKey,o.OutputValue]));
if(process.argv.includes('--plan')){console.log(JSON.stringify({profile,region,order:['linux-lab-accounts','linux-lab-artifacts','linux-lab-progress','linux-lab-public-settings','linux-lab-pages-role','linux-lab-backend-role'],storage:'Private S3 JSON snapshots with conditional ETag writes; no database',frontendDeployment:'GitHub Actions Pages artifact'},null,2));process.exit(0);}
await readFile('backend/service/lambda-package.zip');
deploy('cognito','linux-lab-accounts');deploy('artifacts','linux-lab-artifacts');
const accounts=outputs('linux-lab-accounts'),artifacts=outputs('linux-lab-artifacts');
const key=`progress/${createHash('sha256').update(await readFile('backend/service/lambda-package.zip')).digest('hex')}.zip`;
run(['s3','cp','backend/service/lambda-package.zip',`s3://${artifacts.BucketName}/${key}`]);
deploy('progress-api','linux-lab-progress',[`UserPoolId=${accounts.UserPoolId}`,`ClientId=${accounts.ClientId}`,`ArtifactBucket=${artifacts.BucketName}`,`ArtifactKey=${key}`]);
const api=outputs('linux-lab-progress');
deploy('ssm-frontend','linux-lab-public-settings',[`UserPoolId=${accounts.UserPoolId}`,`ClientId=${accounts.ClientId}`,`CognitoDomain=${accounts.Domain}`,`ApiUrl=${api.ApiUrl}`,'AppUrl=https://linux.jcampos.dev/']);
const account=JSON.parse(run(['sts','get-caller-identity','--output','json'])).Account;
deploy('github-oidc','linux-lab-pages-role',[`OidcProviderArn=arn:aws:iam::${account}:oidc-provider/token.actions.githubusercontent.com`]);
const functionName=run(['cloudformation','describe-stack-resource','--stack-name','linux-lab-progress','--logical-resource-id','ProgressFunction','--query','StackResourceDetail.PhysicalResourceId','--output','text']).trim();
deploy('github-backend-oidc','linux-lab-backend-role',[`OidcProviderArn=arn:aws:iam::${account}:oidc-provider/token.actions.githubusercontent.com`,`ArtifactBucket=${artifacts.BucketName}`,`FunctionArn=arn:aws:lambda:${region}:${account}:function:${functionName}`,...(previous.LabFunction?[`LabFunctionArn=arn:aws:lambda:${region}:${account}:function:${previous.LabFunction}`]:[])]);
await writeFile('docs/deployment-state.json',JSON.stringify({...previous,region,account,...accounts,...api,...outputs('linux-lab-pages-role'),BackendRoleArn:outputs('linux-lab-backend-role').RoleArn,ArtifactBucket:artifacts.BucketName,ProgressFunction:functionName,ArtifactKey:key,updated:new Date().toISOString()},null,2)+'\n');
console.log('Course accounts, progress API, public SSM settings, and Pages OIDC role deployed.');

if(previous.LabFunction){const result=spawnSync(process.execPath,['scripts/deploy-labs.mjs'],{stdio:'inherit',env:process.env});if(result.status!==0)throw new Error('Lab infrastructure update failed');}
