import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import PhotoAnalysisService from './services/photoAnalysis.js';
import database from './database/connection.js';

dotenv.config();

// Initialize services
let photoAnalysisService;
let db;

const app = express();
const PORT = process.env.PORT || 3001;

// Function to get the correct base URL for production/development
function getBaseURL(req) {
  if (process.env.NODE_ENV === 'production') {
    // In production, use the host from the request or Railway domain
    const host = req.get('host') || process.env.RAILWAY_STATIC_URL || process.env.PUBLIC_URL;
    return host ? `https://${host}` : `https://memorial-generator-production.up.railway.app`;
  }
  // In development, use localhost
  return `http://localhost:${PORT}`;
}

// CORS Configuration for production deployment
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    /\.vercel\.app$/,
    /\.netlify\.app$/,
    /\.railway\.app$/,
    /\.render\.com$/
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/generated', express.static('./images/generated_posters'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = './uploads';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

function encodeImageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

function getImageMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    default:
      return 'image/jpeg';
  }
}

const GREETING_TYPES = {
  celebration_of_life: {
    name: 'Celebration of Life',
    style: 'joyful and vibrant',
    colors: 'bright golds, warm oranges, and uplifting blues',
    elements: 'celebratory decorations, confetti patterns, uplifting rays of light, or festive elements',
    mood: 'celebration, joy, and the beautiful legacy they left behind'
  },
  peaceful_remembrance: {
    name: 'Peaceful Remembrance',
    style: 'serene and calming',
    colors: 'soft whites, gentle lavenders, and peaceful sage greens',
    elements: 'peaceful clouds, gentle water scenes, soft feathers, or tranquil nature elements',
    mood: 'peace, serenity, and gentle comfort'
  },
  eternal_love: {
    name: 'Eternal Love',
    style: 'romantic and heartfelt',
    colors: 'warm roses, soft pinks, and elegant golds',
    elements: 'intertwined hearts, infinity symbols, romantic florals, or gentle embrace imagery',
    mood: 'everlasting love, deep connection, and eternal bonds'
  },
  heroic_tribute: {
    name: 'Heroic Tribute',
    style: 'strong and inspiring',
    colors: 'deep blues, noble purples, and shining golds',
    elements: 'strength symbols, inspiring quotes, bold geometric patterns, or heroic imagery',
    mood: 'strength, courage, inspiration, and the heroic qualities they embodied'
  },
  gentle_farewell: {
    name: 'Gentle Farewell',
    style: 'soft and spiritual',
    colors: 'gentle pastels, soft pinks, and comforting creams',
    elements: 'angel wings, soft petals falling, gentle light beams, or spiritual symbols',
    mood: 'gentle goodbye, spiritual comfort, and peaceful transition'
  }
};

async function createMemorialPoster(photoPath, heartfeltMessage, personName, greetingType = 'celebration_of_life', photoAnalysis = null) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    const imageBase64 = encodeImageToBase64(photoPath);
    const mimeType = getImageMimeType(photoPath);
    const greetingConfig = GREETING_TYPES[greetingType] || GREETING_TYPES.celebration_of_life;
    
    let prompt = `Create a beautiful memorial story book poster as a heartfelt tribute in the style of "${greetingConfig.name}". Use this photo of ${personName} and incorporate this message: "${heartfeltMessage}". 

Design an elegant, respectful memorial poster with a ${greetingConfig.style} aesthetic:`;

    if (photoAnalysis && photoAnalysis.recommendations && photoAnalysis.recommendations.suggestedColors && photoAnalysis.recommendations.suggestedColors.length > 0) {
      const analyzedColors = photoAnalysis.recommendations.suggestedColors.join(', ');
      prompt += `\n- Use colors based on photo analysis: ${analyzedColors}`;
    } else {
      prompt += `\n- Use a ${greetingConfig.colors} color palette that reflects the chosen tribute style`;
    }

    prompt += `\n- Beautiful typography for the person's name prominently displayed
- The heartfelt message beautifully integrated into the design`;

    if (photoAnalysis && photoAnalysis.recommendations && photoAnalysis.recommendations.decorativeElements && photoAnalysis.recommendations.decorativeElements.length > 0) {
      const analyzedElements = photoAnalysis.recommendations.decorativeElements.join(', ');
      prompt += `\n- Decorative elements based on photo context: ${analyzedElements}`;
    } else {
      prompt += `\n- Decorative elements such as ${greetingConfig.elements}`;
    }

    prompt += `\n- A story book aesthetic with an elegant, timeless design
- Space for the message to be prominently and beautifully displayed`;

    if (photoAnalysis && photoAnalysis.emotionalTone && photoAnalysis.emotionalTone.mood) {
      prompt += `\n- An overall feeling that reflects the photo's ${photoAnalysis.emotionalTone.mood} mood and conveys ${greetingConfig.mood}`;
    } else {
      prompt += `\n- An overall feeling that conveys ${greetingConfig.mood}`;
    }

    if (photoAnalysis && photoAnalysis.personCharacteristics) {
      prompt += `\n\nPhoto Context (to enhance personalization):`;
      if (photoAnalysis.personCharacteristics.estimatedAge && photoAnalysis.personCharacteristics.estimatedAge !== 'not determined') {
        prompt += `\n- Person appears to be: ${photoAnalysis.personCharacteristics.estimatedAge}`;
      }
      if (photoAnalysis.personCharacteristics.setting && photoAnalysis.personCharacteristics.setting !== 'not determined') {
        prompt += `\n- Photo setting: ${photoAnalysis.personCharacteristics.setting}`;
      }
      if (photoAnalysis.personCharacteristics.expressions && photoAnalysis.personCharacteristics.expressions.length > 0) {
        prompt += `\n- Expressions captured: ${photoAnalysis.personCharacteristics.expressions.join(', ')}`;
      }
    }

    prompt += `\n\nThe poster should feel like the cover of a treasured memory book, perfectly capturing the essence of a ${greetingConfig.name.toLowerCase()} while conveying love, respect, and the beautiful impact this person had on others' lives.`;

    console.log(`Creating memorial poster for ${personName}...`);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            },
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType
              }
            }
          ]
        }
      ]
    });
    
    console.log("Memorial poster generation completed!");
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        const filename = `${personName.replace(/\s+/g, '_')}_${uuidv4()}_memorial_poster.png`;
        const filePath = `./images/generated_posters/${filename}`;
        
        fs.mkdirSync('./images/generated_posters', { recursive: true });
        
        fs.writeFileSync(filePath, buffer);
        console.log(`Memorial poster saved as: ${filePath}`);
        
        return {
          success: true,
          filename: filename,
          path: filePath,
          url: `/generated/${filename}`
        };
      }
    }
    
    return { success: false, error: 'No poster generated' };
    
  } catch (error) {
    console.error("Error creating memorial poster:", error.message);
    return { success: false, error: error.message };
  }
}

app.get('/', (req, res) => {
  res.json({ 
    message: 'Memorial Story Book Generator API',
    endpoints: {
      'POST /api/create-memorial-session': 'Create new memorial session with photo analysis',
      'POST /api/generate-memorial/:sessionId': 'Generate AI-enhanced memorial from session data (RECOMMENDED)',
      'POST /api/generate-poster': 'Generate memorial poster (legacy, now with AI enhancement)',
      'GET /api/memorial-session/:id': 'Get memorial session details',
      'POST /api/analyze-photo': 'Analyze photo and suggest memorial style',
      'GET /health': 'Health check'
    }
  });
});

app.post('/api/analyze-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required for analysis' });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'Google API key not configured' });
    }

    console.log(`Analyzing photo: ${req.file.filename}`);

    const analysisResult = await photoAnalysisService.analyzePhoto(req.file.path);

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (analysisResult.success) {
      res.json({
        success: true,
        message: 'Photo analyzed successfully',
        analysis: analysisResult.analysis,
        timestamp: analysisResult.timestamp
      });
    } else {
      res.status(500).json({ 
        error: analysisResult.error,
        fallback: analysisResult.fallback
      });
    }

  } catch (error) {
    console.error('Error in photo analysis endpoint:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Internal server error during photo analysis' });
  }
});

app.post('/api/create-memorial-session', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    const { personName, description, culturalContext } = req.body;
    
    if (!personName || !description) {
      return res.status(400).json({ error: 'Person name and description are required' });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'Google API key not configured' });
    }

    const sessionId = uuidv4();
    console.log(`Creating memorial session ${sessionId} for: ${personName}`);

    // Analyze the photo first
    const analysisResult = await photoAnalysisService.analyzePhoto(req.file.path);

    // Move photo to permanent storage
    const permanentPath = `./uploads/sessions/${sessionId}_${req.file.filename}`;
    const sessionDir = path.dirname(permanentPath);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    fs.renameSync(req.file.path, permanentPath);

    // Create memorial session in database
    await database.run(`
      INSERT INTO memorial_sessions (
        id, person_name, original_message, photo_path, 
        photo_analysis, cultural_context, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      sessionId,
      personName,
      description,
      permanentPath,
      JSON.stringify(analysisResult.analysis || {}),
      JSON.stringify(culturalContext ? JSON.parse(culturalContext) : {}),
      'active'
    ]);

    // Log analytics event
    await database.run(`
      INSERT INTO analytics_events (id, session_id, event_type, event_data)
      VALUES (?, ?, ?, ?)
    `, [
      uuidv4(),
      sessionId,
      'session_created',
      JSON.stringify({
        personName,
        hasPhotoAnalysis: analysisResult.success,
        suggestedStyle: analysisResult.analysis?.suggestedMemorialStyle,
        culturalContext: culturalContext ? true : false
      })
    ]);

    res.json({
      success: true,
      message: `Memorial session created for ${personName}`,
      sessionId: sessionId,
      photoAnalysis: analysisResult.analysis,
      suggestedGreetingType: analysisResult.analysis?.suggestedMemorialStyle || 'celebration_of_life'
    });

  } catch (error) {
    console.error('Error creating memorial session:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Internal server error while creating memorial session' });
  }
});

// Get memorial session details
app.get('/api/memorial-session/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Get session details
    const session = await database.get(`
      SELECT * FROM memorial_sessions WHERE id = ?
    `, [sessionId]);

    if (!session) {
      return res.status(404).json({ error: 'Memorial session not found' });
    }

    // Get generated memorials for this session
    const memorials = await database.all(`
      SELECT * FROM generated_memorials 
      WHERE session_id = ? 
      ORDER BY version DESC
    `, [sessionId]) || [];

    // Parse JSON fields
    session.photo_analysis = session.photo_analysis ? JSON.parse(session.photo_analysis) : null;
    session.cultural_context = session.cultural_context ? JSON.parse(session.cultural_context) : null;
    session.user_preferences = session.user_preferences ? JSON.parse(session.user_preferences) : null;

    memorials.forEach(memorial => {
      memorial.quality_assessment = memorial.quality_assessment ? JSON.parse(memorial.quality_assessment) : null;
      memorial.user_feedback = memorial.user_feedback ? JSON.parse(memorial.user_feedback) : null;
      memorial.generation_metadata = memorial.generation_metadata ? JSON.parse(memorial.generation_metadata) : null;
    });

    res.json({
      success: true,
      session: session,
      memorials: memorials,
      memorialCount: memorials.length
    });

  } catch (error) {
    console.error('Error retrieving memorial session:', error);
    res.status(500).json({ error: 'Internal server error while retrieving session' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/api/generate-poster', upload.single('photo'), async (req, res) => {
  try {
    // Validation
    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required' });
    }
    
    const { personName, description, greetingType = 'celebration_of_life' } = req.body;
    
    if (!personName || !description) {
      return res.status(400).json({ error: 'Person name and description are required' });
    }
    
    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'Google API key not configured' });
    }
    
    console.log(`Received request to create poster for: ${personName}`);
    console.log(`Photo: ${req.file.filename}`);
    console.log(`Description: ${description}`);
    console.log(`Greeting Type: ${greetingType}`);
    
    // Analyze the photo first to get AI recommendations
    let photoAnalysis = null;
    try {
      console.log('Analyzing photo for enhanced memorial generation...');
      const analysisResult = await photoAnalysisService.analyzePhoto(req.file.path);
      if (analysisResult.success) {
        photoAnalysis = analysisResult.analysis;
        console.log('Photo analysis completed successfully, using AI recommendations');
      } else {
        console.log('Photo analysis failed, using default styling');
      }
    } catch (error) {
      console.log('Photo analysis error, using default styling:', error.message);
    }
    
    // Generate memorial poster with AI-enhanced analysis
    const result = await createMemorialPoster(
      req.file.path,
      description,
      personName,
      greetingType,
      photoAnalysis
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: `Memorial poster created for ${personName}`,
        poster: {
          filename: result.filename,
          url: `${getBaseURL(req)}${result.url}`
        }
      });
    } else {
      res.status(500).json({ error: result.error });
    }
    
    // Clean up uploaded file after processing
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
  } catch (error) {
    console.error('Error in generate-poster endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced memorial generation endpoint using session data
app.post('/api/generate-memorial/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { greetingType, refinementFeedback } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'Google API key not configured' });
    }
    
    console.log(`Generating memorial for session: ${sessionId}`);
    
    // Get session details including photo analysis
    const session = await database.get(`
      SELECT * FROM memorial_sessions WHERE id = ?
    `, [sessionId]);
    
    if (!session) {
      return res.status(404).json({ error: 'Memorial session not found' });
    }
    
    // Parse photo analysis from session
    let photoAnalysis = null;
    if (session.photo_analysis) {
      try {
        photoAnalysis = JSON.parse(session.photo_analysis);
      } catch (e) {
        console.log('Failed to parse photo analysis from session');
      }
    }
    
    // Use suggested greeting type from analysis or provided type
    const effectiveGreetingType = greetingType || 
      (photoAnalysis && photoAnalysis.suggestedMemorialStyle) || 
      'celebration_of_life';
    
    console.log(`Using greeting type: ${effectiveGreetingType}`);
    console.log(`Photo analysis available: ${!!photoAnalysis}`);
    
    // Generate memorial poster with full context
    const result = await createMemorialPoster(
      session.photo_path,
      session.original_message,
      session.person_name,
      effectiveGreetingType,
      photoAnalysis
    );
    
    if (result.success) {
      // Save generated memorial to database
      const memorialId = uuidv4();
      const version = await getNextVersion(sessionId);
      
      await database.run(`
        INSERT INTO generated_memorials (
          id, session_id, version, greeting_type, generated_prompt,
          memorial_path, memorial_url, is_selected, generation_metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        memorialId,
        sessionId,
        version,
        effectiveGreetingType,
        'AI-enhanced prompt with photo analysis',
        result.path,
        result.url,
        true,
        JSON.stringify({
          analysisUsed: !!photoAnalysis,
          greetingTypeSource: greetingType ? 'user_selected' : 'ai_suggested',
          generationTime: Date.now()
        })
      ]);
      
      // Log analytics
      await database.run(`
        INSERT INTO analytics_events (id, session_id, event_type, event_data)
        VALUES (?, ?, ?, ?)
      `, [
        uuidv4(),
        sessionId,
        'memorial_generated',
        JSON.stringify({
          memorialId,
          greetingType: effectiveGreetingType,
          usedPhotoAnalysis: !!photoAnalysis,
          version
        })
      ]);
      
      res.json({
        success: true,
        message: `Enhanced memorial generated for ${session.person_name}`,
        memorial: {
          id: memorialId,
          filename: result.filename,
          url: `${getBaseURL(req)}${result.url}`,
          greetingType: effectiveGreetingType,
          version,
          enhancedWithAI: !!photoAnalysis
        }
      });
    } else {
      res.status(500).json({ error: result.error });
    }
    
  } catch (error) {
    console.error('Error generating memorial from session:', error);
    res.status(500).json({ error: 'Internal server error during memorial generation' });
  }
});

// Helper function to get next version number
async function getNextVersion(sessionId) {
  const result = await database.get(`
    SELECT MAX(version) as maxVersion FROM generated_memorials WHERE session_id = ?
  `, [sessionId]);
  
  return (result && result.maxVersion) ? result.maxVersion + 1 : 1;
}

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize database
    console.log('Initializing database...');
    db = await database.initialize();
    
    // Initialize photo analysis service
    console.log('Initializing photo analysis service...');
    photoAnalysisService = new PhotoAnalysisService(process.env.GOOGLE_API_KEY);
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🌟 Memorial Story Book Generator API`);
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`✅ All services initialized successfully`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    if (database) {
      await database.close();
    }
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();