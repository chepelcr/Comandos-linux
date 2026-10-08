import { describe,it,expect } from 'vitest';
import { encodeFrame,decodeFrame } from '../src/services/ssm-terminal';
describe('AWS SSM binary channel protocol',()=>{
 it('uses the documented 116-byte header and swapped UUID halves without corrupting UTF-8',async()=>{const payload=new TextEncoder().encode('echo Español 🇨🇷\r');const frame=await encodeFrame('input_stream_data',payload,12n,1,1n);expect(new DataView(frame.buffer).getUint32(0)).toBe(116);const decoded=await decodeFrame(frame.buffer);expect(decoded.type).toBe('input_stream_data');expect(decoded.sequence).toBe(12n);expect(new TextDecoder().decode(decoded.payload)).toBe('echo Español 🇨🇷\r');expect(decoded.id).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);});
 it('rejects truncated frames and payload tampering before rendering output',async()=>{await expect(decodeFrame(new ArrayBuffer(32))).rejects.toThrow('Truncated');const bytes=await encodeFrame('output_stream_data',new Uint8Array([1,2,3]));bytes[122]=4;await expect(decodeFrame(bytes.buffer)).rejects.toThrow('digest');});
});
