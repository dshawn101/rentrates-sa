import {Navigate,useLocation} from 'react-router-dom';
import {emailLinkError} from '../../lib/email-confirmation';
import {authPagePath} from '../../lib/auth-destination';
export function AuthRedirectErrors(){
 const location=useLocation();const error=emailLinkError(location.search,location.hash);
 if(!error)return null;
 const next=new URLSearchParams(location.search).get('next');
 // Replace removes the provider error fragment from browser history. Successful session callbacks are untouched.
 return <Navigate replace to={`${authPagePath('login',next)}${next==='billing'?'&':'?'}emailLink=${error}`}/>;
}
