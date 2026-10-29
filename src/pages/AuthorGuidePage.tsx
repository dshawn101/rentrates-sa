import {AuthorGuide} from '../components/author/AuthorGuide';
import {Container} from '../components/layout/Container';
export function AuthorGuidePage(){
 return <Container className="py-4 space-y-6"><header><p className="text-xs uppercase tracking-widest text-purple-200 mb-3">A little company for the writing journey</p><h1 className="text-3xl font-semibold text-white">A little less stuck.<br/><span className="text-purple-200">A little more you.</span></h1><p className="text-slate-400 mt-3 leading-7">Questions, tiny tangles and “where do I start?” moments. Bring them here. There’s room to figure things out, one small step at a time.</p></header><AuthorGuide inline initialMode="help"/></Container>;
}
