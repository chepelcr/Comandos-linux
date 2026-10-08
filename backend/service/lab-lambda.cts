import serverless from 'serverless-http';
import { ExpressAppConfig } from './src/config/ExpressAppConfig';
import { reapLabs } from './src/labs/AwsLab';
const http=serverless(new ExpressAppConfig().getApp());
export const handler=async(event:any,context:any)=>event.source==='aws.events'?reapLabs():http(event,context);
