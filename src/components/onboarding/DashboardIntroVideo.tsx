import '../../styles/intro-video.css';

export function DashboardIntroVideo() {
  return <section className="puble-dashboard-intro" aria-labelledby="dashboard-intro-title">
    <div className="puble-dashboard-intro-copy">
      <p className="text-xs uppercase tracking-widest text-purple-200">New here?</p>
      <h2 id="dashboard-intro-title" className="text-2xl text-white">Take a tour of PubléStudio.</h2>
      <p className="text-slate-400">Meet PubléStudio and find your way from your first idea to your next chapter. Press Play whenever you’re ready.</p>
    </div>
    <div className="puble-dashboard-video-widget">
      <div className="puble-intro-player">
        <iframe title="PubléStudio Intro" src="https://www.youtube.com/embed/1ehk8a2IEho?autoplay=0&playsinline=1&rel=0" allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      </div>
      <div className="puble-dashboard-video-caption"><span>PubléStudio Intro</span><a href="https://www.youtube.com/watch?v=1ehk8a2IEho" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a></div>
    </div>
  </section>;
}
