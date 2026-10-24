import {createHmac,timingSafeEqual} from 'node:crypto';
const fixedGateway='https://gateway.example.invalid';
export function createProxy({project,task,env=process.env,fetchImpl=fetch}){return async(req,res)=>{
 res.setHeader('Cache-Control','no-store');const error=(code,n=503)=>res.status(n).json({status:'error',error:{code,message:'Live AI is not configured or this request is not authorized. No simulated output substituted.'}});
 if(req.method!=='POST')return error('INVALID_INPUT',405);
 if(env.AI_GATEWAY_URL!==fixedGateway||!env.AI_GATEWAY_SECRET||!env.AI_SESSION_SECRET)return error('NOT_CONFIGURED');
 try{
  const b=req.body||{};if(b.task!==task||JSON.stringify(b).length>15000)return error('INVALID_INPUT',400);
  const token=String(b.session_token||'');const [payload,signature]=token.split('.');if(!payload||!signature)return error('UNAUTHORIZED',401);
  const expected=createHmac('sha256',env.AI_GATEWAY_SECRET).update('session.'+payload).digest('hex');if(signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return error('UNAUTHORIZED',401);
  const session=JSON.parse(Buffer.from(payload,'base64url').toString());if(session.project!==project||typeof session.sid!=='string'||!Number.isFinite(session.exp)||session.exp<=Date.now())return error('UNAUTHORIZED',401);
  const body=JSON.stringify({task,request_id:b.request_id,input:b.input,session_token:token});const timestamp=String(Date.now());const sig=createHmac('sha256',env.AI_GATEWAY_SECRET).update('request.'+timestamp+'.'+body).digest('hex');
  const r=await fetchImpl(fixedGateway+'/api/ai',{method:'POST',headers:{'Content-Type':'application/json','x-demo-project':project,'x-demo-timestamp':timestamp,'x-demo-signature':sig},body,signal:AbortSignal.timeout(60000)});const value=await r.json();return res.status(r.status).json(value);
 }catch{return error('PROVIDER_ERROR')}
}}
