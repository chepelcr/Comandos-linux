import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const config=JSON.parse(await readFile('docs/deployment-state.json','utf8'));
const repo='chepelcr/Comandos-linux';
const gh=(args,input)=>{const result=spawnSync('gh',args,{encoding:'utf8',...(input?{input:JSON.stringify(input)}:{})});if(result.status!==0)throw Error(result.stderr);return result.stdout;};
for(const environment of ['github-pages','backend-production']){
 gh(['api','--method','PUT',`repos/${repo}/environments/${environment}`,'--input','-'],{deployment_branch_policy:{protected_branches:false,custom_branch_policies:true}});
 const path=`repos/${repo}/environments/${environment}/deployment-branch-policies`;
 const policies=JSON.parse(gh(['api',path])).branch_policies;
 if(!policies.some(policy=>policy.name==='main'&&policy.type==='branch'))gh(['api','--method','POST',path,'--input','-'],{name:'main',type:'branch'});
}
for(const [environment,values] of Object.entries({'github-pages':{AWS_PAGES_ROLE_ARN:config.RoleArn},'backend-production':{AWS_BACKEND_ROLE_ARN:config.BackendRoleArn,AWS_ARTIFACT_BUCKET:config.ArtifactBucket,AWS_PROGRESS_FUNCTION:config.ProgressFunction,...(config.LabFunction?{AWS_LAB_FUNCTION:config.LabFunction}:{})}})){
 for(const [name,value] of Object.entries(values))gh(['variable','set',name,'--repo',repo,'--env',environment,'--body',value]);
}
console.log('Configured public deployment metadata and main-only GitHub environments. Pages source is unchanged until deployment is requested.');
