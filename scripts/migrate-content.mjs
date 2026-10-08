import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
import { load } from 'cheerio';
import { spawnSync } from 'node:child_process';
const legacy=JSON.parse(await readFile('docs/legacy-source.json','utf8'));
const git=(args)=>{const result=spawnSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024});if(result.status!==0)throw Error(`Legacy snapshot unavailable: fetch origin ${legacy.branch} first. ${result.stderr}`);return result.stdout;};
const originalFile=path=>git(['show',`${legacy.commit}:${legacy.archive}/${path}`]);
const originals=git(['ls-tree','--name-only',`${legacy.commit}:${legacy.archive}`]).trim().split('\n');

const hash = s => createHash('sha256').update(s).digest('hex');
const literal = n => {
  if (n.type === 'Literal') return n.value;
  if (n.type === 'BinaryExpression' && n.operator === '+') return literal(n.left) + literal(n.right);
  throw new Error(`Unexpected executable syntax ${n.type}`);
};
const script = originalFile('dist/js/script.js');
const ast = parse(script, { ecmaVersion: 'latest' });
const values = new Map();
for (const node of ast.body) {
  const expression = node.type === 'ExpressionStatement' && node.expression;
  if (expression?.type === 'AssignmentExpression' && expression.left.object?.name === 'example_txt') {
    values.set(expression.left.property.value, literal(expression.right));
  }
}
const examples = [...script.matchAll(/case '([^']+)':\s*texto_copiar = example_txt\[(\d+)\];\s*icono = [^;]+;\s*title = "([^"]+)"/g)].map(([, id, index, title]) => ({ id, legacyIndex: Number(index), title, code: values.get(Number(index)), source: 'dist/js/script.js' }));
if (examples.length !== 28 || examples.some(e => typeof e.code !== 'string')) throw new Error('Missing legacy examples');
await writeFile('src/data/legacy-examples.json', JSON.stringify(examples, null, 2) + '\n');
const documents = [];
for (const filename of originals.filter(n => n.endsWith('.html')).sort()) {
  const original = originalFile(filename);
  const $ = load(original);
  $('script,style').remove();
  const blocks = [];
  // Preserve every meaningful text node, including text outside semantic tags.
  function walk(node) {
    if (node.type === 'text') {
      const text = node.data.replace(/\s+/g, ' ').trim();
      if (text) blocks.push({ type: /^h[1-6]$/.test(node.parent?.name) ? 'heading' : 'text', text });
    }
    for (const child of node.children || []) walk(child);
  }
  walk($.root()[0]);
  documents.push({ id: filename.replace('.html', ''), source: filename, sha256: hash(original), blocks,
    links: $('a[href]').map((_, el) => ({ label: $(el).text().trim(), href: $(el).attr('href') })).get(),
    images: $('img[src]').map((_, el) => ({ src: $(el).attr('src').replace('dist/img/', 'images/'), alt: $(el).attr('alt') || '' })).get() });
}
await writeFile('src/data/source-documents.json', JSON.stringify(documents, null, 2) + '\n');
const manifest = { version: 1, documents: documents.map(d => ({ source: d.source, sha256: d.sha256, blockCount: d.blocks.length, destination: `source-documents#${d.id}`, disposition: 'structured-json-original-reference' })), examples: examples.map(e => ({ id: e.id, legacyIndex: e.legacyIndex, sha256: hash(e.code), destination: `lessons#${e.id}` })) };
await writeFile('docs/migration-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Preserved ${examples.length} command bodies and ${documents.length} source documents without executing legacy code.`);
