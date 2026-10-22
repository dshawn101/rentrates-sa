// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {Link,MemoryRouter,Route,Routes} from 'react-router-dom';
import {RouteScroll} from '../src/components/navigation/RouteScroll';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('scrolls FAQ after mounting its target and resets ordinary and repeated page links to the top',async()=>{
 const top=vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
 const section=vi.fn();Element.prototype.scrollIntoView=section;
 render(<MemoryRouter initialEntries={['/contact']}><RouteScroll/><nav><Link to="/#questions">FAQ</Link><Link to="/features">Features</Link><Link to="/contact">Contact</Link></nav><Routes><Route path="/" element={<section id="questions">Actual FAQ</section>}/><Route path="/features" element={<h1>Features page</h1>}/><Route path="/contact" element={<h1>Contact page</h1>}/></Routes></MemoryRouter>);
 await waitFor(()=>expect(top).toHaveBeenCalled());top.mockClear();
 fireEvent.click(screen.getByText('FAQ'));await screen.findByText('Actual FAQ');
 await waitFor(()=>expect(section).toHaveBeenCalledWith({block:'start',behavior:'instant'}));expect(top).not.toHaveBeenCalled();
 fireEvent.click(screen.getByText('Features'));await screen.findByText('Features page');await waitFor(()=>expect(top).toHaveBeenCalledWith({top:0,left:0,behavior:'instant'}));top.mockClear();
 fireEvent.click(screen.getByText('Features'));await waitFor(()=>expect(top).toHaveBeenCalled());top.mockClear();
 fireEvent.click(screen.getByText('Contact'));await screen.findByText('Contact page');await waitFor(()=>expect(top).toHaveBeenCalled());
});
