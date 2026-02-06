import React from 'react';
import { 
  MagicWandIcon, 
  VideoIcon, 
  UndoIcon, 
  RedoIcon, 
  RotateCwIcon, 
  RotateCcwIcon, 
  FrameIcon, 
  SparklesIcon, 
  SunIcon, 
  ContrastIcon, 
  SaturationIcon, 
  TrashIcon, 
  LayersIcon, 
  QualityIcon 
} from './components/Icons';
import { QualityLevel } from './App';

interface ControlPanelProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onEnhance: (prompt: string) => void;
  onRotate: (direction: 'cw' | 'ccw') => void;
  isLoading: boolean;
  onSaveSession: () => void;
  brightness: number;
  setBrightness: (v: number) => void;
  contrast: number;
  setContrast: (v: number) => void;
  saturation: number;
  setSaturation: (v: number) => void;
  quality: QualityLevel;
  setQuality: (q: QualityLevel) => void;
  frameThickness: number;
  setFrameThickness: (v: number) => void;
  frameColor: string;
  setFrameColor: (c: string) => void;
  animationAspectRatio: '16:9' | '9:16';
  setAnimationAspectRatio: (v: '16:9' | '9:16') => void;
  onAnimate: () => void;
  hasSelection: boolean;
  selectedBg: string | null;
  setSelectedBg: (bg: string | null) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const presets = [
  { name: 'Sharpen', prompt: 'Improve lighting and sharpen details' },
  { name: 'Vibrant', prompt: 'Increase color vibrancy and saturation' },
  { name: 'Cinematic', prompt: 'Apply a cinematic, movie-like color grade' },
  { name: 'Retro Film', prompt: 'Add a retro 90s film filter with grain and warm colors' },
  { name: 'B&W', prompt: 'Convert to a high-contrast black and white photograph' },
  { name: 'Dreamy', prompt: 'Add a soft, dreamy glow to the image' },
  { name: 'Object Eraser', prompt: 'Identify and remove the primary person or distracting objects from the background seamlessly' },
  { name: 'Dramatic Sky', prompt: 'Replace the sky with a dramatic, moody sunset' },
];

const bgOptions = [
  { name: 'Original', value: null, class: 'bg-slate-700' },
  { name: 'White', value: 'solid white', class: 'bg-white' },
  { name: 'Black', value: 'solid black', class: 'bg-black' },
  { name: 'Red', value: 'solid red', class: 'bg-red-500' },
  { name: 'Blue', value: 'solid blue', class: 'bg-blue-500' },
  { name: 'Emerald', value: 'solid emerald green', class: 'bg-emerald-500' },
  { name: 'Sunset', value: 'a warm orange to pink sunset gradient', class: 'bg-gradient-to-tr from-orange-400 to-pink-500' },
  { name: 'Ocean', value: 'a deep blue to cyan ocean gradient', class: 'bg-gradient-to-tr from-blue-600 to-cyan-400' },
  { name: 'Cyber', value: 'a neon purple to electric blue gradient', class: 'bg-gradient-to-tr from-purple-600 to-blue-500' },
  { name: 'Lavender', value: 'a soft lavender and pink pastel gradient', class: 'bg-gradient-to-tr from-purple-300 to-pink-300' },
  { name: 'Forest', value: 'a deep forest green and moss gradient', class: 'bg-gradient-to-tr from-green-800 to-emerald-600' },
  { name: 'Gold', value: 'a luxury gold and amber gradient', class: 'bg-gradient-to-tr from-yellow-400 to-amber-600' },
  { name: 'Midnight', value: 'a dark midnight blue and deep purple gradient', class: 'bg-gradient-to-tr from-slate-900 to-indigo-900' },
];

const frameColors = [
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#000000' },
  { name: 'Gold', value: '#ffd700' },
  { name: 'Silver', value: '#c0c0c0' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Cyan', value: '#06b6d4' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  prompt, setPrompt, onEnhance, onRotate, isLoading,
  brightness, setBrightness, contrast, setContrast, saturation, setSaturation,
  quality, setQuality, frameThickness, setFrameThickness, frameColor, setFrameColor,
  animationAspectRatio, setAnimationAspectRatio, onAnimate, hasSelection,
  selectedBg, setSelectedBg, onUndo, onRedo, canUndo, canRedo
}) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl+';

  const handlePresetClick = (presetPrompt: string) => {
    setPrompt(presetPrompt);
    onEnhance(presetPrompt);
  };
  
  const handleCustomEnhance = (e: React.FormEvent) => {
    e.preventDefault();
    onEnhance(prompt.trim());
  };

  const handleAutoEnhance = () => {
    setBrightness(5);
    setContrast(5);
    setSaturation(5);
    const autoPrompt = 'Apply intelligent auto-enhancements to improve image quality, balancing brightness, contrast, and saturation for a natural look.';
    setPrompt(autoPrompt);
    onEnhance(autoPrompt);
  };

  const resetSettings = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setSelectedBg(null);
    setQuality('medium');
    setFrameThickness(0);
    setPrompt('');
    localStorage.removeItem('donsnap_session_settings_v2');
  };

  const Slider = ({ label, value, min, max, onChange, icon: Icon, step = 1 }: { label: string, value: number, min: number, max: number, onChange: (v: number) => void, icon?: any, step?: number }) => (
    <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
      <div className="flex justify-between items-center text-xs font-medium text-slate-400">
        <label className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
        </label>
        <span className={value !== 0 ? "text-cyan-400" : ""}>{value > 0 ? `+${value}` : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        disabled={isLoading}
      />
    </div>
  );

  return (
    <div className="w-full max-w-4xl bg-slate-800/50 rounded-2xl p-6 shadow-lg border border-slate-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col">
          <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
            <MagicWandIcon className="w-6 h-6" /> Enhancement & Editing
          </h3>
          <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Session Auto-Saved</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAutoEnhance}
            disabled={isLoading || !hasSelection}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-bold hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
          >
            <SparklesIcon className="w-4 h-4" />
            Auto-Enhance
          </button>
          
          <div className="flex bg-slate-900/40 rounded-lg p-1 border border-slate-700">
            <button
              onClick={onUndo}
              disabled={isLoading || !canUndo}
              title={`Undo (${modKey}Z)`}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <UndoIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onRedo}
              disabled={isLoading || !canRedo}
              title={`Redo (${modKey}Shift+Z)`}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <RedoIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex bg-slate-900/40 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => onRotate('ccw')}
              disabled={isLoading || !hasSelection}
              title="Rotate Counter-Clockwise"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <RotateCcwIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onRotate('cw')}
              disabled={isLoading || !hasSelection}
              title="Rotate Clockwise"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <RotateCwIcon className="w-5 h-5" />
            </button>
          </div>
          <button
              onClick={resetSettings}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-sm font-medium hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
              title="Reset current adjustments"
            >
              <TrashIcon className="w-4 h-4" />
              Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Slider label="Brightness" icon={SunIcon} value={brightness} min={-100} max={100} onChange={setBrightness} />
        <Slider label="Contrast" icon={ContrastIcon} value={contrast} min={-100} max={100} onChange={setContrast} />
        <Slider label="Saturation" icon={SaturationIcon} value={saturation} min={-100} max={100} onChange={setSaturation} />
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-cyan-400" />
            Custom Background Replacement
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {bgOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedBg(opt.value)}
                className={`flex-shrink-0 w-12 h-12 rounded-full border-2 transition-all ${selectedBg === opt.value ? 'border-cyan-400 scale-110 ring-4 ring-cyan-400/20' : 'border-transparent hover:scale-105'} ${opt.class}`}
                title={opt.name}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <FrameIcon className="w-4 h-4 text-cyan-400" />
              Frame & Quality
            </label>
            <div className="flex items-center gap-4">
               <div className="flex-grow">
                 <Slider label="Border" value={frameThickness} min={0} max={100} onChange={setFrameThickness} />
               </div>
               <div className="flex gap-1">
                 {frameColors.map((c, i) => (
                   <button 
                     key={i}
                     onClick={() => setFrameColor(c.value)}
                     className={`w-5 h-5 rounded-sm border ${frameColor === c.value ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-800' : 'border-slate-600'}`}
                     style={{ backgroundColor: c.value }}
                     title={c.name}
                   />
                 ))}
               </div>
            </div>
            <div className="flex bg-slate-900/50 rounded-xl p-1 border border-slate-700">
              {(['low', 'medium', 'high'] as QualityLevel[]).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize flex items-center justify-center gap-1.5 ${quality === q ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <QualityIcon className="w-3.5 h-3.5" />
                  {q === 'low' ? 'Fast' : q === 'medium' ? 'Balanced' : 'Ultra High'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <VideoIcon className="w-4 h-4 text-blue-400" />
              Video Animation (Veo 3.1)
            </label>
            <div className="flex flex-col gap-3">
              <div className="flex bg-slate-900/50 rounded-xl p-1 border border-slate-700">
                {(['16:9', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAnimationAspectRatio(ratio)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${animationAspectRatio === ratio ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {ratio === '16:9' ? 'Landscape (16:9)' : 'Portrait (9:16)'}
                  </button>
                ))}
              </div>
              <button
                onClick={onAnimate}
                disabled={isLoading || !hasSelection}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all border border-blue-400/30"
              >
                <VideoIcon className="w-5 h-5" />
                Generate Motion Clip
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleCustomEnhance} className="space-y-3">
          <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-cyan-400" />
            AI Logic & Presets
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {presets.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePresetClick(p.prompt)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-300 transition-all border border-slate-600 hover:border-cyan-500/50"
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe specific changes (e.g., 'Make it look like a van gogh painting')"
              className="flex-grow bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !hasSelection}
              className="px-6 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2 whitespace-nowrap"
            >
              {isLoading ? <RotateCwIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
              Apply AI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};