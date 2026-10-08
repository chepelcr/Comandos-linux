// Creates one disposable account with suppressed email, verifies native SRP/API access,
// then deletes it and its progress through the app. Never logs passwords or tokens.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
const origin=process.env.SITE_URL||'http://127.0.0.1:5173';
const profile=process.env.AWS_PROFILE||'PACIFIC-PROD';
const aws=args=>JSON.parse(execFileSync('aws',[...args,'--profile',profile,'--region','us-east-1','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']})||'null');
const stack=aws(['cloudformation','describe-stacks','--stack-name','linux-lab-accounts']);
const pool=stack.Stacks[0].Outputs.find(o=>o.OutputKey==='UserPoolId').OutputValue;
const email=`auth-check-${randomUUID()}@example.com`,password=`Lab9!${randomUUID()}`;
const dir=await mkdtemp(join(tmpdir(),'linux-native-auth-'));let created=false,browser,page,token,labId;
async function input(name,value){const path=join(dir,name);await writeFile(path,JSON.stringify(value),{mode:0o600});return `file://${path}`;}
try {
 aws(['cognito-idp','admin-create-user','--cli-input-json',await input('create.json',{UserPoolId:pool,Username:email,MessageAction:'SUPPRESS',UserAttributes:[{Name:'email',Value:email},{Name:'email_verified',Value:'true'},{Name:'locale',Value:'en'}]})]);created=true;
 aws(['cognito-idp','admin-set-user-password','--cli-input-json',await input('password.json',{UserPoolId:pool,Username:email,Password:password,Permanent:true})]);
 browser=await chromium.launch();page=await browser.newPage();await page.addInitScript(()=>localStorage.setItem('locale','en'));
 const requests=[],responses=[];page.on('request',req=>{if(req.url().includes('execute-api')&&req.headers().authorization)token=req.headers().authorization;if(req.url().includes('/labs'))requests.push({url:req.url(),method:req.method()});});page.on('response',res=>{if(res.url().includes('/labs'))responses.push({status:res.status(),url:res.url()});});
 await page.goto(`${origin}/account`);await page.locator('#signin-email').fill(email);await page.locator('#signin-password').fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.getByRole('heading',{name:email,exact:true}).waitFor({timeout:30000});
 if(new URL(page.url()).origin!==origin)throw new Error('Native login left the course site');
 page.on('response',res=>{if(res.url().includes('execute-api'))console.log('API',new URL(res.url()).pathname,res.status());});
 await page.getByRole('status').filter({hasText:/^Saved$/}).waitFor({timeout:20000});
 console.log('PASS native Amplify SRP login and authenticated online progress');
 await page.goto(`${origin}/learn/foundations/intro`);await page.locator('.lesson-content h1').waitFor();
 await page.getByRole('button',{name:'Start lab',exact:true}).waitFor({state:'visible'});
 await page.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Start lab'));return b&&!b.disabled;},{},{timeout:20000});
 if(requests.some(req=>req.method==='POST'))throw new Error('Opening a lesson provisioned or connected a lab');
 if(!responses.some(res=>res.status===200))throw new Error(`Lab status unavailable: ${JSON.stringify(responses)}`);
 console.log('PASS authenticated lab status; opening a lesson creates no EC2 instance');
 if(process.env.VERIFY_LAB_EXERCISE==='1'){
  const launched=page.waitForResponse(res=>new URL(res.url()).pathname==='/labs'&&res.request().method()==='POST');
  await page.getByRole('button',{name:'Start lab',exact:true}).click();
  const response=await launched;const result=await response.json();if(!response.ok())throw new Error('Lab launch failed');labId=result.session.id;
  await page.getByText('Connected · Private Linux',{exact:true}).waitFor({timeout:150000});
  await page.getByRole('button',{name:/^(Check exercise|Check again)$/,exact:true}).click();
  await page.getByText('The exercise does not pass yet. Review its steps in the terminal.',{exact:true}).waitFor({timeout:45000});
  console.log('PASS empty intro exercise is rejected by the check button');
  await page.locator('.xterm-helper-textarea').focus();await page.keyboard.type('mkdir -p ~/practice; uname -a > ~/practice/system.txt; echo CHECKPOINT_READY',{delay:5});await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  await page.getByRole('button',{name:/^(Check exercise|Check again)$/,exact:true}).click();
  await page.getByText('Result verified in Linux',{exact:true}).waitFor({timeout:45000});
  console.log('PASS completed intro exercise is verified by the check button without learner validator commands');
  await page.locator('.xterm-helper-textarea').focus();await page.keyboard.type('rm ~/practice/system.txt',{delay:5});await page.keyboard.press('Enter');await page.waitForTimeout(500);
  await page.getByRole('button',{name:/^(Check exercise|Check again)$/,exact:true}).click();
  await page.getByText('The exercise does not pass yet. Review its steps in the terminal.',{exact:true}).waitFor({timeout:45000});
  console.log('PASS deleting exercise evidence makes the next check fail');
  await page.getByRole('button',{name:'End lab',exact:true}).click();await page.getByRole('button',{name:'Start lab',exact:true}).waitFor({timeout:45000});labId=undefined;
 }
 await page.goto(`${origin}/account`);page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Delete account and data',exact:true}).click();
 await page.locator('#signin-email').waitFor({timeout:30000});created=false;
 console.log('PASS in-app account deletion and local session cleanup');
} catch(error) {
 console.log('UI status:',await page?.getByRole('status').allTextContents());console.log('UI errors:',await page?.getByRole('alert').allTextContents());throw error;
} finally {
 if(labId&&token){
  const {ApiUrl}=JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../docs/deployment-state.json',import.meta.url),'utf8'));
  for(let retry=0;retry<25;retry++){const response=await fetch(`${ApiUrl}/labs`,{method:'DELETE',headers:{Authorization:token}});const body=await response.json();if(response.ok()&&!body.session){labId=undefined;break;}await new Promise(resolve=>setTimeout(resolve,1500));}
  if(labId){const found=aws(['ec2','describe-instances','--filters',`Name=tag:LabId,Values=${labId}`,'Name=tag:Application,Values=linux-course-lab']);const ids=found.Reservations.flatMap(r=>r.Instances.map(i=>i.InstanceId));if(ids.length)aws(['ec2','terminate-instances','--instance-ids',...ids]);}
 }
 await browser?.close();
 if(created)aws(['cognito-idp','admin-delete-user','--user-pool-id',pool,'--username',email]);
 await rm(dir,{recursive:true,force:true});
}
