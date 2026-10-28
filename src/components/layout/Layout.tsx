import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useBookStore } from '../../store/useBookStore';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function Layout({ children, showSidebar = true }: LayoutProps) {
  const { user } = useAuth();
  const fetchBooks = useBookStore(state => state.fetchBooks);
  useEffect(() => {
    useBookStore.getState().reset();
    if (user?.id) void fetchBooks();
    return () => { useBookStore.getState().reset(); };
  }, [user?.id, fetchBooks]);
  return (
    <div className="h-dvh bg-[#0f0c1b] text-slate-100 flex overflow-hidden">
      {showSidebar && <Sidebar />}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col relative w-full overflow-hidden">
        <Header />
        <main data-route-scroll className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
