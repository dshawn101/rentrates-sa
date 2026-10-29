/** Only fixed internal destinations are accepted; query strings never grant plan access. */
export function authDestination(next?:string|null){return next==='billing'?'/billing':'/dashboard';}
export function authPagePath(page:'login'|'signup',next?:string|null,checkEmail=false){
 const query=new URLSearchParams();if(next==='billing')query.set('next','billing');if(checkEmail)query.set('checkEmail','1');
 return `/auth/${page}${query.size?`?${query.toString()}`:''}`;
}
export function signupEmailRedirect(origin:string,next?:string|null){return new URL(authPagePath('login',next),origin).href;}
