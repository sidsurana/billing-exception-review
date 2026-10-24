import {getSessionToken} from './ai-session-client.mjs';
export async function requestAI(task,input,{fetchImpl=fetch,requestId=crypto.randomUUID(),sessionToken}={}){
 if(sessionToken===undefined)sessionToken=await getSessionToken({fetchImpl});
 const response=await fetchImpl('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task,request_id:requestId,input,session_token:sessionToken})});
 const value=await response.json();if(!response.ok||value.status!=='completed'){const error=new Error(value.error?.message||'AI unavailable');error.code=value.error?.code||'PROVIDER_ERROR';throw error}return value;
}
