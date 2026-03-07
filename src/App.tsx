import './styles/global.css'

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative">
      <div className="glass-card p-12 max-w-2xl w-full text-center relative z-10">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-primary mb-6">
          Puble Studio
        </h1>
        <p className="text-xl text-white/80 mb-8 leading-relaxed">
          The transparent, author-centric, lean, and beautiful AI book creation platform.
        </p>

        <div className="flex gap-4 justify-center">
          <button className="glass-button w-48 text-lg">
            Get Started
          </button>
          <input className="glass-input w-64" placeholder="Enter your email..." />
        </div>
      </div>
    </div>
  )
}

export default App
