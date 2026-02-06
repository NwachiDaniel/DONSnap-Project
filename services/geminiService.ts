
import { GoogleGenAI, Part, HarmCategory, HarmBlockThreshold } from "@google/genai";

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Parses raw API errors into user-friendly messages
 */
const handleApiError = (error: any, context: string): never => {
  console.error(`Error in ${context}:`, error);
  
  const msg = error?.message?.toLowerCase() || "";
  
  if (msg.includes("api_key_invalid") || msg.includes("api key not valid")) {
    throw new Error("Invalid API Key. Please verify your credentials.");
  }
  if (msg.includes("429") || msg.includes("quota") || msg.includes("rate limit")) {
    throw new Error("Rate limit exceeded. Please wait a few moments before trying again.");
  }
  if (msg.includes("safety") || msg.includes("blocked")) {
    throw new Error("This request was blocked by safety filters. Try modifying your prompt or using a different image.");
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    throw new Error("Network error. Please check your internet connection.");
  }
  if (msg.includes("unsupported_image_format")) {
    throw new Error("This image format is not supported by the AI engine.");
  }

  throw new Error(`AI ${context} failed: ${error.message || "Unknown error occurred"}`);
};

export const enhanceImage = async (imagePart: Part, prompt: string): Promise<string> => {
  const ai = getAI();
  try {
    // Add safety settings to reduce false positives for benign image editing
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ];

    // Refine prompt to clearly state it is a professional photo editing task
    const refinedPrompt = `Task: Professional Image Editing. 
Objective: ${prompt}
Instructions: Perform high-quality pixel-level adjustments while preserving the original content's integrity. If technical sliders are provided, follow them precisely. Return the modified image.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [imagePart, { text: refinedPrompt }],
      },
      config: {
        safetySettings
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    
    // Check for image data first
    for (const part of parts) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
    }
    
    // If no image but text, the model is likely explaining a failure or rejection
    const textPart = parts.find(p => p.text);
    if (textPart?.text) {
      // If it's a "I'm sorry" message, provide a more helpful context
      if (textPart.text.toLowerCase().includes("sorry") || textPart.text.toLowerCase().includes("cannot fulfill")) {
        throw new Error(`The AI was unable to process this specific edit. This can happen with complex background replacements or sensitive subjects. Try a simpler prompt or adjustment.`);
      }
      throw new Error(`AI Response: ${textPart.text}`);
    }
    
    throw new Error('The AI processed the request but did not return a modified image.');
  } catch (error) {
    return handleApiError(error, "Image Enhancement");
  }
};

export const searchGrounding = async (query: string, imagePart?: Part) => {
  const ai = getAI();
  try {
    const contents: any[] = [{ text: query }];
    if (imagePart) contents.unshift(imagePart);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: contents },
      config: { tools: [{ googleSearch: {} }] },
    });

    return {
      text: response.text || "No insights found for this query.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    return handleApiError(error, "Smart Search");
  }
};

export const mapsGrounding = async (query: string, latLng: { latitude: number, longitude: number }, imagePart?: Part) => {
  const ai = getAI();
  try {
    const contents: any[] = [{ text: query }];
    if (imagePart) contents.unshift(imagePart);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: contents },
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: {
          retrievalConfig: { latLng }
        }
      },
    });

    return {
      text: response.text || "No locations found.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    return handleApiError(error, "Map Discovery");
  }
};

export const animateImage = async (imagePart: Part, prompt: string, aspectRatio: '16:9' | '9:16') => {
  const ai = getAI();
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || 'Animate this image with realistic movement',
      image: {
        imageBytes: imagePart.inlineData!.data,
        mimeType: imagePart.inlineData!.mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio
      }
    });

    let attempts = 0;
    while (!operation.done) {
      // Safety cap for long operations
      if (attempts > 60) throw new Error("Video generation is taking too long. Please check back later.");
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      attempts++;
    }

    if (operation.error) {
      throw new Error(typeof operation.error.message === 'string' ? operation.error.message : 'Video generation failed');
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generated but download link is missing.");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    return handleApiError(error, "Animation");
  }
};
