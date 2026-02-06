
import React, { useState, useEffect } from 'react';

export const ScrollButton: React.FC = () => {
  const [showButton, setShowButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after 200px
      const scrolled = window.scrollY > 200;
      setShowButton(scrolled);
      
      // Check if we are closer to the bottom or top to decide arrow direction
      // Threshold: if we are past the middle of the document
      const isPastHalf = window.scrollY > (document.documentElement.scrollHeight - window.innerHeight) / 2;
      setIsAtBottom(isPastHalf);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToAnchor = () => {
    if (isAtBottom) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Scroll to the control panel area roughly
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  if (!showButton) return null;

  return (
    <button
      onClick={scrollToAnchor}
      className="fixed bottom-8 right-8 z-[100] p-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-white/20 backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 group overflow-hidden"
      aria-label={isAtBottom ? "Scroll to Top" : "Scroll to Controls"}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className={`transition-transform duration-500 ${isAtBottom ? 'rotate-0' : 'rotate-180'}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 15.75l7.5-7.5 7.5 7.5"
          />
        </svg>
      </div>
      
      {/* Tooltip on hover */}
      <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 text-cyan-400 text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700 pointer-events-none">
        {isAtBottom ? 'Results' : 'Controls'}
      </span>
    </button>
  );
};
