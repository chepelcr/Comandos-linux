import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
const origin='https://linux.jcampos.dev';
const data=async name=>JSON.parse(await readFile(`src/data/${name}.json`,'utf8'));
const [courses,workshops,lessons]=await Promise.all(['courses','workshops','lessons'].map(data));
const expected=['/','/courses','/resources','/about','/privacy','/terms',...courses.map(c=>`/courses/${c.id}`),...workshops.map(w=>`/workshops/${w.id}`),...lessons.map(l=>`/learn/${l.course}/${l.id}`)].map(path=>origin+(path==='/'?'/':path+'/'));
const xml=load(await readFile('build/sitemap.xml','utf8'),{xmlMode:true});
const urls=xml('loc').map((_,el)=>xml(el).text()).get();
assert.equal(new Set(urls).size,urls.length,'Sitemap must not duplicate URLs');
assert.deepEqual([...urls].sort(),expected.sort(),'Sitemap must cover every public page and lesson');
const titles=new Set();
for(const url of [...urls,...['account','settings','dashboard'].map(path=>`${origin}/${path}/`)]){
 const path=new URL(url).pathname;
 const html=load(await readFile(`build${path}index.html`,'utf8'));
 assert.equal(html('link[rel="canonical"]').length,1,`One canonical: ${path}`);
 assert.equal(html('link[rel="canonical"]').attr('href'),url,`Correct canonical: ${path}`);
 assert.ok(html('main h1').text().trim(),`Readable content without JavaScript: ${path}`);
 const privatePage=/^\/(account|settings|dashboard)\/$/.test(path);
 assert.equal(html('meta[name="robots"]').attr('content')?.startsWith('noindex'),privatePage,`Correct indexing: ${path}`);
 assert.ok(html('meta[name="description"]').attr('content')?.length>20,`Useful description: ${path}`);
 assert.equal(html('meta[property="og:url"]').attr('content'),url);
 assert.equal(html('meta[property="og:title"]').attr('content'),html('title').text());
 assert.ok(JSON.parse(html('#structured-data').text())['@graph'].length>=3);
 if(!privatePage){assert.ok(!titles.has(html('title').text()),`Unique public title: ${path}`);titles.add(html('title').text());}
}
const robots=await readFile('build/robots.txt','utf8');
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
assert.ok(!robots.includes('Disallow: /'),'Crawlers must see noindex directives on account pages');
assert.ok(load(await readFile('build/404.html','utf8'))('meta[name="robots"]').attr('content').includes('noindex'));
assert.ok((await readFile('build/images/social-card.png')).length>1000);
console.log(`SEO checks passed: ${urls.length} crawlable pages, 3 noindex account pages, unique titles, canonical URLs, metadata, JSON-LD and real lesson HTML.`);
