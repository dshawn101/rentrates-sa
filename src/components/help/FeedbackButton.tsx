import {displayName} from '../../lib/author-profile';
import {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useLocation,Link} from 'react-router-dom';
import {Bug,Lightbulb,MessageSquare,Star,X,Send,Copy,Check} from 'lucide-react';
import {useAuth} from '../../hooks/useAuth';
import {FEEDBACK_TYPES,submitFeedback,type FeedbackType} from '../../lib/feedback';
import {GlassButton} from '../ui/GlassButton';
import '../../styles/help-center.css';
import '../../styles/feedback-studio.css';

const choices={
 bug:{icon:Bug,label:'Report a problem',detail:'Something to fix',prompt:'What happened, and what were you expecting?'},
 feature:{icon:Lightbulb,label:'Share an idea',detail:'Something to add',prompt:'What would make your writing day easier?'},
 general:{icon:MessageSquare,label:'Tell us how it feels',detail:'Something to share',prompt:'What’s working for you? What could feel better?'},
};
const ratingLabels=['A little signal goes a long way.','Needs more care','Room to grow','Getting there','A lovely writing space','Love writing here'];

export function FeedbackButton({className=''}:{className?:string}){
 const {user}=useAuth();const {pathname}=useLocation();const title=useId(),group=useId(),ratingGroup=useId(),messageHelp=useId();
 const [open,setOpen]=useState(false),[type,setType]=useState<FeedbackType>('general'),[message,setMessage]=useState(''),[rating,setRating]=useState(0),[previewRating,setPreviewRating]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reference,setReference]=useState(''),[copied,setCopied]=useState(false),[name,setName]=useState(''),[email,setEmail]=useState(''),[website,setWebsite]=useState('');
 const trigger=useRef<HTMLButtonElement>(null),dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null),requestId=useRef<string|null>(null),pending=useRef(false);
 const changed=()=>{requestId.current=null;setError('');};
 useEffect(()=>{if(!open)return;const el=dialog.current;if(!el)return;const overflow=document.body.style.overflow;el.showModal();document.body.style.overflow='hidden';close.current?.focus();return()=>{el.close();document.body.style.overflow=overflow;trigger.current?.focus();};},[open]);
 const dismiss=()=>{if(!pending.current){setPreviewRating(0);setOpen(false);}};
 const send=async(e:React.FormEvent)=>{
  e.preventDefault();if(pending.current)return;pending.current=true;setBusy(true);setError('');
  try{requestId.current??=crypto.randomUUID();const ownerEmail=user?.email||email;const ownerName=displayName(user?.user_metadata?.display_name).slice(0,100)||name.trim()||ownerEmail.split('@')[0];setCopied(false);setReference(await submitFeedback({name:ownerName,email:ownerEmail,type,message,rating,page:pathname,website},requestId.current));}
  catch(e){setError(e instanceof Error?e.message:'Feedback could not be saved. Please retry.');}
  finally{pending.current=false;setBusy(false);}
 };
 const copyReference=async()=>{try{await navigator.clipboard.writeText(`PS-${reference}`);setCopied(true);}catch{setCopied(false);}};
 const shownRating=previewRating||rating;
 return <>
  <button ref={trigger} className={`glass-button feedback-trigger ${className}`} aria-haspopup="dialog" onClick={()=>setOpen(true)}><MessageSquare size={16} aria-hidden="true"/>Share feedback</button>
  {open&&createPortal(<dialog ref={dialog} className="feedback-dialog feedback-studio" aria-labelledby={title} onCancel={e=>{e.preventDefault();dismiss();}} onClose={dismiss} onClick={e=>{if(e.target===e.currentTarget)dismiss();}}>
   <div className="feedback-content">
    <header className="feedback-studio-header">
     <span className="feedback-studio-quill" aria-hidden="true"><img src="/puble-quill.png" width="54" height="54" alt=""/></span>
     <div><p className="feedback-studio-eyebrow">A note to the studio</p><h2 id={title}>Your voice shapes<br/><em>the studio.</em></h2><p>Something missing? Something magical? We’re listening.</p></div>
     <svg className="feedback-flourish" viewBox="0 0 280 100" fill="none" aria-hidden="true"><path d="M5 75C70 5 102 18 88 55S56 87 80 68 141 18 145 48 126 87 154 59 179 44 178 60 204 29 211 48 247 57 275 25"/></svg>
     <button ref={close} aria-label="Close feedback" disabled={busy} onClick={dismiss}><X size={18}/></button>
    </header>
    {reference?<section className="feedback-success" role="status">
     <svg className="feedback-signed" viewBox="0 0 180 80" fill="none" aria-hidden="true"><path d="M16 58Q67 8 67 35T51 56 95 26 97 49 134 31M26 68Q92 48 164 61"/></svg>
     <span className="feedback-studio-eyebrow">A little better, together</span><h3>Your note is saved.</h3><p>Thank you for helping PubléStudio grow.<br/>Your feedback is in our private review queue.</p>
     <div className="feedback-receipt"><span className="feedback-reference">PS-{reference}</span><button type="button" onClick={()=>void copyReference()} aria-label="Copy feedback reference">{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Copied':'Copy'}</button></div>
     <p className="feedback-receipt-note">Keep this reference if you contact us. No automatic confirmation email is sent.</p>
     <GlassButton onClick={()=>{setReference('');setCopied(false);setMessage('');setRating(0);setPreviewRating(0);requestId.current=null;}}>Write another note</GlassButton>
    </section>:<form onSubmit={send}>
     <fieldset disabled={busy} className="space-y-5">
      <fieldset><legend>What’s on your mind?</legend><div className="feedback-types">{FEEDBACK_TYPES.map(t=>{const choice=choices[t.id],Icon=choice.icon;return <label key={t.id} className={`feedback-choice ${type===t.id?'selected':''}`}><input type="radio" name={group} value={t.id} checked={type===t.id} onChange={()=>{setType(t.id);changed();}}/><Icon size={22} aria-hidden="true"/><span>{choice.label}</span><small>{choice.detail}</small><Check className="feedback-choice-check" size={12} aria-hidden="true"/></label>;})}</div></fieldset>
      {!user?.email&&<div className="feedback-contact"><label>Your name<input required maxLength={100} autoComplete="name" value={name} onChange={e=>{setName(e.target.value);changed();}}/></label><label>Email address<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);changed();}}/></label></div>}
      <div className="feedback-note"><label className="feedback-message">Your message<textarea required minLength={20} maxLength={4500} rows={4} aria-describedby={messageHelp} placeholder={choices[type].prompt} value={message} onChange={e=>{setMessage(e.target.value);changed();}}/></label><div className="feedback-note-meta" id={messageHelp}><span>20–4,500 characters. Leave out passwords, API keys and manuscript text.</span><span>{message.length.toLocaleString()} / 4,500</span></div></div>
      <fieldset className="feedback-rating-section"><legend>How’s your writing space? <span className="feedback-optional">Optional</span></legend><div className="feedback-stars" onMouseLeave={()=>setPreviewRating(0)}>{[1,2,3,4,5].map(value=><label key={value} aria-label={`${value} ${value===1?'star':'stars'}`} className={shownRating>=value?'rated':''} onMouseEnter={()=>{if(!busy)setPreviewRating(value);}}><input aria-label={`${value} ${value===1?'star':'stars'}`} type="radio" name={ratingGroup} value={value} checked={rating===value} onFocus={()=>setPreviewRating(value)} onBlur={()=>setPreviewRating(0)} onChange={()=>{setRating(value);changed();}}/><Star size={31} aria-hidden="true"/></label>)}</div><div className="feedback-rating-caption"><span aria-live="polite">{ratingLabels[shownRating]}</span>{rating>0&&<button type="button" className="feedback-clear" onClick={()=>{setRating(0);setPreviewRating(0);changed();}}>Clear rating</button>}</div></fieldset>
      <div className="feedback-honeypot" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label></div>
      <p className="feedback-privacy">Just between you and the studio. Saved privately for review{user?.email?' with your account email':''}. <Link to="/legal/privacy" onClick={dismiss}>Privacy Policy</Link></p>
      {error&&<p role="alert" className="text-amber-200 text-sm">{error}</p>}
      <GlassButton type="submit" className="w-full feedback-studio-send" isLoading={busy}><span>Send to the studio</span><Send size={16} aria-hidden="true"/></GlassButton>
     </fieldset>
    </form>}
   </div>
  </dialog>,document.body)}
 </>;
}
