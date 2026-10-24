/* Provider-neutral shared-gateway adapter. Construction makes no network requests.
   It is NOT enabled by default; no public session issuance or credentials exist here. */
(function(root){'use strict';
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
const bytes=v=>new TextEncoder().encode(v).length;
function createTransport(config,{requestAI,sessionToken='',requestId=()=>root.crypto.randomUUID(),fetchImpl=root.fetch}={}){
 return async function transport(req,{signal}={}){
  if(!config.gatewayTask||!config.gatewayProject||!requestAI||!sessionToken)fail('NOT_CONFIGURED','Shared gateway task registration and authenticated session configuration are pending.');
  if(typeof sessionToken!=='string'||sessionToken.length>2048)fail('UNAUTHORIZED','The authenticated session is invalid. No model call was made.');
  const source=root.CoSAI?root.CoSAI.canonical(req):JSON.stringify(req);const input={source};if(bytes(JSON.stringify(input))>12000)fail('INVALID_INPUT','The evidence snapshot exceeds the shared gateway input limit. Reduce the scenario before requesting AI.');
  const id=requestId();let value;try{value=await requestAI(config.gatewayTask,input,{requestId:id,sessionToken,fetchImpl:(url,init)=>fetchImpl(url,{...init,signal})});}catch(e){throw e;}
  if(!value||value.request_id!==id||value.status!=='completed'||value.mode!=='live'||!value.result||value.result.snapshotId!==req.snapshotId||!Array.isArray(value.result.sections))fail('INVALID_OUTPUT','The gateway response does not match this live request and snapshot.');
  // Server verification is required; mere local citation existence is not semantic proof.
  if(value.verification?.citations_verified!==true||value.verification?.actions_executed!==false)fail('INVALID_OUTPUT','Required gateway evidence verification is missing.');
  const result=value.result;if(Object.keys(result).some(k=>!['snapshotId','sections'].includes(k)))fail('INVALID_OUTPUT','Unexpected gateway result fields.');
  if(result.sections.length!==config.sections.length||result.sections.some(s=>!s||!Array.isArray(s.items)||s.items.length<1||s.items.length>2||s.items.some(i=>!i||typeof i.text!=='string'||!Array.isArray(i.evidenceIds)||!Array.isArray(i.quotes))))fail('INVALID_OUTPUT','Malformed role-specific gateway output.');
  const sections=result.sections.map(s=>({id:s.id,items:s.items.map(i=>({text:i.text,evidenceIds:i.evidenceIds,quotes:i.quotes}))}));
  return {contractVersion:req.contractVersion,project:req.project,capability:req.capability,snapshotId:req.snapshotId,requestId:value.request_id,status:'ok',output:{sections},gateway:{mode:value.mode,model:value.model,requestId:value.request_id,usage:value.usage,elapsedMs:value.elapsed_ms,generatedAt:value.generated_at,verification:value.verification}};
 };
}
function mountFeature(config,{getSessionToken=async()=>{const provider=root.CoSAISession;if(!provider||typeof provider.getToken!=='function')return '';return provider.getToken({project:config.gatewayProject,task:config.gatewayTask});},requestAI,fetchImpl=root.fetch}={}){
 const client={async generate(role,snapshot,options={}){
  await import('./ai-session-client.mjs');let sessionToken;try{sessionToken=await getSessionToken();}catch{fail('UNAUTHORIZED','An authenticated session could not be obtained. No model call was made.');}if(!sessionToken)fail('NOT_CONFIGURED','Live AI is not connected. Authenticated session setup is pending; no model call was made.');
  const sharedRequest=requestAI||(await import('./ai-client.mjs')).requestAI;
  const transport=createTransport(role,{requestAI:sharedRequest,sessionToken,fetchImpl});
  return root.CoSAI.createClient({enabled:true,transport}).generate(role,snapshot,options);
 }};
 return root.CoSAI.mount(config,{client});
}
const api={createTransport,mountFeature};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CoSAIGateway=api;
})(typeof window==='undefined'?globalThis:window);
