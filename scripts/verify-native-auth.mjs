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
const dir=await mkdtemp(join(tmpdir(),'linux-native-auth-'));let created=false,browser,page;
async function input(name,value){const path=join(dir,name);await writeFile(path,JSON.stringify(value),{mode:0o600});return `file://${path}`;}
try {
 aws(['cognito-idp','admin-create-user','--cli-input-json',await input('create.json',{UserPoolId:pool,Username:email,MessageAction:'SUPPRESS',UserAttributes:[{Name:'email',Value:email},{Name:'email_verified',Value:'true'},{Name:'locale',Value:'en'}]})]);created=true;
 aws(['cognito-idp','admin-set-user-password','--cli-input-json',await input('password.json',{UserPoolId:pool,Username:email,Password:password,Permanent:true})]);
 browser=await chromium.launch();page=await browser.newPage();await page.addInitScript(()=>localStorage.setItem('locale','en'));
 const requests=[],responses=[];page.on('request',req=>{if(req.url().includes('/labs'))requests.push({url:req.url(),method:req.method()});});page.on('response',res=>{if(res.url().includes('/labs'))responses.push({status:res.status(),url:res.url()});});
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
 await page.goto(`${origin}/account`);page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Delete account and data',exact:true}).click();
 await page.locator('#signin-email').waitFor({timeout:30000});created=false;
 console.log('PASS in-app account deletion and local session cleanup');
} catch(error) {
 console.log('UI status:',await page?.getByRole('status').allTextContents());console.log('UI errors:',await page?.getByRole('alert').allTextContents());throw error;
} finally {
 await browser?.close();
 if(created)aws(['cognito-idp','admin-delete-user','--user-pool-id',pool,'--username',email]);
 await rm(dir,{recursive:true,force:true});
}
