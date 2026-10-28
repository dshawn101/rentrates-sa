import type {Book} from '../store/useBookStore';
import type {UsageRecord} from './ai-usage';
export const MANUSCRIPT_STAGES=[{id:'draft',label:'Setup'},{id:'outline',label:'Outline'},{id:'writing',label:'Writing'},{id:'formatting',label:'Formatting'},{id:'published',label:'Published'}] as const;
const nonnegative=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)&&value>=0?value:0;
export function dashboardAnalytics(books:Book[],usage:UsageRecord[]){
 const stages=MANUSCRIPT_STAGES.map(stage=>({...stage,count:books.filter(b=>b.status===stage.id).length}));
 const goals=books.filter(b=>Number.isFinite(Number(b.metadata?.targetWordCount))&&Number(b.metadata?.targetWordCount)>0);
 const targetWords=goals.reduce((n,b)=>n+Number(b.metadata.targetWordCount),0),goalWords=goals.reduce((n,b)=>n+nonnegative(b.wordCount),0);
 const reported=usage.filter(r=>typeof r.costUSD==='number'&&Number.isFinite(r.costUSD)&&r.costUSD>=0);
 return {stages,totalWords:books.reduce((n,b)=>n+nonnegative(b.wordCount),0),writingBooks:books.filter(b=>b.status==='writing').length,targetWords,goalWords,goalBooks:goals.length,reportedCost:reported.reduce((n,r)=>n+r.costUSD!,0),reportedRequests:reported.length,requests:usage.length,unknownCosts:usage.length-reported.length,wordDistribution:[...books].sort((a,b)=>nonnegative(b.wordCount)-nonnegative(a.wordCount)).slice(0,5)};
}
export interface DashboardActivity{id:string;kind:'book'|'ai';title:string;detail:string;at:string;href:string}
export function recentDashboardActivity(books:Book[],usage:UsageRecord[]):DashboardActivity[]{
 const manuscript:DashboardActivity[]=books.map(book=>{
  const chapter=book.lastEditedChapter;const chapterLatest=chapter&&Date.parse(chapter.updatedAt)>=Date.parse(book.updated_at);
  return {id:`book-${book.id}`,kind:'book',title:chapterLatest?'Chapter saved':'Manuscript saved',detail:chapterLatest?`${book.title} · ${chapter.title||'Untitled chapter'}`:book.title,at:chapterLatest?chapter.updatedAt:book.updated_at,href:chapterLatest?`/book/${book.id}?step=3&chapter=${encodeURIComponent(chapter.id)}`:`/book/${book.id}`};
 });
 const requests:DashboardActivity[]=usage.map((record,i)=>({id:`ai-${record.at}-${i}`,kind:'ai',title:`AI request · ${record.provider}`,detail:record.model,at:record.at,href:'/ai-providers'}));
 return [...manuscript,...requests].filter(e=>Number.isFinite(Date.parse(e.at))).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,6);
}
