// AWS Session Manager binary data-channel protocol. See docs/temporary-ec2-labs.md.
const encoder=new TextEncoder(),decoder=new TextDecoder();
export async function encodeFrame(type:string,payload:Uint8Array,sequence=0n,payloadType=1,flags=0n){
 const bytes=new Uint8Array(120+payload.length),view=new DataView(bytes.buffer);
 view.setUint32(0,116);bytes.set(encoder.encode(type),4);view.setUint32(36,1);view.setBigUint64(40,BigInt(Date.now()));view.setBigInt64(48,sequence);view.setBigUint64(56,flags);
 const uuid=Uint8Array.from(crypto.randomUUID().replaceAll('-','').match(/../g)!,hex=>parseInt(hex,16));bytes.set(uuid.slice(8),64);bytes.set(uuid.slice(0,8),72);
 bytes.set(new Uint8Array(await crypto.subtle.digest('SHA-256',payload.slice().buffer)),80);view.setUint32(112,payloadType);view.setUint32(116,payload.length);bytes.set(payload,120);return bytes;
}
export async function decodeFrame(buffer:ArrayBuffer){
 if(buffer.byteLength<120)throw new Error('Truncated SSM frame');
 const view=new DataView(buffer),bytes=new Uint8Array(buffer);const header=view.getUint32(0),length=view.getUint32(116);
 if(header!==116||length!==buffer.byteLength-120)throw new Error('Invalid SSM frame length');
 const type=decoder.decode(bytes.slice(4,36)).replace(/\0/g,'').trim();
 const payload=bytes.slice(120);
 // Service publication controls and empty frames carry no payload digest.
 if(length&&!['start_publication','pause_publication'].includes(type)){const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',payload.buffer));if(!digest.every((byte,i)=>byte===bytes[80+i]))throw new Error('Invalid SSM frame digest');}
 const uuid=[...bytes.slice(72,80),...bytes.slice(64,72)].map(n=>n.toString(16).padStart(2,'0')).join('');
 return {type,sequence:view.getBigInt64(48),payloadType:view.getUint32(112),payload,id:`${uuid.slice(0,8)}-${uuid.slice(8,12)}-${uuid.slice(12,16)}-${uuid.slice(16,20)}-${uuid.slice(20)}`};
}
export function connectTerminal(channel:{streamUrl:string;token:string},options:{region:string;output:(data:Uint8Array)=>void;ready:()=>void;closed:()=>void;debug?:(event:string)=>void}){
 const url=new URL(channel.streamUrl);if(url.protocol!=='wss:'||url.hostname!==`ssmmessages.${options.region}.amazonaws.com`||!url.pathname.startsWith('/v1/data-channel/'))throw new Error('Invalid terminal endpoint');
 const socket=new WebSocket(url);socket.binaryType='arraybuffer';let outgoing=0n,expected=0n,ready=false,closed=false;
 const pending=new Map<bigint,{data:Uint8Array;lastSent:number;attempts:number}>();const received=new Map<bigint,Awaited<ReturnType<typeof decodeFrame>>>();
 let chain=Promise.resolve(),sending=Promise.resolve();
 const input=(payloadType:number,payload:Uint8Array)=>{
  // SHA-256 is async; preserve input ordering even while a paste is arriving.
  sending=sending.then(async()=>{if(closed)return;const sequence=outgoing++;const bytes=await encodeFrame('input_stream_data',payload,sequence,payloadType,sequence===0n?1n:0n);if(socket.readyState!==WebSocket.OPEN)return;pending.set(sequence,{data:bytes,lastSent:Date.now(),attempts:0});socket.send(bytes);}).catch(()=>socket.close());
 };
 socket.onopen=()=>{options.debug?.('socket opened');socket.send(JSON.stringify({MessageSchemaVersion:'1.0',RequestId:crypto.randomUUID(),TokenValue:channel.token,ClientId:crypto.randomUUID(),ClientVersion:'1.2.694.0'}));};
 const process=async(frame:Awaited<ReturnType<typeof decodeFrame>>)=>{
  if(frame.payloadType===5){
   const handshake=JSON.parse(decoder.decode(frame.payload)) as {RequestedClientActions:{ActionType:string;ActionParameters:{SessionType?:string}}[]};
   const valid=handshake.RequestedClientActions.every(a=>a.ActionType==='SessionType'&&a.ActionParameters.SessionType==='Standard_Stream');
   if(!valid)throw new Error('Unsupported terminal handshake');
   input(6,encoder.encode(JSON.stringify({ClientVersion:'1.2.694.0',ProcessedClientActions:handshake.RequestedClientActions.map(a=>({ActionType:a.ActionType,ActionStatus:1,ActionResult:null,Error:''})),Errors:[]})));
  }else if(frame.payloadType===7){if(!ready){ready=true;options.ready();}}
  else if(frame.payloadType===1||frame.payloadType===2||frame.payloadType===11){
   // Agents may start Standard_Stream directly without a handshake exchange.
   if(!ready){ready=true;options.ready();}
   options.output(frame.payload);
  }
  else if(frame.payloadType===12)socket.close();
 };
 socket.onmessage=event=>{
  chain=chain.then(async()=>{
   if(typeof event.data==='string'){const message=JSON.parse(event.data);if(message.MessageType==='channel_closed')socket.close();return;}
   const frame=await decodeFrame(event.data as ArrayBuffer);options.debug?.(`${frame.type}: ${frame.payloadType} sequence ${frame.sequence}`);
   if(frame.type==='acknowledge'){const ack=JSON.parse(decoder.decode(frame.payload));pending.delete(BigInt(ack.AcknowledgedMessageSequenceNumber));return;}
   if(frame.type==='channel_closed'){socket.close();return;}
   if(frame.type!=='output_stream_data')return;
   const ack=encoder.encode(JSON.stringify({AcknowledgedMessageType:frame.type,AcknowledgedMessageId:frame.id,AcknowledgedMessageSequenceNumber:Number(frame.sequence),IsSequentialMessage:true}));
   const encoded=await encodeFrame('acknowledge',ack);if(socket.readyState===WebSocket.OPEN)socket.send(encoded);
   if(frame.sequence<expected)return;if(received.size>=256)throw new Error('Terminal stream overflow');received.set(frame.sequence,frame);
   while(received.has(expected)){const next=received.get(expected)!;received.delete(expected++);await process(next);}
  }).catch(error=>{options.debug?.(`protocol error: ${error instanceof Error?error.message:'unknown'}`);socket.close();});
 };
 const timer=setInterval(()=>{if(socket.readyState!==WebSocket.OPEN)return;for(const item of pending.values()){if(Date.now()-item.lastSent<Math.min(1000*2**item.attempts,8000))continue;if(item.attempts++>=8){socket.close();return;}item.lastSent=Date.now();socket.send(item.data.slice().buffer);}},1000);
 socket.onclose=()=>{closed=true;clearInterval(timer);pending.clear();options.closed();};socket.onerror=()=>socket.close();
 return {input:(data:string)=>{if(ready)input(1,encoder.encode(data));},resize:(cols:number,rows:number)=>{if(ready)input(3,encoder.encode(JSON.stringify({cols,rows})));},close:()=>{closed=true;clearInterval(timer);socket.close();}};
}
