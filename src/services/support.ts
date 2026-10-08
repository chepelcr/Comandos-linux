import { config } from '../app/config';
import { freshToken } from '../app/auth';
export type TicketMessage={id:string;authorRole:string;body:string;createdAt:string};
export type Ticket={id:string;subject:string;state:string;priority:string;revision:number;createdAt:string;updatedAt:string;messages:TicketMessage[];evidence?:{id:string;filename:string;verified:boolean}[]};
export type TicketDetail={ticket:Ticket;etag:string};
export class SupportError extends Error {constructor(public status:number){super(`Support request failed (${status})`);}}
export async function supportRequest<T>(path='',method='GET',body?:unknown,etag?:string,idempotencyKey?:string,signal?:AbortSignal):Promise<T>{
 if(!config.supportApi)throw new SupportError(503);
 const token=await freshToken();if(!token)throw new SupportError(401);
 const response=await fetch(`${config.supportApi}/api/support/tickets${path}`,{method,signal,headers:{Authorization:`Bearer ${token}`,...(body===undefined?{}:{'Content-Type':'application/json'}),...(etag?{'If-Match':etag}:{}),...(idempotencyKey?{'Idempotency-Key':idempotencyKey}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 if(!response.ok)throw new SupportError(response.status);
 return response.json();
}
