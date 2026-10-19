import { useEffect, useState } from 'react';

const WORDS = ['story.', 'voice.', 'book.'];

export function TypewriterHeadline() {
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [frame, setFrame] = useState({ word: 0, count: WORDS[0].length, deleting: false });

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const complete = frame.count === WORDS[frame.word].length;
    const delay = frame.deleting ? (frame.count === 0 ? 300 : 65) : (complete ? 1800 : 115);
    const timeout = window.setTimeout(() => {
      setFrame(current => {
        if (current.deleting) {
          return current.count === 0
            ? { word: (current.word + 1) % WORDS.length, count: 0, deleting: false }
            : { ...current, count: current.count - 1 };
        }
        return current.count === WORDS[current.word].length
          ? { ...current, deleting: true }
          : { ...current, count: current.count + 1 };
      });
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [frame, reducedMotion]);

  return <h1 className="welcome-typewriter" aria-label="Your story. Your voice. Your book.">
    <span aria-hidden="true" className="welcome-typewriter-fixed">Your</span>
    <span aria-hidden="true" className="welcome-typewriter-line">
      {reducedMotion ? 'book.' : WORDS[frame.word].slice(0, frame.count)}
      {!reducedMotion && <span className="welcome-typewriter-caret" />}
    </span>
  </h1>;
}
