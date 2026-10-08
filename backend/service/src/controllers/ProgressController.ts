import { Router,type NextFunction,type Request,type Response } from 'express';
import { CognitoIdentityProviderClient,DeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { ProgressService } from '../services/ProgressService';
export class ProgressController {
 constructor(private readonly service:ProgressService){}
 getRouter(){const router=Router();const run=(fn:(req:Request,res:Response)=>Promise<unknown>)=>(req:Request,res:Response,next:NextFunction)=>{void fn(req,res).catch(next);};
 router.get('/',run(async(_req,res)=>res.json(await this.service.get(res.locals.userId))));
 router.post('/',run(async(req,res)=>res.json(await this.service.sync(res.locals.userId,req.body))));
 router.delete('/',run(async(req,res)=>{if(req.body?.deleteAccount===true){const token=req.headers.authorization!.replace(/^Bearer /i,'');await new CognitoIdentityProviderClient({}).send(new DeleteUserCommand({AccessToken:token}));await this.service.delete(res.locals.userId);return res.status(204).end();}return res.json(await this.service.reset(res.locals.userId));}));return router;}
}
