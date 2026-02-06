import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { enhanceImage, searchGrounding, mapsGrounding, animateImage } from './services/geminiService';
import { fileToGenerativePart, fileToDataURL, dataURLtoFile, rotateImage } from './utils/fileUtils';
import { ImageUploader } from './components/ImageUploader';
import { ImageViewer } from './components/ImageViewer';
import { ControlPanel } from './ControlPanel';
import { Header } from './Header';
import { Footer } from './components/Footer';
import { ImageCropper } from './components/ImageCropper';
import { LoaderIcon, SparklesIcon, MagicWandIcon, DownloadIcon, GifIcon } from './components/Icons';
import { LiveAssistant } from './components/LiveAssistant';
import { GroundingResults } from './components/GroundingResults';
import { ImageComparisonSlider } from './components/ImageComparisonSlider';
import { ScrollButton } from './components/ScrollButton';
import gifshot from 'gifshot';

type ImageFile = { file: File; preview: string; id: string; };
type EnhancedResult = { id: string; dataUrl: string; };
type GroundingData = { text: string; sources: any[]; } | null;
export type QualityLevel = 'low' | 'medium' | 'high';

const STORAGE_KEY = 'donsnap_session_settings_v2';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [editHistory, setEditHistory] = useState<Record<string, string[]>>({});
  const [historyIndex, setHistoryIndex] = useState<Record<string, number>>({});
  
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  
  const [animatedVideo, setAnimatedVideo] = useState<string | null>(null);
  const [grounding, setGrounding] = useState<GroundingData>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGifProcessing, setIsGifProcessing] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState<{ message: string; type: 'error' | 'warning' } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<ImageFile | null>(null);

  // Enhancement States
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [quality, setQuality] = useState<QualityLevel>('medium');
  const [selectedBg, setSelectedBg] = useState<string | null>(null);
  const [frameThickness, setFrameThickness] = useState(0);
  const [frameColor, setFrameColor] = useState('#ffffff');
  
  const [animationAspectRatio, setAnimationAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  // Load session settings on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (typeof settings.brightness === 'number') setBrightness(settings.brightness);
        if (typeof settings.contrast === 'number') setContrast(settings.contrast);
        if (typeof settings.saturation === 'number') setSaturation(settings.saturation);
        if (['low', 'medium', 'high'].includes(settings.quality)) setQuality(settings.quality);
        if (settings.selectedBg === null || typeof settings.selectedBg === 'string') setSelectedBg(settings.selectedBg);
        if (typeof settings.frameThickness === 'number') setFrameThickness(settings.frameThickness);
        if (typeof settings.frameColor === 'string') setFrameColor(settings.frameColor);
      } catch (e) {
        console.error("Failed to load saved session", e);
      }
    }
  }, []);

  // Auto-save settings on change
  useEffect(() => {
    const settings = {
      brightness,
      contrast,
      saturation,
      quality,
      selectedBg,
      frameThickness,
      frameColor
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [brightness, contrast, saturation, quality, selectedBg, frameThickness, frameColor]);

  const selectedImage = images.find(img => img.id === selectedImageId) || images[0];
  
  const currentHistory = selectedImageId ? (editHistory[selectedImageId] || []) : [];
  const currentIndex = selectedImageId ? (historyIndex[selectedImageId] ?? -1) : -1;
  const selectedResultUrl = currentIndex >= 0 ? currentHistory[currentIndex] : null;

  const processedCount = useMemo(() => {
    return Object.keys(editHistory).filter(id => (historyIndex[id] ?? -1) >= 0).length;
  }, [editHistory, historyIndex]);

  const pushToHistory = (id: string, dataUrl: string) => {
    setEditHistory(prev => {
      const stack = prev[id] || [];
      const index = historyIndex[id] ?? -1;
      const newStack = [...stack.slice(0, index + 1), dataUrl];
      return { ...prev, [id]: newStack };
    });
    setHistoryIndex(prev => ({ ...prev, [id]: (prev[id] ?? -1) + 1 }));
  };

  const handleUndo = useCallback(() => {
    if (!selectedImageId) return;
    setHistoryIndex(prev => {
      const currentIdx = prev[selectedImageId] ?? -1;
      if (currentIdx > 0) return { ...prev, [selectedImageId]: currentIdx - 1 };
      return prev;
    });
  }, [selectedImageId]);

  const handleRedo = useCallback(() => {
    if (!selectedImageId) return;
    setHistoryIndex(prev => {
      const currentIdx = prev[selectedImageId] ?? -1;
      const stack = editHistory[selectedImageId] || [];
      if (currentIdx < stack.length - 1) return { ...prev, [selectedImageId]: currentIdx + 1 };
      return prev;
    });
  }, [selectedImageId, editHistory]);

  const processImage = async (image: ImageFile, p: string) => {
    try {
      const part = await fileToGenerativePart(image.file);
      const instructions = [];
      
      if (brightness !== 0) instructions.push(`brightness: ${brightness > 0 ? '+' : ''}${brightness}%`);
      if (contrast !== 0) instructions.push(`contrast: ${contrast > 0 ? '+' : ''}${contrast}%`);
      if (saturation !== 0) instructions.push(`saturation: ${saturation > 0 ? '+' : ''}${saturation}%`);
      if (selectedBg) instructions.push(`Replace the background with ${selectedBg}.`);
      if (frameThickness > 0) instructions.push(`Add a solid ${frameColor} border frame with ${frameThickness} pixel thickness around the outer edge of the image.`);
      
      const qualityMap: Record<QualityLevel, string> = {
        low: "Keep it simple and fast.",
        medium: "Balance detail and natural appearance.",
        high: "Produce professional, high-fidelity results with intricate detail enhancement and noise reduction."
      };

      let compositePrompt = p;
      const instructionString = `Apply these specific adjustments: ${instructions.join(', ')}. Target quality: ${qualityMap[quality]}`;
      compositePrompt = p ? `${instructionString} Additionally, execute this edit: ${p}` : instructionString;

      const res = await enhanceImage(part, compositePrompt);
      return { id: image.id, dataUrl: `data:image/jpeg;base64,${res}` };
    } catch (err: any) {
      throw err;
    }
  };

  const handleEnhance = useCallback(async (p: string) => {
    if (images.length === 0) return;
    setIsLoading(true);
    setError(null);
    
    try {
      if (images.length > 1) {
        for (let i = 0; i < images.length; i++) {
          setLoadingMsg(`AI Batch Analysis (${i + 1}/${images.length})...`);
          const result = await processImage(images[i], p);
          pushToHistory(result.id, result.dataUrl);
        }
      } else {
        setLoadingMsg('AI Reasoning & Rendering...');
        const result = await processImage(images[0], p);
        pushToHistory(result.id, result.dataUrl);
        setSelectedImageId(result.id);
      }
    } catch (e: any) {
      setError({ message: e.message || 'An unexpected error occurred during enhancement.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [images, brightness, contrast, saturation, selectedBg, quality, frameThickness, frameColor]);

  const handleRotateImage = useCallback(async (direction: 'cw' | 'ccw') => {
    if (!selectedImageId || !selectedImage) return;
    setIsLoading(true);
    setLoadingMsg('Rotating Image...');
    try {
      const rotatedFile = await rotateImage(selectedImage.file, direction === 'cw' ? 90 : -90);
      const updatedImage = {
        ...selectedImage,
        file: rotatedFile,
        preview: URL.createObjectURL(rotatedFile)
      };
      setImages(prev => prev.map(img => img.id === selectedImageId ? updatedImage : img));
    } catch (e: any) {
      setError({ message: e.message || 'Rotation failed.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedImageId, selectedImage]);

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = useCallback(() => {
    if (!selectedResultUrl) return;
    triggerDownload(selectedResultUrl, `DONSnap_${quality}_${Date.now()}.jpg`);
  }, [selectedResultUrl, quality]);

  const handleDownloadAll = useCallback(async () => {
    const resultsToDownload: { url: string; id: string }[] = [];
    images.forEach(img => {
      const idx = historyIndex[img.id];
      const stack = editHistory[img.id];
      if (idx !== undefined && idx >= 0 && stack) {
        resultsToDownload.push({ url: stack[idx], id: img.id });
      }
    });

    if (resultsToDownload.length === 0) return;

    for (let i = 0; i < resultsToDownload.length; i++) {
      const item = resultsToDownload[i];
      await new Promise(r => setTimeout(r, i * 200));
      triggerDownload(item.url, `DONSnap_Batch_${i + 1}_${item.id.slice(0, 4)}.jpg`);
    }
  }, [images, editHistory, historyIndex]);

  const handleExportGif = useCallback(async () => {
    if (!animatedVideo) return;
    setIsGifProcessing(true);
    
    try {
      gifshot.createGIF({
        video: [animatedVideo],
        numFrames: 24,
        interval: 0.1,
        gifWidth: 480,
        gifHeight: animationAspectRatio === '16:9' ? 270 : 853,
        sampleInterval: 10,
        progressCallback: (captureProgress: number) => {
            // Can update UI with progress if needed
        }
      }, function (obj: any) {
        if (!obj.error) {
          triggerDownload(obj.image, `DONSnap_Veo_Motion_${Date.now()}.gif`);
        } else {
          setError({ message: "GIF encoding failed: " + obj.error, type: 'error' });
        }
        setIsGifProcessing(false);
      });
    } catch (e: any) {
      setError({ message: "GIF Synthesis Engine error.", type: 'error' });
      setIsGifProcessing(false);
    }
  }, [animatedVideo, animationAspectRatio]);

  const handleSearch = useCallback(async (query: string) => {
    if (!selectedImage) return;
    setIsLoading(true);
    setLoadingMsg('Deep Web Analysis...');
    setGrounding(null);
    setError(null);
    try {
      const part = await fileToGenerativePart(selectedImage.file);
      const res = await searchGrounding(query || 'Identify main objects in this image', part);
      setGrounding(res);
    } catch (e: any) {
      setError({ message: e.message || 'Search failed to connect to grounding tools.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedImage]);

  const handleMaps = useCallback(async (query: string) => {
    if (!selectedImage) return;
    setIsLoading(true);
    setLoadingMsg('Geospatial Mapping...');
    setGrounding(null);
    setError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      const part = await fileToGenerativePart(selectedImage.file);
      const res = await mapsGrounding(query || 'Places of interest nearby', { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, part);
      setGrounding(res);
    } catch (e: any) {
      const msg = e.code === 1 ? "Location access denied. Please enable GPS for map discovery." : (e.message || "Failed to retrieve location data.");
      setError({ message: msg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedImage]);

  const handleAnimate = useCallback(async () => {
    if (!selectedImage) return;
    
    if (!(await (window as any).aistudio.hasSelectedApiKey())) {
      setError({ message: "Veo Animation requires a dedicated API key selection.", type: 'warning' });
      await (window as any).aistudio.openSelectKey();
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMsg('Veo Temporal Synthesis (approx 1-3 mins)...');
    try {
      const part = await fileToGenerativePart(selectedImage.file);
      const url = await animateImage(part, prompt, animationAspectRatio);
      setAnimatedVideo(url);
    } catch (e: any) {
      setError({ message: e.message || 'Animation engine failed to synthesize frames.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedImage, prompt, animationAspectRatio]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleEnhance(prompt);
        } else if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          setIsLiveOpen(prev => !prev);
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          handleSearch(prompt);
        } else if (e.key === 'g' || e.key === 'G') {
          e.preventDefault();
          handleMaps(prompt);
        } else if (e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          if (selectedImage) setImageToCrop(selectedImage);
        } else if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleRedo();
        }
      }

      if (!isInput && images.length > 1) {
        if (e.key === 'ArrowLeft') {
          const currentIndex = images.findIndex(img => img.id === selectedImageId);
          const nextIndex = (currentIndex - 1 + images.length) % images.length;
          setSelectedImageId(images[nextIndex].id);
        } else if (e.key === 'ArrowRight') {
          const currentIndex = images.findIndex(img => img.id === selectedImageId);
          const nextIndex = (currentIndex + 1) % images.length;
          setSelectedImageId(images[nextIndex].id);
        }
      }

      if (e.key === 'Escape') {
        setIsLiveOpen(false);
        setImageToCrop(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prompt, handleEnhance, handleSearch, handleMaps, handleUndo, handleRedo, images, selectedImageId, selectedImage]);

  const onUpload = (files: File[]) => {
    try {
      const newImages = files.map(f => ({
        file: f,
        preview: URL.createObjectURL(f),
        id: Math.random().toString(36).substr(2, 9)
      }));
      setImages(prev => [...prev, ...newImages]);
      if (!selectedImageId && newImages.length > 0) {
        setSelectedImageId(newImages[0].id);
      }
      setError(null);
    } catch (err: any) {
      setError({ message: "Failed to load selected files.", type: 'error' });
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setEditHistory(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
    });
    setHistoryIndex(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
    });
    if (selectedImageId === id) setSelectedImageId(null);
  };

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl+';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 sm:p-8">
      {imageToCrop && (
        <ImageCropper 
          src={imageToCrop.preview}
          originalFile={imageToCrop.file}
          onCropComplete={(f) => { 
            const updated = { ...imageToCrop, file: f, preview: URL.createObjectURL(f) };
            setImages(prev => prev.map(img => img.id === imageToCrop.id ? updated : img));
            setImageToCrop(null); 
          }}
          onCancel={() => setImageToCrop(null)}
        />
      )}
      {isLiveOpen && <LiveAssistant onClose={() => setIsLiveOpen(false)} />}
      <ScrollButton />

      <Header />
      
      <main className="flex-grow flex flex-col items-center gap-10 w-full max-w-7xl mx-auto">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-4 flex flex-col">
            <div className="flex-grow min-h-[400px]">
              {selectedImage ? (
                <div className="h-full relative" title="The current image you are editing.">
                  <ImageViewer title="Current Selection" src={selectedImage.preview} />
                  <button 
                    onClick={() => setImageToCrop(selectedImage)}
                    className="absolute top-10 left-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10 transition-transform active:scale-95"
                    title={`Open Crop Tool (${modKey}K)`}
                  >
                    Crop
                  </button>
                </div>
              ) : (
                <ImageUploader onImageUpload={(f) => onUpload([f])} onImagesUpload={onUpload} />
              )}
            </div>

            {/* Thumbnails Strip */}
            {images.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {images.map(img => (
                    <div key={img.id} className="relative group flex-shrink-0" title={`Switch to image: ${img.file.name}`}>
                      <img 
                        src={img.preview} 
                        onClick={() => setSelectedImageId(img.id)}
                        className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 transition-all ${selectedImageId === img.id ? 'border-cyan-500 scale-105' : 'border-slate-700 hover:border-slate-500'}`}
                      />
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-cyan-500 hover:bg-slate-800 transition-all text-slate-500" title="Upload more images to the batch">
                    <span className="text-xl">+</span>
                    <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => e.target.files && onUpload(Array.from(e.target.files))} />
                  </label>
                </div>
                {images.length > 1 && (
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center">Use Arrow Keys to Navigate</p>
                )}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="w-full aspect-square bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 relative overflow-hidden" title="Interactive comparison of original vs AI results. Hover to see controls.">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4 text-cyan-400">
                <LoaderIcon className="w-16 h-16 animate-spin" />
                <p className="text-xl font-bold animate-pulse text-center">{loadingMsg}</p>
              </div>
            ) : animatedVideo ? (
              <video src={animatedVideo} controls autoPlay loop className="w-full h-full rounded-xl object-contain" />
            ) : selectedResultUrl && selectedImage ? (
              <ImageComparisonSlider original={selectedImage.preview} enhanced={selectedResultUrl} />
            ) : (
              <div className="text-center text-slate-500">
                <SparklesIcon className="w-16 h-16 mx-auto mb-4" />
                <p>AI transformations appear here</p>
                {Object.keys(editHistory).length > 0 && <p className="text-xs mt-2 text-cyan-500/50">Select an image from the tray to see its result</p>}
              </div>
            )}
            {(selectedResultUrl || animatedVideo) && !isLoading && (
              <div className="absolute bottom-6 right-6 z-20 flex flex-wrap justify-end gap-2 max-w-full">
                {animatedVideo && (
                    <button
                        onClick={handleExportGif}
                        disabled={isGifProcessing}
                        title="Compile and download as GIF"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 text-white font-bold rounded-full shadow-xl transition-all border border-indigo-400/30"
                    >
                        {isGifProcessing ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <GifIcon className="w-5 h-5" />}
                        <span className="whitespace-nowrap">{isGifProcessing ? 'Encoding...' : 'Export GIF'}</span>
                    </button>
                )}
                {selectedResultUrl && (
                  <>
                    {processedCount > 1 && (
                      <button
                        onClick={handleDownloadAll}
                        title="Download all processed images from this batch"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full shadow-xl transition-all border border-slate-500"
                      >
                        <div className="relative">
                          <DownloadIcon className="w-5 h-5" />
                          <DownloadIcon className="w-5 h-5 absolute -top-1 -right-1 opacity-50 scale-75" />
                        </div>
                        <span className="whitespace-nowrap">Download All ({processedCount})</span>
                      </button>
                    )}
                    <button
                      onClick={handleDownload}
                      title="Download the current enhanced image"
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-full shadow-xl transition-all"
                    >
                      <DownloadIcon className="w-5 h-5" />
                      <span className="whitespace-nowrap">Download</span>
                    </button>
                  </>
                )}
                <button onClick={() => { 
                  if (animatedVideo) setAnimatedVideo(null);
                  else {
                      setEditHistory(prev => ({ ...prev, [selectedImageId!]: [] }));
                      setHistoryIndex(prev => ({ ...prev, [selectedImageId!]: -1 }));
                  }
                }} className="p-3 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors text-white shadow-xl leading-none font-bold text-xl" title="Clear current result">
                  &times;
                </button>
              </div>
            )}
          </div>
        </div>

        {grounding && <GroundingResults text={grounding.text} sources={grounding.sources} />}

        <div className="w-full max-w-4xl space-y-6">
          <ControlPanel
            prompt={prompt}
            setPrompt={setPrompt}
            onEnhance={handleEnhance}
            onRotate={handleRotateImage}
            isLoading={isLoading}
            onSaveSession={() => {}}
            brightness={brightness}
            setBrightness={setBrightness}
            contrast={contrast}
            setContrast={setContrast}
            saturation={saturation}
            setSaturation={setSaturation}
            quality={quality}
            setQuality={setQuality}
            frameThickness={frameThickness}
            setFrameThickness={setFrameThickness}
            frameColor={frameColor}
            setFrameColor={setFrameColor}
            animationAspectRatio={animationAspectRatio}
            setAnimationAspectRatio={setAnimationAspectRatio}
            onAnimate={handleAnimate}
            hasSelection={!!selectedImage}
            selectedBg={selectedBg}
            setSelectedBg={setSelectedBg}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={currentIndex > 0}
            canRedo={currentIndex < currentHistory.length - 1}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => handleEnhance('Identify and remove distracting elements, secondary people, or background clutter to isolate the subject.')} 
              disabled={isLoading || images.length === 0} 
              className="flex flex-col items-center justify-center gap-1 py-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all font-bold disabled:opacity-50"
              title="Quickly remove background distractions"
            >
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">✨</span> Magic Eraser
              </div>
              <span className="text-[10px] text-slate-500 opacity-60">Smart Removal</span>
            </button>
            <button 
              onClick={() => handleSearch(prompt)} 
              disabled={isLoading || !selectedImage} 
              className="flex flex-col items-center justify-center gap-1 py-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all font-bold disabled:opacity-50"
              title="Get AI insights about objects in the image"
            >
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">🔍</span> Smart Search
              </div>
              <span className="text-[10px] text-slate-500 opacity-60">{modKey}S</span>
            </button>
            <button 
              onClick={() => handleMaps(prompt)} 
              disabled={isLoading || !selectedImage} 
              className="flex flex-col items-center justify-center gap-1 py-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all font-bold disabled:opacity-50"
              title="Discover locations shown in this image"
            >
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">📍</span> Map Discovery
              </div>
              <span className="text-[10px] text-slate-500 opacity-60">{modKey}G</span>
            </button>
            <button 
              onClick={() => setIsLiveOpen(true)} 
              className="flex flex-col items-center justify-center gap-1 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl hover:from-cyan-500 hover:to-blue-500 transition-all font-bold shadow-lg"
              title="Talk to the AI assistant for complex instructions"
            >
              <div className="flex items-center gap-2">
                <span className="text-white">🎙️</span> Voice AI
              </div>
              <span className="text-[10px] text-white/60">{modKey}L</span>
            </button>
          </div>
        </div>
      </main>
      
      <Footer />

      {error && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-4 max-w-md w-full animate-bounce-in ${error.type === 'error' ? 'bg-red-600 border border-red-400 text-white' : 'bg-orange-500 border border-orange-300 text-white'}`}>
          <div className="flex-grow">
            <p className="font-bold text-sm uppercase tracking-wider mb-0.5">{error.type === 'error' ? 'Critical Error' : 'Attention Required'}</p>
            <p className="text-sm opacity-90">{error.message}</p>
          </div>
          <button onClick={() => setError(null)} className="p-2 hover:bg-black/10 rounded-full transition-colors font-bold text-xl">&times;</button>
        </div>
      )}
    </div>
  );
};

export default App;