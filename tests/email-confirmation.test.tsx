// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter,Route,Routes,useLocation} from 'react-router-dom';
import {emailLinkError,resendSignupConfirmation} from '../src/lib/email-confirmation';
import {signupEmailRedirect} from '../src/lib/auth-destination';
import {AuthRedirectErrors} from '../src/components/auth/AuthRedirectErrors';
import {ResendConfirmation} from '../src/components/auth/ResendConfirmation';
const m=vi.hoisted(()=>({resend:vi.fn()}));
vi.mock('../src/lib/supabase',()=>({supabaseConfigError:null,supabase:{auth:{resend:m.resend}}}));
beforeEach(()=>{vi.clearAllMocks();m.resend.mockResolvedValue({error:null});});afterEach(cleanup);
function Location(){const l=useLocation();return <output aria-label="Location">{l.pathname+l.search+l.hash}</output>;}
it('maps provider errors to fixed display states without reflecting raw descriptions or touching session fragments',()=>{
 expect(emailLinkError('','#error=access_denied&error_code=otp_expired&error_description=private-data')).toBe('expired');expect(emailLinkError('?error=access_denied','')).toBe('failed');expect(emailLinkError('','#access_token=synthetic&error_description=ignored')).toBeNull();expect(emailLinkError('','#how-it-works')).toBeNull();
});
it('routes an expired fallback-to-home callback to recovery, keeping only the allowed continuation',async()=>{
 render(<MemoryRouter initialEntries={['/?next=billing#error=access_denied&error_code=otp_expired&error_description=private-data']}><AuthRedirectErrors/><Location/><Routes><Route path="*" element={<p>Page</p>}/></Routes></MemoryRouter>);
 await waitFor(()=>expect(screen.getByLabelText('Location').textContent).toBe('/auth/login?next=billing&emailLink=expired'));expect(document.body.textContent).not.toContain('private-data');
});
it('leaves a successful callback intact for the Supabase client',()=>{
 render(<MemoryRouter initialEntries={['/auth/login#access_token=synthetic-session']}><AuthRedirectErrors/><Location/></MemoryRouter>);expect(screen.getByLabelText('Location').textContent).toBe('/auth/login#access_token=synthetic-session');
});
it('uses the canonical production destination for public and preview domains while retaining loopback development',()=>{
 for(const origin of ['https://publestudio.com','https://rentrates-sa.vercel.app','https://preview-123.vercel.app','https://evil.invalid','invalid'])expect(signupEmailRedirect(origin,'billing')).toBe('https://www.publestudio.com/auth/login?next=billing');
 expect(signupEmailRedirect('http://localhost:5173')).toBe('http://localhost:5173/auth/login');expect(signupEmailRedirect('https://www.publestudio.com','//evil.invalid')).toBe('https://www.publestudio.com/auth/login');
});
it('requests signup confirmation with the correct redirect and rejects invalid input before contacting auth',async()=>{
 await expect(resendSignupConfirmation('not-an-email','https://www.publestudio.com')).rejects.toThrow('email address');expect(m.resend).not.toHaveBeenCalled();await resendSignupConfirmation(' author@example.invalid ','https://www.publestudio.com','billing');expect(m.resend).toHaveBeenCalledWith({type:'signup',email:'author@example.invalid',options:{emailRedirectTo:'https://www.publestudio.com/auth/login?next=billing'}});
});
it('keeps responses generic, rate-limits repeated clicks and shows a recovery form after refresh',async()=>{
 render(<ResendConfirmation expanded next="billing"/>);fireEvent.change(screen.getByLabelText('Email for activation link'),{target:{value:'author@example.invalid'}});const send=screen.getByRole('button',{name:'Send a fresh activation email'});fireEvent.click(send);fireEvent.click(send);await screen.findByText(/If this address has an unconfirmed account/);expect(m.resend).toHaveBeenCalledTimes(1);expect((screen.getByRole('button',{name:'Request again in 60s'}) as HTMLButtonElement).disabled).toBe(true);
});
it('shows useful rate-limit feedback without exposing raw provider errors',async()=>{
 m.resend.mockResolvedValue({error:{status:429,message:'private backend data'}});render(<ResendConfirmation expanded initialEmail="author@example.invalid"/>);fireEvent.click(screen.getByRole('button',{name:'Send a fresh activation email'}));await screen.findByRole('alert');expect(screen.getByRole('alert').textContent).toContain('wait a minute');expect(document.body.textContent).not.toContain('private backend data');
});
