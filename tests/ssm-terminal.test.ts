import { describe,it,expect,vi } from 'vitest';
import { encodeFrame,decodeFrame,connectTerminal } from '../src/services/ssm-terminal';
describe('AWS SSM binary channel protocol',()=>{
 it('uses the documented 116-byte header and swapped UUID halves without corrupting UTF-8',async()=>{const payload=new TextEncoder().encode('echo Español 🇨🇷\r');const frame=await encodeFrame('input_stream_data',payload,12n,1,1n);expect(new DataView(frame.buffer).getUint32(0)).toBe(116);const decoded=await decodeFrame(frame.buffer);expect(decoded.type).toBe('input_stream_data');expect(decoded.sequence).toBe(12n);expect(new TextDecoder().decode(decoded.payload)).toBe('echo Español 🇨🇷\r');expect(decoded.id).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);});
 it('accepts AWS publication controls with an empty payload and zero digest',async()=>{const bytes=new Uint8Array(120);new DataView(bytes.buffer).setUint32(0,116);bytes.set(new TextEncoder().encode('start_publication'),4);const frame=await decodeFrame(bytes.buffer);expect(frame.type).toBe('start_publication');expect(frame.payload.length).toBe(0);});
 it('rejects truncated frames and payload tampering before rendering output',async()=>{await expect(decodeFrame(new ArrayBuffer(32))).rejects.toThrow('Truncated');const bytes=await encodeFrame('output_stream_data',new Uint8Array([1,2,3]));bytes[122]=4;await expect(decodeFrame(bytes.buffer)).rejects.toThrow('digest');});
});

it('enables input for agents that start Standard_Stream without handshake messages',async()=>{
 class Socket {static OPEN=1;static current:Socket;readyState=1;binaryType='';onopen?:()=>void;onmessage?:(event:{data:ArrayBuffer})=>void;onclose?:()=>void;onerror?:()=>void;constructor(){Socket.current=this;}send=vi.fn();close(){this.onclose?.();}}
 vi.stubGlobal('WebSocket',Socket);const ready=vi.fn(),output=vi.fn();
 const terminal=connectTerminal({streamUrl:'wss://ssmmessages.us-east-1.amazonaws.com/v1/data-channel/test',token:'test'},{region:'us-east-1',ready,output,closed:()=>{}});
 try {Socket.current.onopen?.();Socket.current.onmessage?.({data:(await encodeFrame('output_stream_data',new TextEncoder().encode('student$ '),0n)).buffer});await vi.waitFor(()=>expect(ready).toHaveBeenCalledOnce());terminal.input('whoami\r');await vi.waitFor(()=>expect(Socket.current.send.mock.calls.length).toBeGreaterThanOrEqual(3));Socket.current.onmessage?.({data:(await encodeFrame('output_stream_data',new TextEncoder().encode('student'),1n)).buffer});await vi.waitFor(()=>expect(output).toHaveBeenCalledTimes(2));expect(ready).toHaveBeenCalledOnce();}finally{terminal.close();vi.unstubAllGlobals();}
});
