export type WritingGoal={enabled:boolean;targetWords:number;targetDate:string|null};
export function localDay(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function validGoalDate(value:string){return Number.isFinite(Date.parse(`${value}T00:00:00Z`))&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number(value.slice(0,4))>=2000&&Number(value.slice(0,4))<=2200&&new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)===value;}
export function goalProgress(words:number,goal:WritingGoal,today=localDay()){
 const saved=Math.max(0,Number.isFinite(words)?words:0),target=goal.targetWords,remaining=Math.max(0,target-saved);
 const days=goal.targetDate&&validGoalDate(goal.targetDate)?Math.round((Date.parse(`${goal.targetDate}T00:00:00Z`)-Date.parse(`${today}T00:00:00Z`))/86400000)+1:null;
 return {saved,target,remaining,percent:target>0?Math.min(100,Math.floor(saved/target*100)):0,days,perDay:days!==null&&days>0?Math.ceil(remaining/days):null};
}
export function readWritingGoal(metadata:Record<string,unknown>):WritingGoal|null{
 const g=metadata.writingGoal as Partial<WritingGoal>|undefined;
 if(!g||g.enabled!==true||!Number.isInteger(g.targetWords)||g.targetWords!<1000||g.targetWords!>200000)return null;
 return {enabled:true,targetWords:g.targetWords!,targetDate:typeof g.targetDate==='string'&&validGoalDate(g.targetDate)?g.targetDate:null};
}
