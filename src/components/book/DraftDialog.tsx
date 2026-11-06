import {useEffect,useId,useRef,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {GlassButton} from '../ui/GlassButton';

export function DraftDialog({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
 const dialog=useRef<HTMLDialogElement>(null),heading=useId();
 useEffect(()=>{
  const element=dialog.current;
  const previous=document.activeElement;
  element?.showModal();
  return ()=>{element?.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};
 },[]);
 return createPortal(<dialog ref={dialog} aria-labelledby={heading} onCancel={e=>{e.preventDefault();onClose();}} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl overflow-auto rounded-2xl border border-white/20 bg-slate-950 p-5 text-slate-200 backdrop:bg-black/75"><header className="mb-5 flex items-center justify-between gap-4"><h2 id={heading} className="text-xl font-semibold text-white">{title}</h2><GlassButton size="sm" onClick={onClose}>Close</GlassButton></header>{children}</dialog>,document.body);
}
