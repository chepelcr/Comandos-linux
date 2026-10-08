import { spawnSync } from 'node:child_process';
import { copyFile } from 'node:fs/promises';
await copyFile('src/data/courses.json','backend/service/src/data/courses.json');
await copyFile('src/data/lessons.json','backend/service/src/data/lessons.json');
await copyFile('src/data/rewards.json','backend/service/src/data/rewards.json');
const result=spawnSync('npm',['run','package:lambda','--prefix','backend/service'],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
