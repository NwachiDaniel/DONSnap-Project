
import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentDate = new Date().toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <footer className="w-full max-w-7xl mx-auto mt-12 mb-8 px-4">
      <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center md:items-start">
          <p className="text-slate-500 text-sm font-medium">
            &copy; {currentYear} <span className="text-cyan-500 font-bold">HomeLand Technologies</span>
          </p>
          <p className="text-slate-600 text-[10px] uppercase tracking-[0.2em] mt-1">
            Precision AI Engineering
          </p>
        </div>
        
        <div className="flex flex-col items-center md:items-end">
          <p className="text-slate-500 text-xs font-mono">
            {currentDate}
          </p>
          <div className="flex gap-4 mt-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="w-2 h-2 rounded-full bg-slate-700"></span>
          </div>
        </div>
      </div>
    </footer>
  );
};
