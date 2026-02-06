# DONSnap Enhancer

An advanced AI-powered image editing and analysis application built with React, TypeScript, and Google's Gemini AI models.

## Features

- 🎨 **Image Enhancement** - Professional-grade image editing using AI
- 🔍 **Smart Search** - Search and ground information about your images with web integration
- 🗺️ **Map Discovery** - Discover locations and information with geographic context
- ✂️ **Crop Tool** - Built-in image cropping with rule-of-thirds guides
- 📊 **Image Comparison** - Side-by-side comparison of original and edited images
- 🎬 **AI Animation** - Bring images to life with AI-powered video generation
- 🎙️ **Live Assistant** - Interactive voice-enabled AI assistant
- 📥 **Batch Processing** - Handle multiple images at once
- 💾 **Download Results** - Export edited images and animations
- 🎯 **GIF Creation** - Generate animated GIFs from image sequences

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **AI**: Google Gemini API
- **Image Processing**: React Image Crop
- **Animation**: GifShot

## Prerequisites

- Node.js 18+ and npm
- Google Gemini API Key

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-ai-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the project root:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5174`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Project Structure

```
my-ai-app/
├── public/              # Static assets (logo, icons)
├── components/          # React components
│   ├── ImageUploader.tsx
│   ├── ImageViewer.tsx
│   ├── ImageCropper.tsx
│   ├── GroundingResults.tsx
│   ├── LiveAssistant.tsx
│   ├── ImageComparisonSlider.tsx
│   └── Icons.tsx
├── services/            # API and external services
│   └── geminiService.ts # Gemini AI integration
├── utils/               # Utility functions
│   └── fileUtils.ts
├── App.tsx              # Main app component
├── Header.tsx           # Header with logo
├── ControlPanel.tsx     # Control panel UI
├── index.tsx            # React entry point
├── index.html           # HTML template
└── vite.config.ts       # Vite configuration
```

## Usage

### Upload an Image

1. Click the upload area or drag and drop an image
2. Select from the thumbnails on the left

### Enhance an Image

1. Select an image
2. Enter enhancement prompt in the control panel
3. Click "Enhance" button
4. View results in the comparison slider

### Search and Ground Information

1. Upload an image
2. Use "Smart Search" to search the web for related information
3. Use "Map Discovery" to find geographic context (requires location)

### Create an Animation

1. Select an image
2. Enter animation prompt
3. Choose aspect ratio (16:9 or 9:16)
4. Click "Generate Animation"
5. Download the resulting video

### Use Live Assistant

Click the "Live Assistant" button to interact with an AI voice assistant for real-time help.

## API Capabilities

The app uses several Gemini models:

- **gemini-2.5-flash-image** - Image enhancement and analysis
- **gemini-2.5-flash** - Text generation and web search
- **veo-3.1-fast-generate-preview** - Video generation
- **gemini-3-flash-preview** - Web grounding with search

## Configuration

### Safety Settings

The app includes safety filters configured for creative tasks:
- Harassment: BLOCK_ONLY_HIGH
- Hate Speech: BLOCK_ONLY_HIGH
- Sexually Explicit: BLOCK_ONLY_HIGH
- Dangerous Content: BLOCK_ONLY_HIGH
- Civic Integrity: BLOCK_ONLY_HIGH

Adjust these in [services/geminiService.ts](services/geminiService.ts) if needed.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variable: `VITE_GEMINI_API_KEY`
4. Deploy

### Other Platforms

Build the app:
```bash
npm run build
```

Deploy the `dist/` folder to your hosting platform.

## Known Limitations

- Requires valid Gemini API key with appropriate quotas
- Video generation may take 1-2 minutes
- Large images may require processing time
- Some features require image inputs

## Troubleshooting

### "API Key is missing"
- Ensure `.env` file exists in project root
- Check `VITE_GEMINI_API_KEY` is set correctly
- Restart the dev server after updating `.env`

### "Safety filters blocked the request"
- Try rephrasing your prompt
- Use a different image
- Check API quota limits

### Images not uploading
- Ensure image format is supported (PNG, JPEG, WebP, GIF)
- Check file size is reasonable (<10MB recommended)
- Try a different browser

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is created by Dons Technologies. All rights reserved.

## Support

For issues and questions, please check:
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)

---

**Built with ❤️ by Dons Technologies**
