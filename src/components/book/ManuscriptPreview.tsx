import {parseBlocks} from '../../lib/manuscript-format';
import type {ContentFormat} from '../../lib/manuscript-format';
export function ManuscriptPreview({content,format='plain'}:{content:string;format?:ContentFormat}){
 return <div className="space-y-4 text-slate-200 leading-8 break-words">{parseBlocks(content,format).map((block,index)=>{
 const text=block.runs.map((run,i)=>run.bold?<strong key={i}>{run.text}</strong>:run.italic?<em key={i}>{run.text}</em>:<span key={i}>{run.text}</span>);
 if(block.kind==='heading')return <h3 key={index} className="text-xl font-semibold">{text}</h3>;
 if(block.kind==='bullet')return <ul key={index} className="list-disc pl-6"><li>{text}</li></ul>;
 if(block.kind==='quote')return <blockquote key={index} className="border-l-2 border-purple-400 pl-4 italic">{text}</blockquote>;
 return <p key={index} className="whitespace-pre-wrap">{text}</p>;
 })}</div>;
}
