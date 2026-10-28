// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import type {Book} from '../src/store/useBookStore';
import {dashboardAnalytics,recentDashboardActivity} from '../src/lib/dashboard-analytics';
import {DashboardAnalytics} from '../src/components/dashboard/DashboardAnalytics';
const book=(id:string,words:number,target?:number):Book=>({id,user_id:'author',title:`Book ${id}`,status:'writing',tier_created:'free',wordCount:words,metadata:target?{targetWordCount:target}:{},created_at:'2026-10-01T10:00:00Z',updated_at:'2026-10-20T10:00:00Z'});
afterEach(cleanup);
it('uses saved goals as the denominator and keeps missing AI costs separate from reported zero',()=>{
 const data=dashboardAnalytics([book('one',500,1000),book('two',900)], [{provider:'openai',model:'model',at:'2026-10-21',costUSD:0},{provider:'openrouter',model:'model',at:'2026-10-22',costUSD:.25},{provider:'xai',model:'model',at:'2026-10-23'}]);
 expect(data.totalWords).toBe(1400);expect(data.goalWords).toBe(500);expect(data.targetWords).toBe(1000);expect(data.goalBooks).toBe(1);expect(data.reportedCost).toBe(.25);expect(data.reportedRequests).toBe(2);expect(data.unknownCosts).toBe(1);expect(data.stages.find(s=>s.id==='writing')?.count).toBe(2);
});
it('does not treat negative or nonfinite reported costs as real charges',()=>{const data=dashboardAnalytics([],[-1,NaN,Infinity].map(costUSD=>({provider:'test',model:'model',at:'2026-10-21',costUSD})));expect(data.reportedRequests).toBe(0);expect(data.unknownCosts).toBe(3);});
it('merges the latest saved manuscript update with successful AI usage and links directly to the saved chapter',()=>{
 const b=book('one',500);b.lastEditedChapter={id:'chapter-1',title:'Opening',updatedAt:'2026-10-24T11:00:00Z',orderIndex:0};const activity=recentDashboardActivity([b],[{provider:'openai',model:'chosen-model',at:'2026-10-25T10:00:00Z'}]);expect(activity.map(a=>a.kind)).toEqual(['ai','book']);expect(activity[1].href).toBe('/book/one?step=3&chapter=chapter-1');expect(activity[1].detail).toBe('Book one · Opening');
});
it('shows an honest empty state instead of invented progress or free AI costs',()=>{
 render(<MemoryRouter><DashboardAnalytics books={[]} usage={[]} loading={false} error={null}/></MemoryRouter>);expect(screen.getByText('No records')).toBeTruthy();expect(screen.getByText('Set a word goal in book setup to see progress.')).toBeTruthy();expect(screen.getByText('Your next saved chapter will begin this story.')).toBeTruthy();
});
it('hides stale manuscript figures on a loading failure while still showing actual device usage',()=>{
 render(<MemoryRouter><DashboardAnalytics books={[book('stale',15000)]} usage={[{provider:'openai',model:'model',at:'2026-10-25T10:00:00Z'}]} loading={false} error="Unavailable"/></MemoryRouter>);expect(screen.queryByText('15,000')).toBeNull();expect(screen.queryByText('Book stale')).toBeNull();expect(screen.getByText('Not reported')).toBeTruthy();expect(within(screen.getByRole('region',{name:'Recent activity'})).getByText('AI request · openai')).toBeTruthy();
});
