import { test,expect } from '@playwright/test';
test('clean routes, persisted guest progress, translations and theme',async({page,isMobile})=>{
 await page.addInitScript(()=>localStorage.setItem('locale','es'));
 await page.goto('/');await page.getByRole('button',{name:'Switch to English',exact:true}).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('Your next step starts in the terminal.');
 await page.getByRole('link',{name:'Start learning',exact:true}).click();await expect(page).toHaveURL(/\/learn\/foundations\/intro$/);
 await page.getByRole('button',{name:'Mark reading complete',exact:true}).click();await expect(page.getByRole('button',{name:'Completed',exact:true})).toBeDisabled();
 await page.reload();await expect(page.getByRole('button',{name:'Completed',exact:true})).toBeDisabled();
 if(isMobile)await page.getByRole('button',{name:'Open lab',exact:true}).click();await expect(page.getByRole('link',{name:'Sign in to practice',exact:true})).toBeVisible();await expect(page).toHaveURL(/\/learn\/foundations\/intro$/);
 await page.goto('/account');await expect(page.getByRole('button',{name:'Export progress'})).toBeVisible();
});
test('secondary lab link remains readable in dark and light themes; chrome persists',async({page,isMobile})=>{
 await page.addInitScript(()=>{localStorage.setItem('locale','en');localStorage.setItem('theme','dark');});
 await page.goto('/learn/legacy/apache');
 if(isMobile)await page.getByRole('button',{name:'Open lab',exact:true}).click();const lab=page.getByRole('link',{name:'Sign in to practice',exact:true});await expect(lab).toBeVisible();
 expect(await lab.evaluate(el=>getComputedStyle(el).color)).toBe('rgb(17, 21, 42)');
 expect(await page.locator('.header').evaluate(el=>getComputedStyle(el).viewTransitionName)).toBe('none');
 if(isMobile)await page.getByRole('button',{name:'Close lab drawer',exact:true}).click();await page.getByRole('button',{name:'Theme: Dark',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.getByRole('button',{name:'Theme: Light',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('theme'))).toBe('dark');
 await page.getByRole('button',{name:'Cambiar a español',exact:true}).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('Servidor Apache');await expect(page).toHaveURL(/\/learn\/legacy\/apache$/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('resources is a curated course page and footer credits the studio',async({page})=>{
 await page.goto('/resources');await expect(page.getByRole('link',{name:'firewall.sh'})).toBeVisible();
 await expect(page.locator('.source-document')).toHaveCount(0);
 await expect(page.getByRole('link',{name:/Un curso de Pacific Code Labs|A course by Pacific Code Labs/})).toHaveAttribute('href','https://pacific-code-labs.jcampos.dev');
});

test('legacy lab bookmarks lead to inline lesson labs; about is curated',async({page,isMobile})=>{
 await page.goto('/practice/apache');await expect(page).toHaveURL(/\/learn\/legacy\/apache$/);
 if(isMobile)await page.getByRole('button',{name:/Open lab|Abrir laboratorio/,exact:true}).click();await expect(page.locator('.inline-lab')).toBeVisible();
 await page.goto('/about');await expect(page.locator('.author-photo')).toBeVisible();
 await expect(page.getByRole('heading',{name:'José Pablo Campos Solano',exact:true})).toBeVisible();
 await expect(page.getByText(/Iniciar taller|Empezar Taller|© 2026/)).toHaveCount(0);
 const mission=await page.locator('.about-mission').boundingBox();const container=await page.locator('.about-page').boundingBox();
 const gutters=await page.locator('.about-page').evaluate(el=>parseFloat(getComputedStyle(el).paddingLeft)+parseFloat(getComputedStyle(el).paddingRight));
 expect(Math.round(mission!.width)).toBe(Math.round(container!.width-gutters));
 await expect(page.locator('link[rel=icon]')).toHaveAttribute('href','/favicon.png');
 if(!isMobile){await page.locator('.route-enter').evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));await page.screenshot({path:'docs/screenshots/about-full-width.jpg',fullPage:true});}
});

test('learning workspace only scrolls its lesson; mobile lab is an accessible drawer',async({page,isMobile})=>{
 await page.addInitScript(()=>{localStorage.setItem('locale','en');localStorage.setItem('theme','dark');});
 await page.goto('/learn/legacy/apache');await expect(page.getByRole('heading',{level:1})).toHaveText('Apache web server');
 if(!isMobile)expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
 else { const footer=await page.locator('.footer').boundingBox();expect(footer!.y).toBeGreaterThanOrEqual(await page.evaluate(()=>innerHeight)-1); }
 await page.locator('.route-enter').evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));
 const before=await page.locator('.outline').boundingBox();const header=await page.locator('.header').boundingBox();
 await page.locator('.lesson-content').evaluate(el=>{el.scrollTop=el.scrollHeight;});
 expect(await page.locator('.outline').boundingBox()).toEqual(before);expect(await page.locator('.header').boundingBox()).toEqual(header);
 if(isMobile){
  const trigger=page.getByRole('button',{name:'Open lab',exact:true});await expect(trigger).toBeVisible();await trigger.click();
  const drawer=page.getByRole('dialog',{name:'Terminal',exact:true});await expect(drawer).toBeVisible();
  await drawer.evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));
  const bounds=await drawer.boundingBox();const viewport=page.viewportSize()!;
  expect(bounds).toEqual({x:0,y:0,width:viewport.width,height:viewport.height});
  await expect(trigger).toHaveText('');
  await expect(page.getByRole('button',{name:'Close lab drawer',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(drawer).not.toBeVisible();await expect(trigger).toBeFocused();
 }else{
  const box=await page.locator('.inline-lab').boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual(await page.evaluate(()=>innerHeight));
 }
});


test('CI/CD path offers a real starter and an artifact workflow without an isolated lab',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('locale','en'));
 await page.goto('/courses/cicd');await expect(page.getByRole('heading',{level:1})).toHaveText('CI/CD with GitHub Pages');
 await expect(page.locator('.lesson-row')).toHaveCount(4);
 await page.getByRole('link',{name:/Your deployment repository/}).click();
 await expect(page).toHaveURL(/\/learn\/cicd\/pages-repository$/);
 await expect(page.getByRole('link',{name:'Download React starter',exact:true})).toHaveAttribute('href','/downloads/pages-notes.zip');
 await expect(page.locator('.inline-lab')).toHaveCount(0);
 await page.getByRole('button',{name:'Mark reading complete',exact:true}).click();await page.reload();
 await expect(page.getByRole('button',{name:'Completed',exact:true})).toBeDisabled();
 await page.goto('/learn/cicd/pages-workflow');await expect(page.locator('.code-bar>span')).toHaveText('yaml');
 await expect(page.locator('.code-block code')).toContainText('actions/deploy-pages@');
});

test('desktop outline keeps the full lesson list and scrolls inside the sidebar',async({page,isMobile})=>{
 test.skip(isMobile,'Desktop sidebar; mobile uses the lesson selector.');
 await page.setViewportSize({width:1100,height:540});
 await page.goto('/learn/modern/modern-linux-user');
 await expect(page.locator('.nav a[href="/about"]')).toBeVisible();
 const list=page.locator('.outline ol');await expect(list).toBeVisible();await expect(list.locator('li')).toHaveCount(11);
 const sidebar=await page.locator('.outline').boundingBox();
 const metrics=await list.evaluate(el=>{el.scrollTop=el.scrollHeight;return {height:el.clientHeight,total:el.scrollHeight,top:el.scrollTop};});
 expect(metrics.total).toBeGreaterThan(metrics.height);expect(metrics.top).toBeGreaterThan(0);
 expect(await page.locator('.outline').boundingBox()).toEqual(sidebar);
 expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
});
