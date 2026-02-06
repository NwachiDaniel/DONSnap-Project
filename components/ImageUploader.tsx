
import React, { useCallback } from 'react';
import { UploadIcon } from './Icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  onImagesUpload?: (files: File[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, onImagesUpload }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (onImagesUpload) {
        onImagesUpload(Array.from(files));
      } else {
        onImageUpload(files[0]);
      }
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      if (onImagesUpload) {
        onImagesUpload(files);
      } else {
        onImageUpload(files[0]);
      }
    }
  }, [onImageUpload, onImagesUpload]);

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="w-full h-full bg-slate-800/50 rounded-2xl flex items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-cyan-500 hover:bg-slate-800 transition-colors duration-300">
      <label
        htmlFor="image-upload"
        className="flex flex-col items-center justify-center text-center text-slate-500 cursor-pointer w-full h-full"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <UploadIcon className="w-12 h-12 mb-4" />
        <span className="font-semibold text-slate-300">Click to upload or drag & drop</span>
        <span className="text-sm mt-1">Select one or multiple images</span>
        <span className="text-xs mt-1 text-slate-500">PNG, JPG, or WEBP</span>
        <input
          id="image-upload"
          type="file"
          className="hidden"
          multiple
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};
