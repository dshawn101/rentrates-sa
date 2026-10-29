export type FormattingAction='bold'|'italic'|'heading'|'bullet'|'quote';
export type FormattingResult={content:string;start:number;end:number};
function starsBefore(text:string,position:number){let n=0;while(position-n>0&&text[position-n-1]==='*')n++;return n;}
function starsAfter(text:string,position:number){let n=0;while(text[position+n]==='*')n++;return n;}
const hasStyle=(count:number,action:'bold'|'italic')=>action==='bold'?count>=2:count%2===1;
export function formatSelection(content:string,start:number,end:number,action:FormattingAction):FormattingResult{
 start=Math.max(0,Math.min(content.length,start));end=Math.max(start,Math.min(content.length,end));
 if(action==='bold'||action==='italic'){
  const marker=action==='bold'?'**':'*',size=marker.length,selected=content.slice(start,end);
  // Selection may include its markers, or sit inside a wrapper created by the toolbar.
  if(selected.length>size*2&&hasStyle(starsAfter(selected,0),action)&&hasStyle(starsBefore(selected,selected.length),action)){
   const value=selected.slice(size,-size);return {content:content.slice(0,start)+value+content.slice(end),start,end:start+value.length};
  }
  if(hasStyle(starsBefore(content,start),action)&&hasStyle(starsAfter(content,end),action))return {content:content.slice(0,start-size)+selected+content.slice(end+size),start:start-size,end:end-size};
  return {content:content.slice(0,start)+marker+selected+marker+content.slice(end),start:start+size,end:end+size};
 }
 const prefix=action==='heading'?'# ':action==='bullet'?'- ':'> ';
 const lineStart=start===0?0:content.lastIndexOf('\n',start-1)+1;
 const last=end>start&&content[end-1]==='\n'?end-1:end;
 const nextBreak=content.indexOf('\n',last),lineEnd=nextBreak===-1?content.length:nextBreak;
 const lines=content.slice(lineStart,lineEnd).split('\n');const remove=lines.filter(l=>l.trim()).every(l=>l.startsWith(prefix))&&lines.some(l=>l.startsWith(prefix));
 const changed=lines.map(line=>{if(!line.trim()&&lines.length>1)return line;if(remove)return line.startsWith(prefix)?line.slice(prefix.length):line;return prefix+line.replace(/^(?:#{1,3}\s+|[-*]\s+|>\s?)/,'');});
 const value=changed.join('\n'),result=content.slice(0,lineStart)+value+content.slice(lineEnd);
 if(start===end){const delta=changed[0].length-lines[0].length,caret=Math.max(lineStart,Math.min(lineStart+changed[0].length,start+delta));return {content:result,start:caret,end:caret};}
 return {content:result,start:lineStart,end:lineStart+value.length};
}
