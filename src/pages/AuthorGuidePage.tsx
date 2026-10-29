import {AuthorGuide} from '../components/author/AuthorGuide';
import {Container} from '../components/layout/Container';
export function AuthorGuidePage(){
 return <Container className="py-4 space-y-6"><header><p className="text-xs uppercase tracking-widest text-purple-200 mb-3">A little guidance, at your pace</p><h1 className="text-3xl font-semibold text-white">Author Guide</h1><p className="text-slate-400 mt-3 leading-7">Chat with your guide, ask follow-up questions, or switch to the interactive walkthrough. Built-in answers work without an AI key. Optional AI help uses your OpenRouter key and model.</p></header><AuthorGuide inline initialMode="help"/></Container>;
}
