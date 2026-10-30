import {Navigate} from 'react-router-dom';
import {AuthorGuide} from '../components/author/AuthorGuide';
export function AuthorGuideContent(){
 return <div className="space-y-6"><header><p className="text-xs uppercase tracking-widest text-purple-200 mb-3">A little company for the writing journey</p><h3 className="author-guide-welcome-title">A little less stuck.<br/><em>A little more you.</em></h3><p className="text-slate-400 mt-3 leading-7">Questions, tiny tangles and “where do I start?” moments. Bring them here. There’s room to figure things out, one small step at a time.</p></header><AuthorGuide inline initialMode="help"/></div>;
}
export function AuthorGuidePage(){return <Navigate to="/settings?section=guide" replace/>;}
