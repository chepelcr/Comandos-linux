import initModule from './out.js';
const send=(type,value)=>parent.postMessage({channel:'linux-lab',type,value},location.origin);
const terminal=new Terminal({fontSize:14,fontFamily:'monospace',convertEol:true,theme:{background:'#101521',foreground:'#e6edfa'},scrollback:5000});terminal.open(document.getElementById('terminal'));
const originalWrite=terminal.write.bind(terminal);let output='';terminal.write=(data,...args)=>{output+=typeof data==='string'?data:new TextDecoder().decode(data);originalWrite(data,...args);};setInterval(()=>{if(output){send('output',output.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,''));output='';}},400);
const {master,slave}=openpty();terminal.loadAddon(master);
const resize=()=>terminal.resize(Math.max(20,Math.floor((innerWidth-30)/8.4)),Math.max(8,Math.floor((innerHeight-28)/17)));addEventListener('resize',resize);resize();
const mod=window.Module;mod.pty=slave;mod.mainScriptUrlOrBlob=new URL('./out.js',location.href).href;
const callbacks=[];slave.onReadable(()=>{callbacks.splice(0).forEach(cb=>cb());});
mod.preRun.push(m=>{try{m.FS.mkdir('/pack');}catch{}m.FS.writeFile('/pack/info',`t:${Math.round(Date.now()/1000)}\n`);m.TTY.stream_ops.poll=(_stream,_timeout,notify)=>{if(slave.readable)return 1;if(notify){notify.registerCleanupFunc(()=>{const i=callbacks.indexOf(notify);if(i>=0)callbacks.splice(i,1);});callbacks.push(notify);}return 0;};});
const pending=new Map();let instance;const queue=[];let busy=false,ready=false;
function pump(){if(busy||!instance||!queue.length)return;busy=true;const request=queue.shift();instance.FS.writeFile('/pack/request.json',JSON.stringify(request));request.started=Date.now();pending.set(request.id,request);}
addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.channel!=='linux-lab')return;const {type,id,...data}=event.data;if(!['check','http','export','import'].includes(type)||queue.length>20)return;if(type==='check'&&!/^[a-z0-9_-]{1,100}$/.test(id))return;queue.push({type,id:crypto.randomUUID(),...(type==='check'?{lesson:id,requestId:data.requestId}:data)});pump();});
try{
 send('status','labStarting');instance=await initModule(mod);
 const ping=()=>{if(!ready&&!busy){queue.unshift({type:'ping',id:crypto.randomUUID()});pump();}};ping();
 setInterval(()=>{
  try{const response=JSON.parse(instance.FS.readFile('/pack/response.json',{encoding:'utf8'}));instance.FS.unlink('/pack/response.json');const request=pending.get(response.id);if(!request)return;pending.delete(response.id);busy=false;
   if(request.type==='ping'){if(response.value==='ready'){ready=true;send('status','labReady');}}
   else send(request.type,{...response,requestId:request.requestId,id:request.lesson||response.id,...(request.type==='check'?response.value:{})});pump();
  }catch{}
  for(const [id,request] of pending){if(Date.now()-request.started>45000){pending.delete(id);busy=false;if(request.type!=='ping')send(request.type,{requestId:request.requestId,error:'The guest did not respond. Check the terminal.'});pump();}}
 },200);setInterval(ping,2500);
}catch(error){send('status','labUnsupported');terminal.writeln(String(error));}
