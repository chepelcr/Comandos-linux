import serverless from 'serverless-http';
import { ExpressAppConfig } from './src/config/ExpressAppConfig';
const expressHandler=serverless(new ExpressAppConfig().getApp());
export const handler=async(event:any,context:any)=>expressHandler(event,context);
