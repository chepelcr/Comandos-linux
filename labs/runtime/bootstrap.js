const status=document.getElementById('boot-status');
const notify=(key)=>parent.postMessage({channel:'linux-lab',type:'status',value:key},location.origin);
try{
 if(!crossOriginIsolated||typeof SharedArrayBuffer==='undefined')throw Error('This browser cannot provide the isolated memory required by Linux.');
 const response=await fetch('./manifest.json');if(!response.ok)throw Error('The Linux pack is missing.');const manifest=await response.json();
 let loaded=0;const total=manifest.files.filter(file=>manifest.packages.some(pack=>pack.parts.includes(file.name))).reduce((sum,file)=>sum+file.bytes,0);
 let cache;try{cache=await caches.open(`linux-lab-${manifest.buildId}`);}catch{}
 const packages=new Map();
 for(const pack of manifest.packages){
  const data=new Uint8Array(pack.bytes);let offset=0;
  for(const name of pack.parts){
   const descriptor=manifest.files.find(file=>file.name===name);const url=new URL(name,location.href);let item=await cache?.match(url.href);if(!item)item=await fetch(url);if(!item.ok)throw Error(`Unable to load ${name}`);
   const bytes=new Uint8Array(await item.arrayBuffer());const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join('');if(digest!==descriptor.sha256){await cache?.delete(url.href);throw Error(`Pack verification failed: ${name}`);}
   data.set(bytes,offset);offset+=bytes.length;loaded+=bytes.length;status.textContent=`Linux · ${Math.round(loaded/total*100)}%`;
   try{await cache?.put(url.href,new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}}));}catch{}
  }
  packages.set(pack.name,data);
 }
 window.Module={preRun:[],getPreloadedPackage:name=>packages.get(name.split('/').pop())?.buffer,wasmBinary:packages.get(manifest.wasm)};
 window.Module.preRun.push(mod=>{const optional=packages.get('nextcloud-lab.tar.gz');if(optional){try{mod.FS.mkdir('/pack');}catch{}mod.FS.writeFile('/pack/nextcloud-lab.tar.gz',optional);packages.delete('nextcloud-lab.tar.gz');}});
 const script=name=>new Promise((resolve,reject)=>{const tag=document.createElement('script');tag.src=name;tag.onload=resolve;tag.onerror=reject;document.head.append(tag);});
 await script('./load.js');await script('./arg-module.js');status.hidden=true;await import('./runtime.js');
}catch(error){notify('labUnsupported');status.textContent=String(error);}
