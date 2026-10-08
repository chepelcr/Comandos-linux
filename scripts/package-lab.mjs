import { readFile,writeFile,copyFile,readdir,stat,unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root='public/lab/runtime',digest=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const name of ['index.html','runtime.js','bootstrap.js'])await copyFile(`labs/runtime/${name}`,`${root}/${name}`);
for(const [source,target] of [['node_modules/@xterm/xterm/lib/xterm.js','xterm.js'],['node_modules/@xterm/xterm/css/xterm.css','xterm.css'],['node_modules/xterm-pty/index.js','xterm-pty.js'],['labs/output/preload/nextcloud-lab.tar.gz','nextcloud-lab.tar.gz'],['labs/output/preload/nextcloud-provenance.json','nextcloud-provenance.json']])await copyFile(source,`${root}/${target}`);
let previous=[];try{previous=JSON.parse(await readFile(`${root}/manifest.json`,'utf8')).packages||[];}catch{}
const packages=[...previous];
for(const name of await readdir(root)){
 if(!/\.(data|wasm)$/.test(name)&&name!=='nextcloud-lab.tar.gz')continue;
 const bytes=await readFile(`${root}/${name}`),parts=[];
 for(let offset=0;offset<bytes.length;offset+=32*1024*1024){const part=`${name}.part-${String(parts.length).padStart(3,'0')}`;await writeFile(`${root}/${part}`,bytes.subarray(offset,offset+32*1024*1024));parts.push(part);}
 const old=packages.findIndex(pack=>pack.name===name);if(old>=0)packages.splice(old,1);packages.push({name,bytes:bytes.length,sha256:digest(bytes),parts});await unlink(`${root}/${name}`);
}
const used=new Set(packages.flatMap(pack=>pack.parts));for(const name of await readdir(root)){if(name.includes('.part-')&&!used.has(name))await unlink(`${root}/${name}`);}
const files=[];
for(const name of await readdir(root)){if(name==='manifest.json')continue;const info=await stat(`${root}/${name}`);if(!info.isFile())continue;const bytes=await readFile(`${root}/${name}`);files.push({name,bytes:info.size,sha256:digest(bytes)});}
if(!files.some(f=>f.name==='out.js')||!packages.some(pack=>pack.name.endsWith('.wasm')))throw Error('Runtime conversion did not complete');
const wasm=packages.find(pack=>pack.name.endsWith('.wasm')).name;
await writeFile(`${root}/manifest.json`,JSON.stringify({version:2,buildId:digest(JSON.stringify(files)).slice(0,16),engine:'container2wasm-qemu-amd64',upstream:'ecb4caa499f19f1d5cfcddd43b80aa78f98e5102',memoryMiB:1536,externalNetworking:false,wasm,packages,files},null,2)+'\n');
console.log(`Packaged ${files.length} Linux runtime files (${Math.round(files.reduce((a,f)=>a+f.bytes,0)/1024/1024)} MiB); individual data files are at most 32 MiB.`);
