# Memorial Story Book Generator 🌟

A heartfelt tribute application that creates beautiful memorial story book posters using AI. Built for the Nano Banana Hackathon using Google's Gemini 2.5 Flash model to honor and celebrate the lives of those we've lost.

## 🌐 Full-Stack Web Application

This project includes both a **React frontend** and a **Node.js API backend** for a complete web-based memorial poster generation experience.

## About This Project

This application allows you to:
- Upload a cherished photo of a loved one who is no longer with us
- Share a heartfelt message or memory
- Generate a beautiful, elegant memorial story book poster using AI
- Create lasting tributes that celebrate their life and impact

**Perfect for:** Memorial services, tribute albums, celebration of life events, or personal keepsakes.

## Prerequisites

- Node.js (v14 or higher)
- Google AI Studio API key
- Photos of your loved ones (JPG, JPEG, PNG format)

## 🚀 Quick Start Guide

### Option 1: Web Application (Recommended)

1. **Install dependencies:**
   ```bash
   npm install
   cd frontend/memorial-generator && npm install && cd ../..
   ```

2. **Set up your API key:**
   ```bash
   cp .env.example .env
   # Edit .env and add your Google AI Studio API key
   ```

3. **Start both frontend and backend:**
   ```bash
   npm run dev
   ```
   
   This opens:
   - 🌐 **Frontend**: http://localhost:3000 (React web app)
   - 🖥️ **Backend**: http://localhost:3001 (API server)
   
   **Live Demo**: https://memorial-generator.vercel.app

4. **Use the web interface:**
   - Upload a photo of your loved one
   - Enter their name and a heartfelt message
   - Click "Generate Memorial Poster"
   - Download your beautiful tribute!

### Option 2: Command Line Interface

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up API key and add photos:**
   ```bash
   cp .env.example .env
   # Edit .env with your API key
   # Add photos to ./images/tribute_photos/
   ```

3. **Run CLI version:**
   ```bash
   npm run cli
   ```

### Available Scripts

- `npm run dev` - Start both frontend and backend
- `npm run backend` - Start only the API server
- `npm run frontend` - Start only the React app
- `npm run cli` - Run the command-line version

## How It Works

1. **Photo Selection**: The app shows all available photos in `./images/tribute_photos/`
2. **Personal Details**: Enter the person's name
3. **Heartfelt Message**: Share a meaningful message, memory, or tribute
4. **AI Generation**: Gemini 2.5 Flash creates a beautiful memorial poster incorporating:
   - Their photo as the centerpiece
   - Your heartfelt message beautifully integrated
   - Elegant design with warm, comforting colors
   - Story book aesthetic with respectful typography
   - Decorative elements like floral borders or gentle light

## Features

✨ **AI-Powered Memorial Creation**: Uses Gemini 2.5 Flash image generation
📸 **Photo Integration**: Incorporates your uploaded photos seamlessly  
💝 **Personalized Messages**: Your words become part of the tribute
🎨 **Beautiful Design**: Elegant, respectful poster layouts
📖 **Story Book Aesthetic**: Timeless, book-like memorial designs
🖼️ **High-Quality Output**: PNG posters ready for printing or sharing

## Example Usage

```bash
🌟 Memorial Story Book Generator
Creating heartfelt tributes with AI
=====================================

📸 Available photos:
1. grandma_mary.jpg
2. uncle_john.png

[1] Select a photo to create a memorial poster for: 1

Selected photo: grandma_mary.jpg

💝 What is the name of this beloved person? Mary Johnson

✍️  Please share a heartfelt message or memory about Mary Johnson:
(This will be incorporated into the memorial poster)
Your message: A loving grandmother who filled our hearts with warmth, wisdom, and unconditional love. Her gentle spirit lives on in every life she touched.

Creating memorial poster for Mary Johnson...
Message: "A loving grandmother who filled our hearts with warmth, wisdom, and unconditional love. Her gentle spirit lives on in every life she touched."
Memorial poster generation completed!

✨ Memorial poster saved as: ./images/generated_posters/Mary_Johnson_memorial_poster.png
💝 A beautiful tribute to Mary Johnson has been created.

🌟 Thank you for creating a beautiful tribute.
May their memory continue to bring comfort and joy. 💙
```

## 🏗️ Project Structure

```
Memorial-Story-Book-Generator/
├── backend/
│   └── server.js              # Express API server with Gemini integration
├── frontend/
│   └── memorial-generator/    # React TypeScript application
│       ├── src/
│       │   ├── App.tsx       # Main React component
│       │   └── App.css       # Styling
│       └── package.json      # React dependencies
├── images/
│   ├── tribute_photos/       # CLI: Place photos here
│   └── generated_posters/    # Generated memorial posters
├── uploads/                  # Web: Temporary uploaded photos
├── index.js                  # CLI version
├── start-backend.js          # Backend startup script
├── start-frontend.js         # Frontend startup script
├── package.json              # Main project dependencies
├── .env.example              # API key template
└── README.md                 # This file
```

## 🌐 API Endpoints

**Backend Server (http://localhost:3001):**

- `GET /` - API information
- `GET /health` - Health check
- `POST /api/generate-poster` - Generate memorial poster
  - **Body**: Form data with `photo` (file), `personName` (string), `description` (string)
  - **Response**: JSON with poster URL and metadata

## API Usage & Limits

- **Model**: Gemini 2.5 Flash Image Preview
- **Daily Limit**: 200 requests per project per day (Nano Banana Hackathon)
- **Input**: Photo + heartfelt message
- **Output**: High-quality memorial poster (PNG format)

## Hackathon Context

Created for the **Nano Banana Hackathon** (September 6-7, 2025):
- **Category**: Enhance Storytelling
- **Innovation**: AI-powered memorial creation
- **Impact**: Helping families create meaningful tributes
- **Technical**: Advanced image-to-image generation with Gemini 2.5 Flash

## API Reference

This project uses the `@google/genai` library to interact with Google's Gemini 2.5 Flash model for image generation. The key components are:

- **Model**: `gemini-2.5-flash-image-preview`
- **Input**: Text prompts for image generation
- **Output**: Base64-encoded image data

## Troubleshooting

- **"API key" error**: Make sure your `GOOGLE_API_KEY` environment variable is set correctly
- **"No images generated"**: Check that the model response contains image data
- **Network errors**: Verify your internet connection and API key validity

## Next Steps

Extend this project by:
- Adding image editing capabilities
- Implementing multiple image generation
- Creating a web interface
- Adding support for different image formats

## Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/)
- [Nano Banana Hackathon Kit](https://github.com/google-gemini/nano-banana-hackathon-kit)