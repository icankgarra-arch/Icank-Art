import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// A simplified type for the video operation, focusing on what we need.
interface VideosOperation {
  name: string;
  done: boolean;
  response?: {
    generatedVideos: { video: { uri: string } }[];
  }
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // IMPORTANT: This assumes process.env.API_KEY is available in the execution environment.
    // Do not hardcode API keys in a real application.
    const apiKey = (window as any).process?.env?.API_KEY;
    if (!apiKey) {
      console.error('API_KEY not found. Please set it in your environment variables.');
      // In a real app, you might want to handle this more gracefully.
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_API_KEY' });
  }

  async generateImage(prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'): Promise<string> {
    const response = await this.ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: aspectRatio,
      },
    });
    
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
  }

  async analyzeImage(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
    const imagePart = {
      inlineData: { data: imageBase64, mimeType }
    };
    const textPart = { text: prompt };

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text;
  }

  async editImage(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
     // This uses the same multimodal prompt as analyze, but the prompt guides it to generate a new image.
    const imagePart = {
      inlineData: { data: imageBase64, mimeType }
    };
    const textPart = { text: `Based on this image, generate a new image that incorporates the following edit: ${prompt}` };

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    // Note: Gemini Flash does not directly return an image from a multimodal prompt.
    // It returns text. For a true "image editing" experience, you'd typically use
    // the generated text to then call an image generation model.
    // Here, we simulate by generating a new image based on the combined description.
    const combinedPrompt = `A new version of an image. The user wants this edit: "${prompt}". The original image can be described as follows: ${response.text}`;
    return this.generateImage(combinedPrompt, '1:1');
  }

  async generateVideo(prompt: string, aspectRatio: '16:9' | '9:16', loadingMessageSignal: (msg: string) => void): Promise<string> {
    loadingMessageSignal('Starting video generation...');
    let operation: VideosOperation = await this.ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        aspectRatio: aspectRatio
      }
    });

    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      loadingMessageSignal(`Processing... (check ${pollCount})`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      operation = await this.ai.operations.getVideosOperation({ operation: operation as any });
    }

    loadingMessageSignal('Finalizing video...');
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Video generation completed, but no download link was found.');
    }
    
    // The Applet environment may have CORS issues. Returning the link directly is more robust.
    // The component will handle fetching with the API key.
    return downloadLink;
  }

  async animateImage(prompt: string, imageBase64: string, mimeType: string, loadingMessageSignal: (msg: string) => void): Promise<string> {
     loadingMessageSignal('Starting image animation...');
    let operation: VideosOperation = await this.ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      image: {
        imageBytes: imageBase64,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1
      }
    });

    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      loadingMessageSignal(`Animating... (check ${pollCount})`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await this.ai.operations.getVideosOperation({ operation: operation as any });
    }

    loadingMessageSignal('Finalizing animation...');
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
     if (!downloadLink) {
        throw new Error('Animation completed, but no download link was found.');
    }
    return downloadLink;
  }
  
  // Helper to fetch the video blob using the API key
  async fetchVideoBlobUrl(uri: string): Promise<string> {
     const apiKey = (window as any).process?.env?.API_KEY;
     const response = await fetch(`${uri}&key=${apiKey}`);
     if (!response.ok) {
         throw new Error(`Failed to fetch video: ${response.statusText}`);
     }
     const blob = await response.blob();
     return URL.createObjectURL(blob);
  }

  // Utility to convert a file to a base64 string
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // result is "data:mime/type;base64,the_base_64_string"
        // We only want "the_base_64_string"
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  }
}
