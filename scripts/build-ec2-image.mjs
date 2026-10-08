import { spawnSync } from 'node:child_process';
import { readFile,writeFile,rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const profile=process.env.AWS_PROFILE||'PACIFIC-PROD',region='us-east-1';
const run=args=>{const r=spawnSync('aws',[...args,'--profile',profile,'--region',region],{encoding:'utf8',maxBuffer:4*1024*1024});if(r.status!==0)throw new Error(r.stderr||`AWS command interrupted (${r.signal||r.status})`);return r.stdout.trim();};
const state=JSON.parse(await readFile('docs/deployment-state.json','utf8'));
const bytes=await readFile('labs/output/ec2-course-pack.tar.gz');const digest=createHash('sha256').update(bytes).digest('hex');const key=`labs/images/${digest}.tar.gz`;
console.log('Preparing the immutable offline course pack.');
try{run(['s3api','head-object','--bucket',state.ArtifactBucket,'--key',key]);}catch{run(['s3','cp','labs/output/ec2-course-pack.tar.gz',`s3://${state.ArtifactBucket}/${key}`,'--only-show-errors']);}
run(['s3api','head-object','--bucket',state.ArtifactBucket,'--key',key]);
const signed=run(['s3','presign',`s3://${state.ArtifactBucket}/${key}`,'--expires-in','3600']);
const images=JSON.parse(run(['ec2','describe-images','--owners','136693071363','--filters','Name=name,Values=debian-12-amd64-*','Name=state,Values=available','--query','reverse(sort_by(Images,&CreationDate))[:1]','--output','json']));
const base=images[0];if(!base)throw new Error('Official Debian 12 image unavailable');
const bootstrap=`#!/bin/bash
set -euo pipefail
trap 'echo COURSE_IMAGE_FAILED >/dev/console' ERR
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y curl ca-certificates
curl -fsSL https://s3.us-east-1.amazonaws.com/amazon-ssm-us-east-1/latest/debian_amd64/amazon-ssm-agent.deb -o /tmp/ssm.deb
dpkg -i /tmp/ssm.deb
rm /tmp/ssm.deb
systemctl enable --now amazon-ssm-agent
curl -fsSL '${signed}' -o /tmp/course-pack.tar.gz
printf '${digest}  /tmp/course-pack.tar.gz\\n' | sha256sum --check
# Discard the signed URL from cloud-init's stored user data before snapshotting.
tar -xzf /tmp/course-pack.tar.gz -C /
rm /tmp/course-pack.tar.gz
bash /opt/course/bake.sh
rm -f /var/lib/cloud/instance/user-data.txt /var/lib/cloud/instance/user-data.txt.i
rm -rf /var/lib/cloud/instances/*
echo COURSE_IMAGE_READY >/dev/console
`;
const temp='/tmp/linux-course-builder-parameters.json';await writeFile(temp,JSON.stringify([{ParameterKey:'BaseImageId',ParameterValue:base.ImageId},{ParameterKey:'UserData',ParameterValue:Buffer.from(bootstrap).toString('base64')}]),{mode:0o600});
let created=false;
try{
 console.log('Creating a temporary image builder with no inbound ports.');
 run(['cloudformation','create-stack','--stack-name','linux-lab-image-builder','--template-body','file://infra/lab-image-builder.yml','--parameters',`file://${temp}`,'--capabilities','CAPABILITY_IAM']);created=true;
 run(['cloudformation','wait','stack-create-complete','--stack-name','linux-lab-image-builder']);
 const builder=run(['cloudformation','describe-stacks','--stack-name','linux-lab-image-builder','--query',"Stacks[0].Outputs[?OutputKey=='BuilderInstanceId'].OutputValue | [0]",'--output','text']);
 await writeFile('labs/output/image-builder-state.json',JSON.stringify({builder,baseImageId:base.ImageId,packKey:key,packSha256:digest},null,2));
 console.log(`Baking and checking offline installations on ${builder}.`);
 let ready=false;
 for(let retry=0;retry<80;retry++){
  await new Promise(r=>setTimeout(r,15000));
  const response=JSON.parse(run(['ec2','get-console-output','--instance-id',builder,'--latest','--output','json']));
  const output=response.Output||'';
  if(output.includes('COURSE_IMAGE_FAILED')){await writeFile('labs/output/image-builder-failure.log',output);throw new Error('AMI bake failed; diagnostic saved in labs/output/image-builder-failure.log');}
  if(output.includes('COURSE_IMAGE_READY')){ready=true;break;}
 }
 if(!ready)throw new Error('Image builder did not finish within 20 minutes');
 console.log('Offline installation tests passed. Creating the preloaded image.');
 const image=run(['ec2','create-image','--instance-id',builder,'--name',`linux-course-offline-${Date.now()}`,'--description',`Debian 12 offline course; pack SHA256 ${digest}`,'--query','ImageId','--output','text']);
 // Save the ID before waiting, so an interrupted build remains recoverable.
 const record={imageId:image,baseImageId:base.ImageId,packKey:key,packSha256:digest,region,verifiedOffline:true,createdAt:new Date().toISOString()};
 await writeFile('docs/lab-image.json',JSON.stringify(record,null,2)+'\n');
 run(['ec2','wait','image-available','--image-ids',image]);console.log(`Preloaded image available: ${image}`);
}finally{
 await rm(temp,{force:true});
 if(created){console.log('Removing the temporary image-builder instance and its network.');run(['cloudformation','delete-stack','--stack-name','linux-lab-image-builder']);run(['cloudformation','wait','stack-delete-complete','--stack-name','linux-lab-image-builder']);}
}
