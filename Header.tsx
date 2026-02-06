import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full max-w-7xl mx-auto mb-8 px-4">
      <div className="flex flex-col items-center gap-2">
        <img src="/logo.png" alt="DONSnap Logo" className="h-32 w-32 object-contain drop-shadow-lg" />
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            DONSnap Enhancer
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Enhance, Analyze, and Transform your Images with Advanced AI
          </p>
        </div>
      </div>
    </header>
  );
};
