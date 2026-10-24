import {createProxy} from './ai-proxy.mjs';
export function createHandler(options={}){return createProxy({...options,project:"sid-cos-rentana-cash-20261021",task:"cos.rentana.billing-exceptions.v1"});}
export default async function handler(req,res){return createHandler()(req,res);}
