import {createRoot} from 'react-dom/client';
import {BookTwoExtrapolator} from './book-two/BookTwoExtrapolator';
import './book-two/book-two.css';
const root=document.getElementById('book-two-root');
if(root)createRoot(root).render(<BookTwoExtrapolator/>);
