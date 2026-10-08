import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root='labs/output/preload',name='nextcloud-32.0.15.tar.bz2';
const expected='6974ac1195025f13643df176d456acf4523790d5488c205b57539f642c7d164c';
await mkdir(root,{recursive:true});
try{await readFile(`${root}/${name}`);}catch{const result=spawnSync('curl',['--fail','--location','--retry','3',`https://download.nextcloud.com/server/releases/${name}`,'--output',`${root}/${name}`],{stdio:'inherit'});if(result.status!==0)throw Error('Nextcloud download failed');}
if(createHash('sha256').update(await readFile(`${root}/${name}`)).digest('hex')!==expected)throw Error('Nextcloud checksum mismatch');
const result=spawnSync('python3',['-c',`
import tarfile,pathlib
allowed={'activity','cloud_federation_api','dav','federatedfilesharing','federation','files','files_sharing','files_trashbin','files_versions','logreader','lookup_server_connector','oauth2','provisioning_api','settings','theming','twofactor_backupcodes','viewer','workflowengine'}
with tarfile.open('${root}/${name}','r:bz2') as source,tarfile.open('${root}/nextcloud-lab.tar.gz','w:gz') as target:
 for member in source:
  parts=pathlib.PurePosixPath(member.name).parts
  if 'apps' in parts:
   i=parts.index('apps')
   if len(parts)>i+1 and parts[i+1] not in allowed:continue
  target.addfile(member,source.extractfile(member) if member.isfile() else None)
`],{stdio:'inherit'});if(result.status!==0)throw Error('Nextcloud fixture preparation failed');
await writeFile(`${root}/nextcloud-provenance.json`,JSON.stringify({version:'32.0.15',source:`https://download.nextcloud.com/server/releases/${name}`,sourceSha256:expected,changes:'Omitted optional bundled apps; core and retained app files are unmodified. Offline course fixture, not a production distribution.'},null,2));
console.log('Prepared checksum-verified Nextcloud core exercise fixture.');
