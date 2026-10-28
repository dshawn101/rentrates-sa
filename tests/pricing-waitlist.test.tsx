// @vitest-environment jsdom
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {PricingPlans} from '../src/components/pricing/PricingPlans';
import {joinWaitlist} from '../src/lib/waitlist';
const mocks=vi.hoisted(()=>({insert:vi.fn()}));
vi.mock('../src/lib/supabase',()=>({supabase:{from:()=>({insert:mocks.insert})}}));
beforeEach(()=>{vi.clearAllMocks();mocks.insert.mockResolvedValue({error:null});HTMLElement.prototype.scrollIntoView=vi.fn();HTMLDialogElement.prototype.showModal=vi.fn(function(this:HTMLDialogElement){this.setAttribute('open','');});HTMLDialogElement.prototype.close=vi.fn(function(this:HTMLDialogElement){this.removeAttribute('open');});});afterEach(cleanup);
it('routes Lite to billing and keeps notifications separate from checkout',()=>{
 render(<MemoryRouter><PricingPlans/></MemoryRouter>);
 expect(screen.getByText('$9')).toBeTruthy();expect(screen.queryByText('$19')).toBeNull();expect(screen.queryByText('$49')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Planned Premium Tiers'}));expect(screen.getByText('$19')).toBeTruthy();expect(screen.getByText('$49')).toBeTruthy();expect(screen.getByText('Join free beta').getAttribute('href')).toBe('/auth/signup');
 for(const name of ['Author plan','Pro plan'])expect((within(screen.getByRole('article',{name})).getByRole('button',{name:'Opens after Product Hunt'}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(screen.getByLabelText('Close premium tiers'));expect(screen.getByRole('link',{name:'View Lite & checkout status'}).getAttribute('href')).toBe('/billing');fireEvent.click(screen.getByText('Notify me when Lite checkout opens'));expect((screen.getByLabelText('What interests you?') as HTMLSelectElement).value).toBe('lite');
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

it('closes premium tiers with cancellation and restores focus to the launcher',()=>{
 render(<MemoryRouter><PricingPlans/></MemoryRouter>);const trigger=screen.getByRole('button',{name:'Planned Premium Tiers'});
 fireEvent.click(trigger);const dialog=screen.getByRole('dialog');expect(document.activeElement).toBe(screen.getByLabelText('Close premium tiers'));expect(document.body.style.overflow).toBe('hidden');
 fireEvent(dialog,new Event('cancel',{bubbles:false,cancelable:true}));expect(screen.queryByRole('dialog')).toBeNull();expect(document.activeElement).toBe(trigger);expect(document.body.style.overflow).toBe('');
});
it('routes a premium notification choice back to the existing waitlist and focuses email',()=>{
 render(<MemoryRouter><PricingPlans/></MemoryRouter>);fireEvent.click(screen.getByRole('button',{name:'Planned Premium Tiers'}));fireEvent.click(screen.getByText('Notify me about Pro'));
 expect(screen.queryByRole('dialog')).toBeNull();expect((screen.getByLabelText('What interests you?') as HTMLSelectElement).value).toBe('pro');expect(document.activeElement).toBe(screen.getByLabelText('Email address'));
});
