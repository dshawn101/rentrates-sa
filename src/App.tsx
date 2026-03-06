import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Transparency from './pages/Transparency';
import BookWizard from './pages/book/BookWizard';
import Profile from './pages/Profile';

function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center gap-6">
      <h1 className="text-5xl font-bold text-accent">OpenBook Builder</h1>
      <p className="text-2xl text-secondary">Transparent AI Book Creation Platform</p>
      <a href="/auth/signup" className="bg-accent text-white px-8 py-4 rounded-lg font-bold hover:bg-emerald-600 transition shadow-lg mt-8">
        Start Writing Now
      </a>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transparency" element={<Transparency />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/book/new" element={<BookWizard />} />
          <Route path="/book/:id" element={<BookWizard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
