import {test,expect} from '@playwright/test';

test('language, theme and lesson navigation commit only under an opaque cover',async({page,isMobile})=>{
 await page.addInitScript(()=>{localStorage.setItem('locale','es');localStorage.setItem('theme','light');});
 await page.goto('/learn/legacy/apache');
 const root=page.locator('html');const heading=page.getByRole('heading',{level:1});
 await expect(heading).toHaveText('Servidor Apache');
 await page.getByRole('button',{name:'Switch to English',exact:true}).click();
 await expect(root).toHaveAttribute('data-motion-phase','out');
 await expect(heading).toHaveText('Servidor Apache');
 await expect(page.locator('.motion-veil')).toHaveClass('motion-veil full-screen');
 await expect(page.locator('.motion-veil')).toHaveAttribute('data-effect','sweep');
 expect(await page.locator('.motion-veil').evaluate(el=>getComputedStyle(el).clipPath)).toContain('inset');
 const fullBounds=await page.locator('.motion-veil').boundingBox();const viewport=page.viewportSize()!;
 expect(fullBounds).toEqual({x:0,y:0,width:viewport.width,height:viewport.height});
 await expect(root).toHaveAttribute('data-motion-phase','covered');
 await expect(heading).toHaveText('Apache web server');
 expect(await page.locator('.motion-veil').evaluate(el=>Number(getComputedStyle(el).opacity))).toBe(1);
 await expect(page.locator('.motion-veil')).toHaveCount(0);
 await page.getByRole('button',{name:'Theme: Light',exact:true}).click();
 await expect(root).toHaveAttribute('data-motion-phase','out');await expect(root).toHaveAttribute('data-theme','light');
 await expect(page.locator('.motion-veil')).toHaveClass('motion-veil full-screen');
 await expect(page.locator('.motion-veil')).toHaveAttribute('data-effect','radial');
 expect(await page.locator('.motion-veil').evaluate(el=>getComputedStyle(el).clipPath)).toContain('circle');
 await expect(root).toHaveAttribute('data-motion-phase','covered');await expect(root).toHaveAttribute('data-theme','dark');
 expect(await page.locator('.motion-veil').evaluate(el=>Number(getComputedStyle(el).opacity))).toBe(1);
 await expect(page.locator('.motion-veil')).toHaveCount(0);
 const header=await page.locator('.header').boundingBox();
 const lab=await page.locator('.inline-lab').elementHandle();
 if(isMobile){await page.getByRole('combobox',{name:'Lessons'}).click();await page.getByRole('option',{name:'PHP runtime',exact:true}).click();}
 else await page.locator('.outline').getByRole('link',{name:'PHP runtime',exact:true}).click();
 await expect(root).toHaveAttribute('data-motion-phase','out');await expect(heading).toHaveText('Apache web server');
 await expect(page.locator('.motion-veil')).not.toHaveClass(/full-screen/);
 await expect(page.locator('.motion-veil')).toHaveAttribute('data-effect','fade');
 const pageCover=await page.locator('.motion-veil').boundingBox();expect(pageCover!.y).toBeGreaterThanOrEqual(header!.y+header!.height);
 await expect(root).toHaveAttribute('data-motion-phase','covered');await expect(heading).toHaveText('PHP runtime');
 expect(await page.locator('.header').boundingBox()).toEqual(header);
 expect(await lab!.evaluate(el=>el.isConnected)).toBe(true);
 await expect(page.locator('.motion-veil')).toHaveCount(0);
 await expect(page.locator('#main')).not.toHaveAttribute('inert','');
});

test('reduced motion updates without a cover or navigation delay',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>localStorage.setItem('locale','es'));
 await page.goto('/');await page.getByRole('button',{name:'Switch to English',exact:true}).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('Your next step starts in the terminal.');
 await expect(page.locator('.motion-veil')).toHaveCount(0);
 await page.getByRole('link',{name:'Start learning',exact:true}).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('Welcome to Linux');
 await expect(page.locator('.motion-veil')).toHaveCount(0);
});
