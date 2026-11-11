'use client';
import {lazy,Suspense,useEffect,useState} from 'react';
const LottieLight=lazy(()=>import('./StageAnimation'));
export type LoadingStage='parsing'|'analysing'|'generating';
const labels={parsing:'Reading your manuscript…',analysing:'Mapping characters, plot threads, and world details…',generating:'Drafting your Book #2 blueprint…'};
export function LottieStageLoader({stage}:{stage:LoadingStage}){
 const [reduced,setReduced]=useState(true);
 useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 return <div className="stage-loader" role="status"><div className="h-24 w-24 mx-auto" aria-hidden="true">{reduced?<span className="static-book">✦</span>:<Suspense fallback={null}><LottieLight src={`/tools/animations/${stage}.json`} autoplay loop className="h-full w-full"/></Suspense>}</div><p>{labels[stage]}</p></div>;
}
