import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { getCroppedImg } from '../utils/fileUtils';

interface ImageCropperProps {
  src: string;
  originalFile: File;
  onCropComplete: (file: File) => void;
  onCancel: () => void;
}

const ASPECT_RATIO = 1;
const MIN_DIMENSION = 150;

export const ImageCropper: React.FC<ImageCropperProps> = ({ src, originalFile, onCropComplete, onCancel }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        ASPECT_RATIO,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  };
  
  const handleCrop = async () => {
    if (!imgRef.current || !completedCrop) {
        return;
    }

    setIsProcessing(true);
    try {
        const croppedFile = await getCroppedImg(
            imgRef.current,
            completedCrop,
            `cropped-${originalFile.name}`
        );
        onCropComplete(croppedFile);
    } catch (e) {
        console.error("Cropping failed", e);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4 text-center">Crop Your Image</h2>
        <div className="flex-grow flex items-center justify-center min-h-0">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={ASPECT_RATIO}
            minWidth={MIN_DIMENSION}
            minHeight={MIN_DIMENSION}
            className="max-w-full max-h-[60vh]"
          >
            <img 
                ref={imgRef}
                src={src} 
                alt="Image to crop" 
                onLoad={onImageLoad}
                className="max-h-[60vh] object-contain"
            />
          </ReactCrop>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button 
            onClick={onCancel}
            disabled={isProcessing}
            className="px-6 py-2 bg-slate-700 text-slate-200 rounded-lg font-semibold hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            disabled={!completedCrop || isProcessing}
            className="px-6 py-2 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Crop Image'}
          </button>
        </div>
      </div>
    </div>
  );
};