import {Link} from 'react-router-dom';
import {Brand} from '../components/ui/Brand';
import {PublicFooter} from '../components/legal/PublicFooter';
import {PricingPlans} from '../components/pricing/PricingPlans';
export function Pricing(){return <div className="min-h-screen bg-[#0f0c1b] text-slate-200"><header className="max-w-7xl mx-auto px-6 py-7 flex flex-wrap justify-between items-center gap-4"><Link to="/" aria-label="PubléStudio home"><Brand/></Link><Link to="/" className="text-purple-300 text-sm">Back to home</Link></header><main className="max-w-7xl mx-auto px-6"><PricingPlans/></main><PublicFooter/></div>;}
