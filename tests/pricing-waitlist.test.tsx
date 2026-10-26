// @vitest-environment jsdom
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {PricingPlans} from '../src/components/pricing/PricingPlans';
import {joinWaitlist} from '../src/lib/waitlist';
const mocks=vi.hoisted(()=>({insert:vi.fn()}));
vi.mock('../src/lib/supabase',()=>({supabase:{from:()=>({insert:mocks.insert})}}));
beforeEach(()=>{vi.clearAllMocks();mocks.insert.mockResolvedValue({error:null});HTMLElement.prototype.scrollIntoView=vi.fn();});afterEach(cleanup);
it('offers free signup and Lite interest while keeping higher-tier purchases disabled',()=>{
 render(<MemoryRouter><PricingPlans/></MemoryRouter>);
 expect(screen.getByText('$9')).toBeTruthy();expect(screen.getByText('$19')).toBeTruthy();expect(screen.getByText('$49')).toBeTruthy();expect(screen.getByText('Join free beta').getAttribute('href')).toBe('/auth/signup');
 for(const name of ['Author plan','Pro plan'])expect((within(screen.getByRole('article',{name})).getByRole('button',{name:'Opens after Product Hunt'}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(screen.getByText('Register Lite beta interest'));expect((screen.getByLabelText('What interests you?') as HTMLSelectElement).value).toBe('lite');
});
it('records explicit notification consent and does not create an account or subscription',async()=>{
 render(<MemoryRouter><PricingPlans source="landing"/></MemoryRouter>);
 fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'Author@Example.invalid'}});fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByText('Join launch waitlist'));
 await screen.findByRole('status');expect(mocks.insert).toHaveBeenCalledWith({email:'author@example.invalid',interest:'launch',source:'landing',consent:true});expect(screen.getByRole('status').textContent).toContain('No account, payment or subscription');
});
it('keeps input for a retry after a network failure',async()=>{
 mocks.insert.mockResolvedValue({error:{message:'offline'}});render(<MemoryRouter><PricingPlans/></MemoryRouter>);
 fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'author@example.invalid'}});fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByText('Join launch waitlist'));
 await screen.findByRole('alert');expect((screen.getByLabelText('Email address') as HTMLInputElement).value).toBe('author@example.invalid');
});
it('rejects missing consent, malformed email and the honeypot before sending',async()=>{
 const base={email:'author@example.invalid',interest:'lite' as const,source:'pricing' as const,consent:true};
 for(const change of [{consent:false},{email:'bad'},{website:'spam'}])await expect(joinWaitlist({...base,...change})).rejects.toThrow();
 await waitFor(()=>expect(mocks.insert).not.toHaveBeenCalled());
});
