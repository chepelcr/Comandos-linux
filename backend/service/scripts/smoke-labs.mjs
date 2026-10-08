import { readFile } from 'node:fs/promises';
import { randomUUID,createHash } from 'node:crypto';
import { CognitoIdentityProviderClient,AdminCreateUserCommand,AdminSetUserPasswordCommand,AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { EC2Client,DescribeInstancesCommand,DescribeRouteTablesCommand,DescribeSecurityGroupsCommand,DescribeVolumesCommand,TerminateInstancesCommand } from '@aws-sdk/client-ec2';
import { S3Client,DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Amplify } from 'aws-amplify';
import { signIn,fetchAuthSession,signOut } from 'aws-amplify/auth';
import { connectTerminal } from '../../../src/services/ssm-terminal.ts';
const state=JSON.parse(await readFile('docs/deployment-state.json','utf8'));
if(!state.LabFunction)throw new Error('Deploy the lab backend first');
const region=state.region,cognito=new CognitoIdentityProviderClient({region}),ec2=new EC2Client({region}),s3=new S3Client({region});
const email=`lab-smoke-${randomUUID()}@lab.invalid`,password=`L!nux-${randomUUID()}Aa9`,sleep=ms=>new Promise(r=>setTimeout(r,ms));
let owner,token,channel,instanceId,volumeId,labId;
async function api(path='',method='GET',body){const r=await fetch(`${state.ApiUrl}/labs${path}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:r.status===204?null:await r.json()};}
try{
 const created=await cognito.send(new AdminCreateUserCommand({UserPoolId:state.UserPoolId,Username:email,MessageAction:'SUPPRESS',UserAttributes:[{Name:'email',Value:email},{Name:'email_verified',Value:'true'}]}));owner=created.User?.Attributes?.find(a=>a.Name==='sub')?.Value;
 await cognito.send(new AdminSetUserPasswordCommand({UserPoolId:state.UserPoolId,Username:email,Password:password,Permanent:true}));
 Amplify.configure({Auth:{Cognito:{userPoolId:state.UserPoolId,userPoolClientId:state.ClientId}}});await signIn({username:email,password});token=(await fetchAuthSession()).tokens.accessToken.toString();
 const start=await api('','POST',{route:'foundations'});if(start.status!==201)throw new Error(`Start failed: ${JSON.stringify(start)}`);
 const lab=start.body.session;labId=lab.id;console.log('PASS authenticated EC2 start');
 const blocked=await api('','POST',{route:'modern'});if(blocked.status!==409)throw new Error('A second path was allowed');console.log('PASS account-wide exclusivity across learning paths');
 const instances=await ec2.send(new DescribeInstancesCommand({Filters:[{Name:'tag:LabId',Values:[lab.id]}]}));const instance=instances.Reservations.flatMap(r=>r.Instances)[0];instanceId=instance.InstanceId;volumeId=instance.BlockDeviceMappings?.[0]?.Ebs?.VolumeId;
 if(instance.PublicIpAddress||instance.VpcId!==state.LabVpc||instance.MetadataOptions.HttpTokens!=='required')throw new Error('Instance isolation configuration failed');
 const routes=await ec2.send(new DescribeRouteTablesCommand({Filters:[{Name:'vpc-id',Values:[state.LabVpc]}]}));if(routes.RouteTables.some(table=>table.Routes.some(route=>route.DestinationCidrBlock==='0.0.0.0/0'||route.GatewayId?.startsWith('igw-')||route.NatGatewayId||route.VpcPeeringConnectionId)))throw new Error('Unexpected internet/account route');
 const groups=await ec2.send(new DescribeSecurityGroupsCommand({GroupIds:[state.LabSecurityGroup]}));if(groups.SecurityGroups[0].IpPermissions.length)throw new Error('Unexpected inbound lab access');console.log('PASS no public IP, no internet/peering route, no inbound SG, IMDSv2');
 let opened;
 for(let i=0;i<40;i++){opened=await api('/connect','POST');if(opened.status===200)break;if(![425,429,503].includes(opened.status))throw new Error(`Connect failed: ${JSON.stringify(opened)}`);await sleep(3000);}
 if(opened.status!==200)throw new Error('SSM agent never connected');
 let output='';const marker=`LAB_OK_${randomUUID().replaceAll('-','')}`;
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(new Error('Terminal handshake/output timed out')),90000);
  channel=connectTerminal(opened.body,{region,debug:event=>console.log('terminal:',event),ready:()=>{console.log('terminal: ready');channel.input(`whoami; uname -m; mkdir -p ~/practice; uname -a > ~/practice/system.txt; sudo apt update >/dev/null && sudo apt install -y nodejs >/dev/null && node --version && cd ~/linux-lab-notes && npm ci --offline --cache /opt/course/npm-cache --no-audit --no-fund >/dev/null && npm test && npm run build && echo ${marker}\r`);},output:data=>{const text=new TextDecoder().decode(data);output+=text;console.log('shell:',text);if(output.includes(`\r\n${marker}\r\n`)){clearTimeout(timeout);resolve();}},closed:()=>{clearTimeout(timeout);reject(new Error('Terminal closed before completing the offline smoke'));}});
 });
 if(!output.includes('student')||!output.includes('x86_64')||!output.includes('v24.'))throw new Error('Expected native student Linux/Node output missing');console.log('PASS actual browser-protocol shell, Node install, offline npm, API tests and React production build');
 const check=await api('/check','POST',{lesson:'intro'});if(check.status!==202)throw new Error(`Check start failed: ${JSON.stringify(check)}`);
 let result;for(let i=0;i<20;i++){await sleep(1500);result=await api(`/check/${check.body.command}`);if(!result.body.pending)break;}
 if(result.body.verified!==true)throw new Error(`Exercise verification failed: ${JSON.stringify(result)}`);console.log('PASS observable exercise validation via SSM');
 const stopped=await api('','DELETE');if(stopped.body?.session)throw new Error('End did not confirm termination');console.log('PASS authenticated End (the same operation awaited before logout)');
 for(let i=0;i<30;i++){const response=await ec2.send(new DescribeInstancesCommand({InstanceIds:[instanceId]}));if(response.Reservations[0].Instances[0].State.Name==='terminated')break;await sleep(2000);}
 const final=await ec2.send(new DescribeInstancesCommand({InstanceIds:[instanceId]}));if(final.Reservations[0].Instances[0].State.Name!=='terminated')throw new Error('Instance still exists after End');
 if(volumeId){const volumes=await ec2.send(new DescribeVolumesCommand({Filters:[{Name:'volume-id',Values:[volumeId]}]}));if(volumes.Volumes.length)throw new Error('Root volume was not deleted');}console.log('PASS instance terminated and root volume deleted');
}finally{
 channel?.close();if(token)await api('','DELETE').catch(()=>{});
 if(labId){const own=await ec2.send(new DescribeInstancesCommand({Filters:[{Name:'tag:LabId',Values:[labId]},{Name:'tag:Application',Values:['linux-course-lab']},{Name:'instance-state-name',Values:['pending','running','stopping','stopped']}]}));const ids=own.Reservations.flatMap(r=>r.Instances).map(i=>i.InstanceId);if(ids.length)await ec2.send(new TerminateInstancesCommand({InstanceIds:ids}));}
 await signOut().catch(()=>{});
 if(owner)await s3.send(new DeleteObjectCommand({Bucket:state.LabSessionsBucket,Key:`sessions/${createHash('sha256').update(owner).digest('hex')}.json`})).catch(()=>{});
 await cognito.send(new AdminDeleteUserCommand({UserPoolId:state.UserPoolId,Username:email})).catch(()=>{});
}
