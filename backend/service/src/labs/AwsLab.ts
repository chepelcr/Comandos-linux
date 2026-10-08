import { S3Client,GetObjectCommand,PutObjectCommand } from '@aws-sdk/client-s3';
import { EC2Client,RunInstancesCommand,DescribeInstancesCommand,TerminateInstancesCommand } from '@aws-sdk/client-ec2';
import { SSMClient,DescribeSessionsCommand,TerminateSessionCommand,StartSessionCommand,SendCommandCommand,GetCommandInvocationCommand } from '@aws-sdk/client-ssm';
import { SchedulerClient,CreateScheduleCommand,DeleteScheduleCommand } from '@aws-sdk/client-scheduler';
import { createHash } from 'node:crypto';
import { LabLifecycle,type Lab,type LabStore,expired } from './LabLifecycle';
import { FleetSlots } from './FleetSlots';
import { HttpError } from '../utils/HttpError';
const s3=new S3Client({}),ec2=new EC2Client({}),ssm=new SSMClient({}),scheduler=new SchedulerClient({});
const bucket=()=>process.env.LAB_BUCKET!;
const ownerKey=(owner:string)=>createHash('sha256').update(owner).digest('hex');
const key=(owner:string)=>`sessions/${ownerKey(owner)}.json`;
export const labStore:LabStore={
 async read(owner){try{const value=await s3.send(new GetObjectCommand({Bucket:bucket(),Key:key(owner)}));return {lab:JSON.parse(await value.Body!.transformToString()) as Lab,version:value.ETag};}catch(error){if((error as {$metadata?:{httpStatusCode?:number}}).$metadata?.httpStatusCode===404)return {lab:null};throw error;}},
 async write(lab,version){try{await s3.send(new PutObjectCommand({Bucket:bucket(),Key:key(lab.owner),Body:JSON.stringify(lab),ContentType:'application/json',CacheControl:'no-store',ServerSideEncryption:'AES256',Tagging:`state=${lab.state==='ended'?'ended':'active'}`,...(version?{IfMatch:version}:{IfNoneMatch:'*'})}));return true;}catch(error){if([409,412].includes((error as {$metadata?:{httpStatusCode?:number}}).$metadata?.httpStatusCode||0))return false;throw error;}}
};
const fleetSlots=new FleetSlots({
 async read(slot){try{const value=await s3.send(new GetObjectCommand({Bucket:bucket(),Key:`fleet/${slot}.json`}));return {lab:JSON.parse(await value.Body!.transformToString()).lab as Lab|null,version:value.ETag};}catch(error){if((error as {$metadata?:{httpStatusCode?:number}}).$metadata?.httpStatusCode===404)return {lab:null};throw error;}},
 async write(slot,lab,version){try{await s3.send(new PutObjectCommand({Bucket:bucket(),Key:`fleet/${slot}.json`,Body:JSON.stringify({lab}),ContentType:'application/json',ServerSideEncryption:'AES256',...(version?{IfMatch:version}:{IfNoneMatch:'*'})}));return true;}catch(error){if([409,412].includes((error as {$metadata?:{httpStatusCode?:number}}).$metadata?.httpStatusCode||0))return false;throw error;}}
});
async function instances(lab:Lab){const result=await ec2.send(new DescribeInstancesCommand({Filters:[{Name:'tag:Application',Values:['linux-course-lab']},{Name:'tag:LabId',Values:[lab.id]},{Name:'instance-state-name',Values:['pending','running','stopping','stopped','shutting-down']}]}));return result.Reservations?.flatMap(r=>r.Instances||[])||[];}
async function endChannels(instanceId:string){
 let NextToken:string|undefined;
 do{const page=await ssm.send(new DescribeSessionsCommand({State:'Active',Filters:[{key:'Target',value:instanceId}],NextToken}));for(const session of page.Sessions||[])if(session.SessionId)await ssm.send(new TerminateSessionCommand({SessionId:session.SessionId}));NextToken=page.NextToken;}while(NextToken);
}
export const labLifecycle=new LabLifecycle(labStore,{
 async launch(lab){
  if(!process.env.LAB_AMI)throw new HttpError(503,'The preloaded lab image is not configured yet.');
  await fleetSlots.claim(lab);
  const result=await ec2.send(new RunInstancesCommand({ImageId:process.env.LAB_AMI,InstanceType:'t3.small',MinCount:1,MaxCount:1,ClientToken:lab.id,IamInstanceProfile:{Name:process.env.LAB_INSTANCE_PROFILE},NetworkInterfaces:[{DeviceIndex:0,SubnetId:process.env.LAB_SUBNET,Groups:[process.env.LAB_SECURITY_GROUP!],AssociatePublicIpAddress:false,DeleteOnTermination:true}],MetadataOptions:{HttpTokens:'required',HttpPutResponseHopLimit:1,InstanceMetadataTags:'disabled'},InstanceInitiatedShutdownBehavior:'terminate',CreditSpecification:{CpuCredits:'standard'},BlockDeviceMappings:[{DeviceName:'/dev/xvda',Ebs:{VolumeSize:24,VolumeType:'gp3',Encrypted:true,DeleteOnTermination:true}}],TagSpecifications:[{ResourceType:'instance',Tags:[{Key:'Name',Value:'linux-course-temporary-lab'},{Key:'Application',Value:'linux-course-lab'},{Key:'LabId',Value:lab.id},{Key:'OwnerHash',Value:ownerKey(lab.owner)},{Key:'StartedAt',Value:String(lab.startedAt)},{Key:'ExpiresAt',Value:String(lab.startedAt+90*60000)}]},{ResourceType:'volume',Tags:[{Key:'Application',Value:'linux-course-lab'},{Key:'LabId',Value:lab.id}]}]}));
  const id=result.Instances?.[0].InstanceId;if(!id)throw new Error('No lab instance returned');
  try{await scheduler.send(new CreateScheduleCommand({Name:lab.id,GroupName:process.env.LAB_SCHEDULE_GROUP,ScheduleExpression:`at(${new Date(lab.startedAt+90*60000).toISOString().slice(0,19)})`,ScheduleExpressionTimezone:'UTC',FlexibleTimeWindow:{Mode:'OFF'},ActionAfterCompletion:'DELETE',Target:{Arn:'arn:aws:scheduler:::aws-sdk:ec2:terminateInstances',RoleArn:process.env.LAB_DEADLINE_ROLE,Input:JSON.stringify({InstanceIds:[id]}),RetryPolicy:{MaximumEventAgeInSeconds:300,MaximumRetryAttempts:5}}}));}catch(error){await ec2.send(new TerminateInstancesCommand({InstanceIds:[id]}));throw error;}
  return id;
 },
 async terminate(lab){
  const found=await instances(lab);const ids=found.flatMap(i=>i.InstanceId?[i.InstanceId]:[]);
  for(const id of ids)await endChannels(id);
  if(ids.length){await ec2.send(new TerminateInstancesCommand({InstanceIds:ids}));try{await scheduler.send(new DeleteScheduleCommand({Name:lab.id,GroupName:process.env.LAB_SCHEDULE_GROUP}));}catch(error){if((error as {name?:string}).name!=='ResourceNotFoundException')throw error;}return true;}
  // Don't unlock a RunInstances request that is still in flight / not yet visible.
  return Boolean(lab.instanceId)||Date.now()-lab.startedAt>60_000;
 }
});
export const labsConfigured=()=>Boolean(process.env.LAB_BUCKET&&process.env.LAB_AMI);
export async function openChannel(owner:string){
 const lab=await labLifecycle.get(owner);
 if(!lab||lab.state!=='running'||!lab.instanceId)throw new HttpError(409,'Start a lab first.');
 if(expired(lab,Date.now())){await labLifecycle.end(owner);throw new HttpError(410,'Lab expired.');}
 // Reconnecting takes over the terminal rather than creating another live shell.
 await endChannels(lab.instanceId);
 try{
  const channel=await ssm.send(new StartSessionCommand({Target:lab.instanceId,DocumentName:process.env.LAB_SESSION_DOCUMENT}));
  const after=await labLifecycle.get(owner);
  if(after?.id!==lab.id||after.state!=='running'){
   if(channel.SessionId)await ssm.send(new TerminateSessionCommand({SessionId:channel.SessionId}));
   throw new HttpError(409,'Lab has ended.');
  }
  return {streamUrl:channel.StreamUrl,token:channel.TokenValue,sessionId:channel.SessionId};
 }catch(error){if((error as {name?:string}).name==='TargetNotConnected')throw new HttpError(425,'The lab is still booting. Try connecting shortly.');throw error;}
}
export async function reapLabs(){
 // Scan the bounded EC2 fleet, not every student's historical S3 tombstone.
 let NextToken:string|undefined;
 do{
  const page=await ec2.send(new DescribeInstancesCommand({Filters:[{Name:'tag:Application',Values:['linux-course-lab']},{Name:'instance-state-name',Values:['pending','running','stopped','stopping']}],NextToken}));
  for(const instance of page.Reservations?.flatMap(r=>r.Instances||[])||[]){
   const tags=Object.fromEntries((instance.Tags||[]).map(t=>[t.Key,t.Value]));
   if(!instance.InstanceId||!tags.OwnerHash||!/^[a-f0-9]{64}$/.test(tags.OwnerHash))continue;
   let lab:Lab|null=null;
   try{const object=await s3.send(new GetObjectCommand({Bucket:bucket(),Key:`sessions/${tags.OwnerHash}.json`}));lab=JSON.parse(await object.Body!.transformToString()) as Lab;}catch(error){if((error as {$metadata?:{httpStatusCode?:number}}).$metadata?.httpStatusCode!==404)throw error;}
   if(!lab||lab.id!==tags.LabId||lab.state==='ended'||Number(tags.ExpiresAt)<=Date.now()){
    await endChannels(instance.InstanceId);await ec2.send(new TerminateInstancesCommand({InstanceIds:[instance.InstanceId]}));
   }else if(lab.state==='starting'&&Date.now()-lab.startedAt>60_000){await labLifecycle.end(lab.owner);}
   else await labLifecycle.reap(lab.owner);
  }
  NextToken=page.NextToken;
 }while(NextToken);
 // Keep slots while EC2 is terminating or a launch request may still be in flight.
 // Lambda's bounded request duration is well below this three-minute grace period.
 await fleetSlots.reap(async lab=>{
  if(Date.now()-lab.startedAt<180_000||(await instances(lab)).length)return false;
  const current=await labLifecycle.get(lab.owner);
  if(current?.id===lab.id&&current.state!=='ended')await labLifecycle.end(lab.owner);
  return true;
 });
}

export async function checkExercise(owner:string,lesson:string){
 const lab=await labLifecycle.get(owner);
 if(!lab||lab.state!=='running'||!lab.instanceId||expired(lab,Date.now()))throw new HttpError(409,'No active lab.');
 const response=await ssm.send(new SendCommandCommand({InstanceIds:[lab.instanceId],DocumentName:process.env.LAB_CHECK_DOCUMENT,Parameters:{lesson:[lesson]},TimeoutSeconds:30}));
 return response.Command?.CommandId;
}
export async function checkResult(owner:string,command:string){
 const lab=await labLifecycle.get(owner);
 if(!lab||lab.state!=='running'||!lab.instanceId)throw new HttpError(409,'No active lab.');
 try{const result=await ssm.send(new GetCommandInvocationCommand({CommandId:command,InstanceId:lab.instanceId}));
  if(result.DocumentName!==process.env.LAB_CHECK_DOCUMENT)throw new HttpError(400,'Invalid exercise check.');
  if(['Pending','InProgress','Delayed'].includes(result.Status||''))return {pending:true};
  if(result.Status!=='Success')return {pending:false,verified:false};
  const output=JSON.parse(result.StandardOutputContent||'{}');return {pending:false,lesson:output.lesson,verified:output.verified===true};
 }catch(error){if((error as {name?:string}).name==='InvocationDoesNotExist')return {pending:true};throw error;}
}
