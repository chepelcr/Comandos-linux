import { readFile } from 'node:fs/promises';
import { randomBytes,randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { CognitoIdentityProviderClient,AdminCreateUserCommand,AdminSetUserPasswordCommand,AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { S3Client,DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Amplify } from 'aws-amplify';
import { signIn,fetchAuthSession,signOut } from 'aws-amplify/auth';
const state=JSON.parse(await readFile(new URL('../../../docs/deployment-state.json',import.meta.url),'utf8'));
const username=`smoke-${randomUUID()}@lab.invalid`,password=`Lab-Aa9!${randomBytes(24).toString('base64url')}`;
const cognito=new CognitoIdentityProviderClient({region:state.region}),s3=new S3Client({region:state.region});let sub,created=false;
try{
 const result=await cognito.send(new AdminCreateUserCommand({UserPoolId:state.UserPoolId,Username:username,MessageAction:'SUPPRESS',UserAttributes:[{Name:'email',Value:username},{Name:'email_verified',Value:'true'}]}));created=true;sub=result.User.Attributes.find(attribute=>attribute.Name==='sub').Value;
 await cognito.send(new AdminSetUserPasswordCommand({UserPoolId:state.UserPoolId,Username:username,Password:password,Permanent:true}));
 Amplify.configure({Auth:{Cognito:{userPoolId:state.UserPoolId,userPoolClientId:state.ClientId}}});
 assert.equal((await signIn({username,password})).isSignedIn,true);
 const session=await fetchAuthSession(),token=session.tokens.accessToken.toString();
 const call=async(method,body,auth=token)=>fetch(`${state.ApiUrl}/me`,{method,headers:{Authorization:`Bearer ${auth}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const input={completed:['intro'],exercises:[],bookmarks:[],lastLesson:'intro',epoch:0,preferences:{language:'es',theme:'dark'}};
 const saved=await call('POST',input);assert.equal(saved.status,200,await saved.clone().text());const snapshot=await saved.json();assert.equal(snapshot.userId,sub);assert.equal(snapshot.points,10);
 const restored=await call('GET');assert.deepEqual((await restored.json()).preferences,input.preferences);
 assert.equal((await call('POST',{...input,userId:'another-user'})).status,400);
 const forged=token.slice(0,-8)+'aaaaaaaa';assert.equal((await call('GET',undefined,forged)).status,401);
 const reset=await call('DELETE');assert.equal((await reset.json()).epoch,1);
 assert.equal((await call('POST',input)).status,409);
 console.log('Real Cognito/Amplify sign-in → JWT authorizer → S3 save/reload/reset passed. Forged tokens and caller-controlled account IDs were rejected. No emails were sent.');
}finally{
 await signOut().catch(()=>{});
 if(created)await cognito.send(new AdminDeleteUserCommand({UserPoolId:state.UserPoolId,Username:username}));
 if(sub)await s3.send(new DeleteObjectCommand({Bucket:state.ProgressBucketName,Key:`progress/${encodeURIComponent(sub)}.json`}));
 console.log('Removed the temporary test account and its progress.');
}
