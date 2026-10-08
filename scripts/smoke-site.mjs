import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const origin=process.env.SITE_URL||'https://linux.jcampos.dev';
const state=JSON.parse(await readFile(new URL('../docs/deployment-state.json',import.meta.url),'utf8'));
for(const path of ['/me','/labs','/labs/connect']){
 const result=await fetch(`${state.ApiUrl}${path}`,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});
 if(!result.ok||result.headers.get('access-control-allow-origin')!==origin)throw new Error(`Browser preflight failed: ${path}/${result.status}`);
}
console.log('PASS anonymous browser preflight for authenticated APIs');
const browser=await chromium.launch();
try {
 const page=await browser.newPage();await page.addInitScript(()=>{if(!localStorage.getItem('locale'))localStorage.setItem('locale','es');if(!localStorage.getItem('theme'))localStorage.setItem('theme','light');});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(origin);await page.locator('.header').waitFor();
 await page.getByRole('button',{name:'Switch to English',exact:true}).click();
 await page.getByRole('heading',{level:1,name:'Your next step starts in the terminal.',exact:true}).waitFor();
 await page.locator('.theme-button').click();await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark'&&!document.querySelector('.motion-veil'));
 await page.locator('.theme-button').click();await page.waitForFunction(()=>document.documentElement.dataset.theme==='light'&&!document.querySelector('.motion-veil'));
 console.log('PASS live landing, translations and light/dark round trip');
 await page.goto(`${origin}/learn/foundations/intro`);await page.locator('.lesson-content h1').waitFor();
 if(new URL(page.url()).pathname!=='/learn/foundations/intro')throw new Error('Deep link was lost');
 await page.goto(`${origin}/courses/cicd`);await page.getByRole('heading',{level:1}).waitFor();
 console.log('PASS Pages deep links and CI/CD learning path');
 await page.goto(`${origin}/account`);await page.locator('.header').waitFor();
 const signup=page.getByRole('button',{name:'Create account',exact:true});await signup.waitFor();await signup.click();
 await page.locator('#signup-email').waitFor();await page.locator('#signup-password').waitFor();await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.locator('#signin-email').waitFor();
 await page.locator('#signin-password').waitFor();
 await page.getByRole('button',{name:'Forgot your password?',exact:true}).click();
 await page.getByRole('heading',{name:'Reset password',exact:true}).waitFor();
 if(new URL(page.url()).origin!==origin)throw new Error('Authentication left the course site');
 console.log('PASS in-app Amplify registration, sign-in and recovery forms');
 if(errors.length)throw new Error(`Browser errors: ${errors.join('; ')}`);
}finally{await browser.close();}
