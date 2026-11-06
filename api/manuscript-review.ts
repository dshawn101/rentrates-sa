import type {IncomingMessage,ServerResponse} from 'node:http';
import {reviewConfig,runManuscriptReview,ReviewError} from '../server/manuscript-review.js';

export const config={maxDuration:120};
export default async function handler(req:IncomingMessage&{body?:unknown},res:ServerResponse){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 const reply=(status:number,body:object)=>{res.statusCode=status;res.end(JSON.stringify(body));};
 const settings=reviewConfig(process.env);
 if(req.method==='GET')return reply(200,{available:!!settings});
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return reply(405,{error:'Use GET or POST.'});}
 if(!settings)return reply(503,{error:'Platform review is not enabled yet. You can explicitly choose BYOK.'});
 try{
  let raw=typeof req.body==='string'?req.body:req.body===undefined?'':JSON.stringify(req.body);
  if(req.body===undefined)for await(const chunk of req){raw+=chunk;if(raw.length>2048)return reply(413,{error:'Review request is too large.'});}
  if(raw.length>2048)return reply(413,{error:'Review request is too large.'});
  let input:unknown;try{input=JSON.parse(raw);}catch{return reply(400,{error:'Invalid review request.'});}
  return reply(200,await runManuscriptReview(settings,req.headers.authorization,input));
 }catch(error){return reply(error instanceof ReviewError?error.status:502,{error:error instanceof ReviewError?error.message:'Review could not finish. You can explicitly choose BYOK. No automatic retry or fallback was used.'});}
}
