import { chromium } from '@playwright/test';
const origin=process.env.SITE_URL||'https://linux.jcampos.dev';
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
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.waitForURL(url=>url.hostname.endsWith('.auth.us-east-1.amazoncognito.com'));
 const login=new URL(page.url());if(login.searchParams.get('redirect_uri')!==`${origin}/`||!login.searchParams.get('client_id'))throw new Error('Production Cognito configuration is missing');
 console.log('PASS production SSM Cognito configuration, registration form and hosted sign-in');
 if(errors.length)throw new Error(`Browser errors: ${errors.join('; ')}`);
}finally{await browser.close();}
