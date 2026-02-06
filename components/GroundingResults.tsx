
import React from 'react';

interface GroundingResultsProps {
  text: string;
  sources: any[];
}

export const GroundingResults: React.FC<GroundingResultsProps> = ({ text, sources }) => {
  const webLinks = sources.filter(s => s.web).map(s => s.web);
  const mapLinks = sources.filter(s => s.maps).map(s => s.maps);

  return (
    <div className="mt-6 p-6 bg-slate-800/80 rounded-2xl border border-cyan-500/30">
      <div className="prose prose-invert max-w-none mb-6">
        <p className="text-lg leading-relaxed">{text}</p>
      </div>

      {webLinks.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Sources</h4>
          <div className="flex flex-wrap gap-2">
            {webLinks.map((link, i) => (
              <a key={i} href={link.uri} target="_blank" rel="noopener noreferrer" 
                 className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-full text-xs text-cyan-400 transition-colors">
                {link.title || 'Source'}
              </a>
            ))}
          </div>
        </div>
      )}

      {mapLinks.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Nearby Locations</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mapLinks.map((place, i) => (
              <a key={i} href={place.uri} target="_blank" rel="noopener noreferrer" 
                 className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex flex-col transition-colors">
                <span className="font-bold text-slate-100">{place.title}</span>
                <span className="text-xs text-cyan-400">View on Maps →</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
