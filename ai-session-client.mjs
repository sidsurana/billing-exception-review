let active,pending;
export async function getSessionToken({fetchImpl=fetch,now=Date.now}={}){
 if(active&&active.expires_at>now()+30000)return active.session_token;
 if(pending)return pending;
 pending=(async()=>{
  const response=await fetchImpl('/api/ai-session',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  const value=await response.json();
  if(!response.ok||value.status!=='completed'||typeof value.session_token!=='string'||!Number.isFinite(value.expires_at)){const e=new Error('AI session unavailable');e.code=value.error?.code||'UNAUTHORIZED';throw e}
  active=value;return value.session_token;
 })();try{return await pending}finally{pending=undefined}
}
// Compatibility seam requested by the nine CoS consumers; no persistent storage.
if(typeof window!=='undefined')window.CoSAISession={getToken:getSessionToken};
