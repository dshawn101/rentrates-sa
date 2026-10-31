import {supabase,supabaseConfigError} from './supabase';
import {signupEmailRedirect} from './auth-destination';
/** Treat redirect errors as display state only; never print a token or raw provider description. */
export function emailLinkError(search:string,hash:string):'expired'|'failed'|null{
 const query=new URLSearchParams(search),fragment=new URLSearchParams(hash.replace(/^#/,''));
 if(fragment.has('access_token')||fragment.has('refresh_token'))return null;
 const code=fragment.get('error_code')||query.get('error_code');
 if(code==='otp_expired')return 'expired';
 return fragment.has('error')||fragment.has('error_description')||query.has('error')||query.has('error_description')?'failed':null;
}
export async function resendSignupConfirmation(email:string,origin:string,next?:string|null){
 if(supabaseConfigError)throw new Error('Account email is not configured. Contact support.');
 const address=email.trim();if(address.length>254||!/^\S+@\S+\.\S+$/.test(address))throw new Error('Enter the email address you used to sign up.');
 const {error}=await supabase.auth.resend({type:'signup',email:address,options:{emailRedirectTo:signupEmailRedirect(origin,next)}});
 if(error){if(error.status===429||error.code==='over_email_send_rate_limit'||error.code==='over_request_rate_limit')throw new Error('Please wait a minute before requesting another activation email.');throw new Error('We could not request an activation email. Please retry shortly or contact support.');}
}
