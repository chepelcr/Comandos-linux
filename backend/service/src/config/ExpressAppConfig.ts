import express,{type Express,type NextFunction,type Request,type Response} from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { setupRoutes } from '../routes';
import { HttpError } from '../utils/HttpError';
import { APP_CONFIG } from './app';
export class ExpressAppConfig {
 private readonly app:Express;
 constructor(){this.app=express();this.app.disable('x-powered-by');this.app.use(cors({origin:APP_CONFIG.ALLOWED_ORIGINS,methods:['GET','POST','DELETE','OPTIONS'],allowedHeaders:['authorization','content-type']}));this.app.use(express.json({limit:'20kb'}));
 this.app.use((req,res,next)=>{res.set('Cache-Control','no-store');const claims=(req as Request & {apiGateway?:{event?:{requestContext?:{authorizer?:{jwt?:{claims?:{sub?:string;token_use?:string}}}}}}}).apiGateway?.event?.requestContext?.authorizer?.jwt?.claims;
 // Ownership comes exclusively from API Gateway's verified JWT, never a path/header/body field.
 if(!claims?.sub||claims.token_use!=='access'){res.status(401).json({error:'Unauthorized'});return;}res.locals.userId=claims.sub;next();});
 setupRoutes(this.app);this.app.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{const status=error instanceof ZodError?400:error instanceof HttpError?error.status:500;if(status===500){const fault=error as {name?:string;$metadata?:{httpStatusCode?:number;requestId?:string}};console.error('progress-error',{name:fault.name,status:fault.$metadata?.httpStatusCode,requestId:fault.$metadata?.requestId});}res.status(status).json({error:status===500?'Operation failed. Please retry.':error instanceof Error?error.message:'Invalid request'});});}
 getApp(){return this.app;}
}
