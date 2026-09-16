import React, { useState, useEffect } from 'react';

export const ESOTERIC_QUOTES = [
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
  { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
  { text: "It is the mark of an educated mind to be able to entertain a thought without accepting it.", author: "Aristotle" },
  { text: "Silence is a source of Great Strength.", author: "Lao Tzu" },
  { text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", author: "Rumi" },
  { text: "Wisdom begins in wonder.", author: "Socrates" },
  { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { text: "What you seek is seeking you.", author: "Rumi" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "Count your age by friends, not years. Count your life by smiles, not tears.", author: "John Lennon" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "He who knows, does not speak. He who speaks, does not know.", author: "Lao Tzu" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Be happy for this moment. This moment is your life.", author: "Omar Khayyam" },
  { text: "Mastering others is strength. Mastering yourself is true power.", author: "Lao Tzu" },
  { text: "The measure of intelligence is the ability to change.", author: "Albert Einstein" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
  { text: "Knowledge speaks, but wisdom listens.", author: "Jimi Hendrix" },
  { text: "Everything has beauty, but not everyone sees it.", author: "Confucius" }
];

interface EsotericWisdomFooterProps {
  onOpenAbout?: () => void;
}

export const EsotericWisdomFooter: React.FC<EsotericWisdomFooterProps> = ({ onOpenAbout }) => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Auto-rotate every 14 seconds smoothly
  useEffect(() => {
    const timer = setInterval(() => {
      nextQuote();
    }, 14000);
    return () => clearInterval(timer);
  }, []);

  const changeQuote = (newIdx: number) => {
    setFade(false);
    setTimeout(() => {
      setIndex(newIdx);
      setFade(true);
    }, 200);
  };

  const nextQuote = () => {
    setFade(false);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % ESOTERIC_QUOTES.length);
      setFade(true);
    }, 200);
  };

  const prevQuote = () => {
    setFade(false);
    setTimeout(() => {
      setIndex((prev) => (prev - 1 + ESOTERIC_QUOTES.length) % ESOTERIC_QUOTES.length);
      setFade(true);
    }, 200);
  };

  const randomQuote = () => {
    setFade(false);
    setTimeout(() => {
      let next;
      do {
        next = Math.floor(Math.random() * ESOTERIC_QUOTES.length);
      } while (next === index && ESOTERIC_QUOTES.length > 1);
      setIndex(next);
      setFade(true);
    }, 200);
  };

  const current = ESOTERIC_QUOTES[index];

  return (
    <footer className="w-full border-t border-zinc-900/60 pt-3 pb-3 mt-3 flex flex-col items-center justify-between text-zinc-400 shrink-0 gap-2 font-google-sans select-text">
      {/* Header Label: Esoteric Wisdom */}
      <div className="w-full max-w-2xl px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <span className="text-[10px] uppercase font-mono font-bold tracking-[0.2em] text-[#DC143C]">
            Esoteric Wisdom
          </span>
          <span className="text-[9px] font-mono text-zinc-600">
            {index + 1} / {ESOTERIC_QUOTES.length}
          </span>
        </div>

        {/* Dynamic Quote Display */}
        <div 
          onClick={nextQuote}
          className="cursor-pointer group py-1 transition-all duration-200"
          title="Click to cycle quote"
        >
          <p className={`text-xs sm:text-[13px] text-zinc-300 italic leading-relaxed transition-opacity duration-200 ${fade ? 'opacity-100' : 'opacity-0'}`}>
            "{current.text}"
          </p>
          <p className={`text-[10px] font-mono font-bold text-zinc-500 mt-1 uppercase tracking-wider transition-opacity duration-200 ${fade ? 'opacity-100' : 'opacity-0'}`}>
            — {current.author}
          </p>
        </div>

        {/* Text-Only Navigation Controls */}
        <div className="flex items-center justify-center gap-4 mt-2 text-[9px] font-mono uppercase tracking-wider text-zinc-500">
          <button
            onClick={prevQuote}
            className="hover:text-zinc-200 transition-colors cursor-pointer bg-transparent border-none p-0 outline-none"
          >
            Previous
          </button>
          <span className="text-zinc-800">|</span>
          <button
            onClick={randomQuote}
            className="hover:text-zinc-200 transition-colors cursor-pointer bg-transparent border-none p-0 outline-none"
          >
            Random
          </button>
          <span className="text-zinc-800">|</span>
          <button
            onClick={nextQuote}
            className="hover:text-zinc-200 transition-colors cursor-pointer bg-transparent border-none p-0 outline-none"
          >
            Next
          </button>
        </div>
      </div>

      {/* Rights & About Link */}
      {onOpenAbout && (
        <div className="mt-1">
          <button
            onClick={onOpenAbout}
            className="text-[9px] font-mono tracking-widest text-zinc-600 hover:text-[#DC143C] transition-colors cursor-pointer uppercase border-b border-transparent hover:border-[#DC143C]/40 pb-0.5"
          >
            All rights reserved "Left Hand Products LLC" 2026
          </button>
        </div>
      )}
    </footer>
  );
};
