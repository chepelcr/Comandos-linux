import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { ProgressRecord } from '../models/ProgressSchema';
export interface ProgressStore {get(userId:string):Promise<ProgressRecord|undefined>;put(next:ProgressRecord,previous?:ProgressRecord):Promise<boolean>;delete(userId:string):Promise<void>}
export class ProgressRepository implements ProgressStore {
 private readonly client=new S3Client({});
 // ETags belong to the exact snapshot, so overlapping requests cannot mix them.
 private readonly etags=new WeakMap<ProgressRecord,string>();
 private get bucket(){if(!process.env.PROGRESS_BUCKET)throw new Error('PROGRESS_BUCKET is required');return process.env.PROGRESS_BUCKET;}
 private key(userId:string){return `progress/${encodeURIComponent(userId)}.json`;}
 async get(userId:string){
  try{
   const response=await this.client.send(new GetObjectCommand({Bucket:this.bucket,Key:this.key(userId)}));
   if(!response.Body||!response.ETag)throw new Error('Incomplete progress snapshot');
   const record=JSON.parse(await response.Body.transformToString()) as ProgressRecord;
   if(record.userId!==userId)throw new Error('Invalid progress owner');
   this.etags.set(record,response.ETag);return record;
  }catch(error){if((error as { $metadata?:{httpStatusCode:number} }).$metadata?.httpStatusCode===404)return undefined;throw error;}
 }
 async put(next:ProgressRecord,previous?:ProgressRecord){
  const etag=previous?this.etags.get(previous):undefined;
  if(previous&&!etag)throw new Error('Progress snapshot must be read before updating');
  try{await this.client.send(new PutObjectCommand({Bucket:this.bucket,Key:this.key(next.userId),Body:JSON.stringify(next),ContentType:'application/json',CacheControl:'no-store',ServerSideEncryption:'AES256',...(previous?{IfMatch:etag}:{IfNoneMatch:'*'})}));return true;}
  catch(error){const status=(error as {$metadata?:{httpStatusCode:number}}).$metadata?.httpStatusCode;if(status===412||status===409||(previous&&status===404))return false;throw error;}
 }
 async delete(userId:string){await this.client.send(new DeleteObjectCommand({Bucket:this.bucket,Key:this.key(userId)}));}
}
