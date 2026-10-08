/** Runs the guest-built React bundle in an opaque, network-blocked iframe. */
export async function previewDocument(html:string,asset:(path:string)=>Promise<string>,nonce:string){
 const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)];
 const styles=[...html.matchAll(/<link[^>]+href="([^"]+\.css)"[^>]*>/g)];
 const path=(value:string)=>{const p=value.replace(/^\.\//,'/');if(!/^\/assets\/[a-zA-Z0-9_.-]+$/.test(p))throw new Error('Unsupported preview asset');return p;};
 let result=html.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<link[^>]*>/g,'');
 const bridge=`(()=>{const waiting=new Map();window.fetch=(url,options={})=>new Promise((resolve,reject)=>{const path=String(url).replace(/^\\.\\//,'/');if(!path.startsWith('/api/')){reject(Error('Only the local lab API is available'));return;}const id=crypto.randomUUID();const timer=setTimeout(()=>{waiting.delete(id);reject(Error('The lab API did not respond'));},30000);waiting.set(id,{resolve,reject,timer});parent.postMessage({channel:'linux-preview',nonce:${JSON.stringify(nonce)},id,path,method:options.method||'GET',body:options.body?JSON.parse(options.body):undefined},'*');});addEventListener('message',event=>{if(event.source!==parent||event.data?.channel!=='linux-preview'||event.data.nonce!==${JSON.stringify(nonce)})return;const r=event.data,p=waiting.get(r.id);if(!p)return;waiting.delete(r.id);clearTimeout(p.timer);if(r.error)p.reject(Error(r.error));else p.resolve(new Response(Uint8Array.from(atob(r.data),c=>c.charCodeAt(0)),{status:r.status,headers:{'Content-Type':r.contentType}}));});})();`;
 const policy=`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'">`;
 const css=await Promise.all(styles.map(async match=>`<style>${(await asset(path(match[1]))).replace(/<\/style/gi,'<\\/style')}</style>`));
 result=result.replace('<head>',`<head>${policy}${css.join('')}`);
 const bundles=await Promise.all(scripts.map(async match=>`<script type="module">${(await asset(path(match[1]))).replace(/<\/script/gi,'<\\/script')}</script>`));
 return result.replace('</body>',`<script>${bridge}</script>${bundles.join('')}</body>`);
}
