import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { chromium } from 'playwright';

const origin='https://linux.jcampos.dev';
const output=resolve('build');
const readJson=async file=>JSON.parse(await readFile(file,'utf8'));
const [courses,workshops,lessons]=await Promise.all(['courses','workshops','lessons'].map(name=>readJson(`src/data/${name}.json`)));
const paths=['/','/courses','/resources','/about','/privacy','/terms',...courses.map(item=>`/courses/${item.id}`),...workshops.map(item=>`/workshops/${item.id}`),...lessons.map(item=>`/learn/${item.course}/${item.id}`)];
const privatePaths=['/account','/settings','/dashboard','/login','/register','/verify-email','/forgot-password','/reset-password','/set-password','/auth/challenge'];
const template=await readFile(resolve(output,'index.html'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=resolve(output,'.'+path);
  if(!file.startsWith(output+'/')&&file!==output){res.writeHead(403).end();return;}
  if((await stat(file).catch(()=>null))?.isDirectory())file=resolve(file,'index.html');
  const data=await readFile(file).catch(()=>null);
  res.setHeader('Content-Type',data?types[extname(file)]||'application/octet-stream':'text/html; charset=utf-8');
  res.end(data||template);
 }catch{res.writeHead(500).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({locale:'es-CR',reducedMotion:'reduce'});
 await context.addInitScript(()=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('locale','es');localStorage.setItem('theme','light');});
 // Prerendering must never contact production authentication, progress or lab services.
 await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
 const page=await context.newPage();
 const failures=[];
 page.on('pageerror',error=>failures.push(error.message));
 for(const path of [...paths,...privatePaths]){
  await page.goto(base+path,{waitUntil:'networkidle'});
  await page.locator('main h1').first().waitFor();
  await page.waitForFunction(path=>document.documentElement.dataset.seoPath===path,path);
  const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
  if(canonical!==origin+(path==='/'?'/':path+'/'))throw Error(`Wrong canonical: ${path}: ${canonical}`);
  if(failures.length)throw Error(`Prerender failed at ${path}: ${failures.join('; ')}`);
  let html=await page.content();
  // These optional values are public verification codes, never AWS credentials.
  for(const [variable,name] of [['GOOGLE_SITE_VERIFICATION','google-site-verification'],['BING_SITE_VERIFICATION','msvalidate.01']]){
   const value=process.env[variable];
   if(value){if(!/^[A-Za-z0-9_-]+$/.test(value))throw Error(`Invalid ${variable}`);html=html.replace('</head>',`<meta name="${name}" content="${value}"></head>`);}
  }
  const destination=resolve(output,'.'+path,'index.html');
  await mkdir(dirname(destination),{recursive:true});
  await writeFile(destination,html);
 }
 // GitHub Pages cannot rewrite dynamic private ticket URLs. Boot only this narrow,
 // non-indexable route from its 404 response; unknown public URLs retain a real 404.
 const notFound=await readFile(resolve(output,'404.html'),'utf8');
 const shell=template.toString();
 const entry=shell.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/)?.[1];
 const styles=[...shell.matchAll(/<link[^>]+(?:href="([^"]+)"[^>]+rel="stylesheet"|rel="stylesheet"[^>]+href="([^"]+)")[^>]*>/g)].map(match=>match[1]||match[2]);
 if(!entry)throw Error('Missing application entry for private deep links');
 const privateBoot=`<script>if(/^\\/support\\/[a-f0-9]{32}\\/?$/.test(location.pathname)){document.body.replaceChildren(Object.assign(document.createElement('div'),{id:'root'}));document.querySelectorAll('style').forEach(node=>node.remove());${JSON.stringify(styles)}.forEach(href=>{const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link)});import(${JSON.stringify(entry)});}</script>`;
 await writeFile(resolve(output,'404.html'),notFound.replace('</body>',privateBoot+'</body>'));
 await mkdir(resolve(output,'support'),{recursive:true});
 await writeFile(resolve(output,'support/index.html'),await readFile(resolve(output,'login/index.html')));
 // Preserve existing bookmarked lab links without exposing duplicate indexable pages.
 for(const [path,target] of [['/practice','/learn/foundations/intro'],...lessons.map(item=>[`/practice/${item.id}`,`/learn/${item.course}/${item.id}`])]){
  const destination=resolve(output,'.'+path,'index.html');
  await mkdir(dirname(destination),{recursive:true});
  await writeFile(destination,`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex, follow"><meta http-equiv="refresh" content="0;url=${target}/"><link rel="canonical" href="${origin}${target}/"><title>Linux Lab</title></head><body><a href="${target}/">Continuar a la lección / Continue to the lesson</a></body></html>`);
 }
 await page.setViewportSize({width:1200,height:630});
 await page.setContent(`<!doctype html><html lang="es"><style>*{box-sizing:border-box}body{margin:0;background:#11192b;color:#f6f7fb;font-family:Arial,sans-serif;padding:70px 78px}small{font-size:22px;letter-spacing:3px;color:#a8b6d0}h1{font-size:104px;letter-spacing:-6px;margin:25px 0 20px}h1 span{color:#a69cff}p{font-size:31px;color:#d0d8e9;line-height:1.5;margin:0}.terminal{position:absolute;right:78px;bottom:70px;padding:22px 30px;border:1px solid #536080;border-radius:16px;color:#87e6b4;font:22px monospace}.credit{position:absolute;left:78px;bottom:77px;font-size:19px;color:#a8b6d0}</style><small>APRENDE HACIENDO · LEARN BY DOING</small><h1>linux<span>lab.</span></h1><p>Linux · Git · React + Node.js<br>Del primer comando a tu primer despliegue.</p><div class="terminal">$ empieza a construir ▋</div><div class="credit">A course by Pacific Code Labs<br>linux.jcampos.dev</div></html>`);
 await page.screenshot({path:resolve(output,'images/social-card.png')});
 const xml=paths.map(path=>`  <url><loc>${origin}${path==='/'?'/':`${path}/`}</loc></url>`).join('\n');
 await writeFile(resolve(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>\n`);
 await writeFile(resolve(output,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
 await writeFile(resolve(output,'.nojekyll'),'');
 await writeFile(resolve(output,'curriculum-release.json'),await readFile('src/generated/curriculum-release.json')); 
 console.log(`Prerendered ${paths.length} public pages and ${privatePaths.length} noindex account pages; generated sitemap, robots.txt and social preview.`);
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
