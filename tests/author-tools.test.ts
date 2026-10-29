import {expect,it} from 'vitest';
import {BOOK_TEMPLATES,templateMetadata,templateOutline} from '../src/lib/book-templates';
import {goalProgress,readWritingGoal,validGoalDate} from '../src/lib/writing-goals';
import {guideContext,guideAnswers,guidePrompt,walkthroughSteps} from '../src/lib/author-guide';
import type {Book} from '../src/store/useBookStore';
const book={id:'b',title:'Private title',wordCount:500,chapterCount:2,metadata:{author:'Author',genre:'fiction',targetWordCount:1000,bookNotes:'SECRET MANUSCRIPT NOTES'},status:'writing'} as Book;
it('provides editable, uniquely identified blank chapters and keeps planning notes separate from prose',()=>{for(const t of BOOK_TEMPLATES){const a=templateOutline(t.id),b=templateOutline(t.id);expect(a.length).toBeGreaterThan(0);expect(a.every(c=>c.content===''&&c.title&&c.description)).toBe(true);expect(a[0].id).not.toBe(b[0].id);expect(templateMetadata(t.id)).toEqual({starterTemplate:t.id,genre:t.genre,targetWordCount:t.targetWords});}expect(templateOutline('unknown')).toEqual([]);expect(templateMetadata('unknown')).toEqual({});});
it('calculates saved-word progress, inclusive target dates, completion and missed dates without a daily log',()=>{
 const goal={enabled:true,targetWords:1000,targetDate:'2026-10-30'};expect(goalProgress(500,goal,'2026-10-29')).toMatchObject({remaining:500,percent:50,days:2,perDay:250});expect(goalProgress(1500,goal,'2026-10-29')).toMatchObject({remaining:0,percent:100});expect(goalProgress(500,goal,'2026-11-01').perDay).toBeNull();expect(validGoalDate('2026-02-30')).toBe(false);expect(validGoalDate('2026-99-99')).toBe(false);expect(readWritingGoal({writingGoal:{enabled:false,targetWords:1000}})).toBeNull();
});
it('keeps navigation separate from saved progress and distinguishes optional cover from export review',()=>{expect(walkthroughSteps(book).slice(0,4).every(s=>s.saved)).toBe(true);expect(walkthroughSteps(book)[4].optional).toBe(true);expect(walkthroughSteps(book)[5].saved).toBe(false);expect(walkthroughSteps().every(s=>s.href==='/books')).toBe(true);});
it('provides page-specific local answers and sends book progress only when explicitly supplied',()=>{
 const c=guideContext('/book/b','?step=5'),answers=guideAnswers('export',c.topics);expect(c.name).toBe('Manuscript export');expect(answers.length).toBeGreaterThan(0);const prompt=guidePrompt('How do I export?',c,answers);expect(prompt).not.toContain('Private title');expect(prompt).not.toContain('SECRET MANUSCRIPT NOTES');const withProgress=guidePrompt('What next?',c,answers,book);expect(withProgress).toContain('Private title');expect(withProgress).not.toContain('SECRET MANUSCRIPT NOTES');
});

it('prioritises a matching question over a general article mentioning the same words',()=>{const answers=guideAnswers('How do I export my manuscript?',[]);expect(answers[0].id).toBe('export');});
