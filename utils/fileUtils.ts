
import { Part } from "@google/genai";
import { PixelCrop } from 'react-image-crop';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit for Gemini
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

export const fileToGenerativePart = async (file: File): Promise<Part> => {
  // Validation
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 20MB.`);
  }
  
  if (!SUPPORTED_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Please use JPEG, PNG, or WebP.`);
  }

  try {
    const base64EncodedData = await fileToBase64(file);
    return {
      inlineData: {
        data: base64EncodedData,
        mimeType: file.type,
      },
    };
  } catch (err) {
    throw new Error("Failed to read image file. It might be corrupted.");
  }
};

export const fileToDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export const dataURLtoFile = async (dataUrl: string, filename: string): Promise<File> => {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  } catch (err) {
    throw new Error("Failed to convert image data back to file.");
  }
};

export const rotateImage = async (file: File, degrees: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));

      const is90 = Math.abs(degrees) % 180 === 90;
      canvas.width = is90 ? img.height : img.width;
      canvas.height = is90 ? img.width : img.height;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Rotation failed'));
        resolve(new File([blob], file.name, { type: file.type }));
      }, file.type, 0.95);
    };
    img.onerror = reject;
  });
};

export const getCroppedImg = (
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return reject(new Error('Could not get canvas context for cropping.'));
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = crop.width * scaleX * pixelRatio;
    canvas.height = crop.height * scaleY * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY,
    );
      
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return reject(new Error('Cropping resulted in empty image.'));
        }
        resolve(new File([blob], fileName, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.95, // high quality
    );
  });
};
