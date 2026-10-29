import {Link} from 'react-router-dom';
import '../../styles/workspace-footer.css';
export function WorkspaceFooter(){return <footer className="workspace-footer" aria-label="Workspace footer"><div><p>© {new Date().getFullYear()} PubléStudio. All rights reserved.</p></div><nav aria-label="Workspace information"><Link to="/help">Help Center</Link><Link to="/contact">Contact & support</Link><Link to="/legal/terms">Terms</Link><Link to="/legal/privacy">Privacy</Link><Link to="/legal/cookies">Cookies</Link></nav></footer>;}
