import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RouteScroll } from './components/navigation/RouteScroll';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ToastContainer } from './components/ui/ToastContainer';

import { CookieNotice } from './components/legal/CookieNotice';
import { Legal } from './pages/Legal';
import './styles/legal.css';
import { Pricing } from './pages/Pricing';
import { Features } from './pages/Features';
import { Contact } from './pages/Contact';
import { Welcome } from './pages/Welcome';

// Public Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';

// Protected Pages
import { Profile } from './pages/Profile';
import { MyBooks } from './pages/MyBooks';
import { Dashboard } from './pages/Dashboard';
import { BookWizard } from './pages/book/BookWizard';
import { Transparency } from './pages/Transparency';
import { Billing } from './pages/Billing';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RouteScroll />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/legal/:document" element={<Legal />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/transparency" element={<Transparency />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/books" element={<MyBooks />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/settings" element={<Profile />} />
            <Route path="/book/:id" element={<BookWizard />} />
          </Route>
        </Routes>
        <CookieNotice />
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
