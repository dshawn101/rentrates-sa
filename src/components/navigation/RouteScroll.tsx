import {useLayoutEffect} from 'react';
import {useLocation} from 'react-router-dom';

/** Apply the destination's position after React has committed its page content. */
export function RouteScroll(){
 const {pathname,search,hash,key}=useLocation();
 useLayoutEffect(()=>{
  const previous=window.history.scrollRestoration;
  window.history.scrollRestoration='manual';
  return()=>{window.history.scrollRestoration=previous;};
 },[]);
 useLayoutEffect(()=>{
  const frame=window.requestAnimationFrame(()=>{
   if(hash){
    let id=hash.slice(1);try{id=decodeURIComponent(id);}catch{/* use literal malformed fragment */}
    const section=document.getElementById(id);
    if(section){section.scrollIntoView({block:'start',behavior:'instant'});return;}
   }
   window.scrollTo({top:0,left:0,behavior:'instant'});
   document.querySelectorAll<HTMLElement>('[data-route-scroll]').forEach(container=>{container.scrollTop=0;container.scrollLeft=0;});
  });
  return()=>window.cancelAnimationFrame(frame);
 },[pathname,search,hash,key]);
 return null;
}
