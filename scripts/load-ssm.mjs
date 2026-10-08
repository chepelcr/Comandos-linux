import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';
import { writeFile } from 'node:fs/promises';
const required=['VITE_AWS_REGION','VITE_COGNITO_USER_POOL_ID','VITE_COGNITO_CLIENT_ID','VITE_COGNITO_DOMAIN','VITE_AUTH_REDIRECT_URI','VITE_AUTH_LOGOUT_URI','VITE_API_BASE_URL','VITE_APP_URL','VITE_BASE_PATH','VITE_DEFAULT_LOCALE'];
// Older deployments remain buildable until the independent services are deployed.
const optional=['VITE_SUPPORT_API_BASE_URL','VITE_COURSES_API_BASE_URL','VITE_COURSES_IDENTITY_POOL_ID','COURSES_CI_API_BASE_URL'];
const keys=[...required,...optional],prefix=process.env.SSM_FRONTEND_PREFIX || '/linux-lab/prod/frontend';
const client=new SSMClient({region:process.env.AWS_REGION||'us-east-1'});
const parameters=[];
for(let offset=0;offset<keys.length;offset+=10){
 const result=await client.send(new GetParametersCommand({Names:keys.slice(offset,offset+10).map(key=>`${prefix}/${key}`),WithDecryption:false}));
 parameters.push(...result.Parameters||[]);
}
const values=Object.fromEntries(parameters.map(p=>[p.Name.split('/').at(-1),p.Value]));
for(const key of required)if(!values[key] || /[\r\n]/.test(values[key]))throw new Error(`Required public config is missing or invalid: ${key}`);
for(const key of optional)if(values[key] && /[\r\n]/.test(values[key]))throw new Error(`Invalid public config: ${key}`);
for(const key of ['VITE_COGNITO_DOMAIN','VITE_AUTH_REDIRECT_URI','VITE_AUTH_LOGOUT_URI','VITE_API_BASE_URL','VITE_APP_URL','VITE_SUPPORT_API_BASE_URL','VITE_COURSES_API_BASE_URL','COURSES_CI_API_BASE_URL'])if(values[key]&&new URL(values[key]).protocol!=='https:')throw new Error(`${key} must use HTTPS`);
if(Boolean(values.VITE_COURSES_API_BASE_URL)!==Boolean(values.VITE_COURSES_IDENTITY_POOL_ID))throw new Error('Published curriculum requires both API and guest identity pool');
if(!['es','en'].includes(values.VITE_DEFAULT_LOCALE))throw new Error('Invalid locale');
await writeFile('.env.production.local',keys.filter(key=>values[key]).map(key=>`${key}=${JSON.stringify(values[key])}`).join('\n')+'\n',{mode:0o600});
console.log(`Loaded ${parameters.length} public frontend settings. No credentials are bundled.`);
