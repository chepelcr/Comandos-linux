import { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import lessons from '../data/lessons.json';
import courses from '../data/courses.json';
import { labLifecycle,labsConfigured,openChannel,checkExercise,checkResult } from './AwsLab';
import { MAX_MS,IDLE_MS,type Lab } from './LabLifecycle';
import { HttpError } from '../utils/HttpError';
export const labRouter=Router();
const handle=(fn:RequestHandler):RequestHandler=>(req,res,next)=>{Promise.resolve(fn(req,res,next)).catch(next);};
const view=(lab:Lab|null)=>lab&&lab.state!=='ended'?{id:lab.id,route:lab.route,state:lab.state,startedAt:lab.startedAt,lastInputAt:lab.lastInputAt,expiresAt:lab.startedAt+MAX_MS,idleExpiresAt:lab.lastInputAt+IDLE_MS}:null;
labRouter.get('/',handle(async(_req,res)=>{if(!labsConfigured()){res.json({available:false,session:null});return;}await labLifecycle.reap(res.locals.userId);res.json({available:true,session:view(await labLifecycle.get(res.locals.userId))});}));
labRouter.post('/',handle(async(req,res)=>{
 if(!labsConfigured())throw new HttpError(503,'The preloaded lab image is not ready.');
 const {route}=z.object({route:z.string().refine(id=>courses.some(c=>c.id===id&&c.practice==='linux'))}).strict().parse(req.body);
 res.status(201).json({session:view(await labLifecycle.start(res.locals.userId,route))});
}));
labRouter.delete('/',handle(async(_req,res)=>{
 if(!labsConfigured()){res.status(204).end();return;}
 const session=view(await labLifecycle.end(res.locals.userId));res.status(session?202:200).json({session});
}));
labRouter.post('/activity',handle(async(req,res)=>{const {id}=z.object({id:z.string().uuid()}).strict().parse(req.body);await labLifecycle.activity(res.locals.userId,id);res.status(204).end();}));
labRouter.post('/connect',handle(async(_req,res)=>{res.json(await openChannel(res.locals.userId));}));

labRouter.post('/check',handle(async(req,res)=>{
 const {lesson}=z.object({lesson:z.string()}).strict().parse(req.body);
 const lab=await labLifecycle.get(res.locals.userId);
 if(!lessons.some(l=>l.id===lesson&&l.course===lab?.route))throw new HttpError(400,'Exercise is outside your active learning path.');
 res.status(202).json({command:await checkExercise(res.locals.userId,lesson)});
}));
labRouter.get('/check/:command',handle(async(req,res)=>{const command=z.string().uuid().parse(req.params.command);res.json(await checkResult(res.locals.userId,command));}));
