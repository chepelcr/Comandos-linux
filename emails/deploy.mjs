import { spawnSync } from 'node:child_process';
import { readFile,writeFile } from 'node:fs/promises';
const profile=process.env.AWS_PROFILE||'PACIFIC-PROD',region=process.env.AWS_REGION||'us-east-1';
const run=args=>{const r=spawnSync('aws',[...args,'--profile',profile,'--region',region],{encoding:'utf8'});if(r.status)throw new Error(r.stderr||r.stdout);return r.stdout;};
const outputs=name=>Object.fromEntries(JSON.parse(run(['cloudformation','describe-stacks','--stack-name',name,'--query','Stacks[0].Outputs','--output','json'])).map(o=>[o.OutputKey,o.OutputValue]));
const {templates}=JSON.parse(await readFile('emails/manifest.json','utf8'));
for(const template of templates){const payload={TemplateName:`linux-lab-prod-${template.name}`,SubjectPart:template.subject,HtmlPart:await readFile(`emails/templates/${template.html}`,'utf8'),TextPart:template.subject+'\n\n'+(template.vars.includes('username')?'{{username}}\n':'')+'{{code}}\nhttps://linux.jcampos.dev/account'};const path='/tmp/linux-lab-ses-template.json';await writeFile(path,JSON.stringify(payload));try{run(['ses','get-template','--template-name',payload.TemplateName]);run(['ses','update-template','--template',`file://${path}`]);}catch(e){if(!String(e).includes('TemplateDoesNotExist'))throw e;run(['ses','create-template','--template',`file://${path}`]);}}
const account=JSON.parse(run(['sts','get-caller-identity','--output','json'])).Account;
const production=JSON.parse(run(['sesv2','get-account','--query','ProductionAccessEnabled','--output','json']));
const pool=outputs('linux-lab-accounts');
run(['cloudformation','deploy','--template-file','infra/cognito-emails.yml','--stack-name','linux-lab-emails','--capabilities','CAPABILITY_IAM','--no-fail-on-empty-changeset','--parameter-overrides',`UserPoolArn=arn:aws:cognito-idp:${region}:${account}:userpool/${pool.UserPoolId}`,`Enabled=${production?'true':'false'}`]);
const email=outputs('linux-lab-emails');
run(['cloudformation','deploy','--template-file','infra/cognito.yml','--stack-name','linux-lab-accounts','--no-fail-on-empty-changeset','--parameter-overrides',`CognitoTemplatesLambdaArn=${email.FunctionArn}`,`SesFromArn=${production?`arn:aws:ses:${region}:${account}:identity/jcampos.dev`:''}`]);
console.log(`Eight branded SES templates and Cognito resolver deployed. Branded rendering ${production?'enabled':'awaits SES production approval; public signup keeps default delivery'}.`);
