import {createHmac} from 'node:crypto';
import {isIP} from 'node:net';
export function createSessionProxy({project,env=process.env,now=Date.now}){return async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 const error=(code,status)=>res.status(status).json({status:'error',error:{code,message:'AI session unavailable.'}});
 if(req.method!=='POST')return error('INVALID_INPUT',405);
 if(env.VERCEL!=='1'||!env.AI_SESSION_SECRET||env.AI_SESSION_SECRET.length<32||!env.AI_GATEWAY_SECRET)return error('NOT_CONFIGURED',503);
 const ip=String(req.headers['x-vercel-forwarded-for']||'').trim();
 if(!isIP(ip))return error('UNAUTHORIZED',401);
 const site=req.headers['sec-fetch-site'];if(site&&site!=='same-origin')return error('UNAUTHORIZED',401);
 const origin=req.headers.origin;const host=req.headers.host;
 if(origin&&origin!=='https://'+host)return error('UNAUTHORIZED',401);
 if(req.body&&Object.keys(req.body).length)return error('INVALID_INPUT',400);
 // Only a keyed digest leaves this server. IP never reaches OpenAI or storage.
 // Identity is stable for this project/IP, including across token renewals.
 const sid=createHmac('sha256',env.AI_SESSION_SECRET).update(project+'.'+ip).digest('hex');
 const exp=now()+15*60*1000;
 const payload=Buffer.from(JSON.stringify({project,sid,exp})).toString('base64url');
 const signature=createHmac('sha256',env.AI_GATEWAY_SECRET).update('session.'+payload).digest('hex');
 return res.status(200).json({status:'completed',session_token:payload+'.'+signature,expires_at:exp});
}}
