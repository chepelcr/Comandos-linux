import { it,expect } from 'vitest';
import { previewDocument } from '../src/services/lab-preview';
it('inlines the guest build and restricts its preview to an isolated local API bridge',async()=>{
 const assets:Record<string,string>={'/assets/app.js':'console.log("React");','/assets/app.css':'body{color:blue}'};
 const html=await previewDocument('<html><head><link rel="stylesheet" href="./assets/app.css"></head><body><div id="root"></div><script type="module" src="./assets/app.js"></script></body></html>',async path=>assets[path],'test-nonce');
 expect(html).toContain("connect-src 'none'");expect(html).toContain('window.fetch=');expect(html).toContain('console.log("React")');expect(html).toContain('body{color:blue}');expect(html).not.toContain('src="./assets');
});
it('rejects guest HTML that tries to load an external script',async()=>{
 await expect(previewDocument('<head></head><body><script src="https://outside.example/app.js"></script></body>',async()=>'', 'nonce')).rejects.toThrow('Unsupported preview asset');
});
