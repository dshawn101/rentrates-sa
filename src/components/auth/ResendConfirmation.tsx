import {useEffect,useRef,useState} from 'react';
import {GlassButton} from '../ui/GlassButton';
import {GlassInput} from '../ui/GlassInput';
import {resendSignupConfirmation} from '../../lib/email-confirmation';
export function ResendConfirmation({initialEmail='',next,expanded=false}:{initialEmail?:string;next?:string|null;expanded?:boolean}){
 const [email,setEmail]=useState(initialEmail),[busy,setBusy]=useState(false),[cooldown,setCooldown]=useState(0),[message,setMessage]=useState(''),[error,setError]=useState(false);const pending=useRef(false);
 useEffect(()=>{if(!cooldown)return;const timer=window.setTimeout(()=>setCooldown(v=>Math.max(0,v-1)),1000);return()=>window.clearTimeout(timer);},[cooldown]);
 return <details open={expanded||undefined} className="mt-6 rounded-xl border border-white/15 p-4 text-sm text-slate-300"><summary className="cursor-pointer rounded-lg px-3 py-2">Need a new activation email?</summary><form className="space-y-4 pt-4" onSubmit={async e=>{e.preventDefault();if(pending.current||cooldown)return;pending.current=true;setBusy(true);setError(false);setMessage('');try{await resendSignupConfirmation(email,window.location.origin,next);setCooldown(60);setMessage('If this address has an unconfirmed account, a new activation email has been requested. Open the newest email and use its link once. If your account is already confirmed, sign in instead.');}catch(cause){setError(true);setMessage(cause instanceof Error?cause.message:'Could not request an activation email.');}finally{pending.current=false;setBusy(false);}}}>
  <p className="leading-6">Enter the address you used to sign up. This requests a fresh link; it does not create another account.</p><GlassInput label="Email for activation link" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/><GlassButton type="submit" disabled={cooldown>0} isLoading={busy}>{cooldown?`Request again in ${cooldown}s`:'Send a fresh activation email'}</GlassButton>{message&&<p role={error?'alert':'status'} className={error?'text-amber-200 leading-6':'text-purple-200 leading-6'}>{message}</p>}
 </form></details>;
}
