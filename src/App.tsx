import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ToastContainer } from './components/ui/ToastContainer';

// Public Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';

// Protected Pages
import { Profile } from './pages/Profile';
import { Dashboard } from './pages/Dashboard';
import { BookWizard } from './pages/book/BookWizard';
import { Transparency } from './pages/Transparency';
import { Billing } from './pages/Billing';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/transparency" element={<Transparency />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/books" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/settings" element={<Profile />} />
            <Route path="/book/:id" element={<BookWizard />} />
          </Route>
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
