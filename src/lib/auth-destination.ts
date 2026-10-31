/** Only fixed internal destinations are accepted; query strings never grant plan access. */
export function authDestination(next?:string|null){return next==='billing'?'/billing':'/dashboard';}
export function authPagePath(page:'login'|'signup',next?:string|null,checkEmail=false){
 const query=new URLSearchParams();if(next==='billing')query.set('next','billing');if(checkEmail)query.set('checkEmail','1');
 return `/auth/${page}${query.size?`?${query.toString()}`:''}`;
}
export function signupEmailRedirect(origin:string,next?:string|null){
 // Public deployments share one approved confirmation destination; local development stays local.
 let base='https://www.publestudio.com';
 try{const url=new URL(origin);if(['localhost','127.0.0.1','[::1]'].includes(url.hostname)&&['http:','https:'].includes(url.protocol))base=url.origin;}catch{ /* Fall back to the canonical production origin. */ }
 return new URL(authPagePath('login',next),base).href;
}
