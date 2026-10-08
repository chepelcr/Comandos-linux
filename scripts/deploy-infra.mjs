import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const result=spawnSync(process.execPath,['scripts/deploy-infra.mjs',...process.argv.slice(2)],{cwd:fileURLToPath(new URL('../backend',import.meta.url)),env:process.env,stdio:'inherit'});
if(result.error)throw new Error('Clone the private backend first; see docs/repositories.md.');
process.exit(result.status||0);
