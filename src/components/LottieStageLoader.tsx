'use client';
import {useEffect,useState} from 'react';
import {LottieLight} from 'lottie-react';
export type LoadingStage='parsing'|'analysing'|'generating';
const labels={parsing:'Reading your manuscript…',analysing:'Mapping story threads…',generating:'Drafting Book #2…'};
export function LottieStageLoader({stage}:{stage:LoadingStage}){
 const [reduced,setReduced]=useState(false);
 useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 return <div className="stage-loader" role="status"><div className="h-24 w-24 mx-auto" aria-hidden="true">{reduced?<span className="static-book">✦</span>:<LottieLight src={`/tools/animations/${stage}.json`} autoplay loop className="h-full w-full"/>}</div><p>{labels[stage]}</p></div>;
}
