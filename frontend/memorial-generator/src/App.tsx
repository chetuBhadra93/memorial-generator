import React, { useState } from 'react';
import memorialService from './services/memorialService';
import './App.css';
import PhotoAnalysis from './components/PhotoAnalysis';
import { PhotoAnalysis as PhotoAnalysisType } from './types/memorial';

interface GreetingType {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

const GREETING_TYPES: GreetingType[] = [
  {
    id: 'celebration_of_life',
    name: 'Celebration of Life',
    description: 'A joyful tribute celebrating their legacy and impact',
    emoji: '🌟'
  },
  {
    id: 'peaceful_remembrance',
    name: 'Peaceful Remembrance',
    description: 'A serene memorial with gentle, comforting themes',
    emoji: '🕊️'
  },
  {
    id: 'eternal_love',
    name: 'Eternal Love',
    description: 'A romantic tribute focusing on everlasting love and connection',
    emoji: '💖'
  },
  {
    id: 'heroic_tribute',
    name: 'Heroic Tribute',
    description: 'Honor their courage, strength, and inspirational qualities',
    emoji: '🦸'
  },
  {
    id: 'gentle_farewell',
    name: 'Gentle Farewell',
    description: 'A soft, tender goodbye with comforting spiritual elements',
    emoji: '🌸'
  }
];

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [personName, setPersonName] = useState('');
  const [description, setDescription] = useState('');
  const [greetingType, setGreetingType] = useState<string>(GREETING_TYPES[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Enhanced features state
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysisType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useEnhancedFeatures, setUseEnhancedFeatures] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
      setPhotoAnalysis(null);

      // Trigger photo analysis if enhanced features are enabled
      if (useEnhancedFeatures) {
        await analyzePhoto(file);
      }
    }
  };

  const analyzePhoto = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('Starting photo analysis...');
      const result = await memorialService.analyzePhoto(file);
      
      if (result.success && result.analysis) {
        setPhotoAnalysis(result.analysis);
        console.log('Photo analysis completed:', result.analysis);
        
        // Auto-suggest greeting type based on analysis
        if (result.analysis.suggestedMemorialStyle) {
          const suggestedType = result.analysis.suggestedMemorialStyle;
          const isValidType = GREETING_TYPES.some(type => type.id === suggestedType);
          if (isValidType) {
            setGreetingType(suggestedType);
          }
        }
      } else {
        console.warn('Photo analysis failed:', result.error);
        if (result.fallback) {
          setPhotoAnalysis(result.fallback);
        }
      }
    } catch (error: any) {
      console.error('Photo analysis error:', error);
      setError(`Photo analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStyleSuggestionAccept = (suggestedStyle: string) => {
    setGreetingType(suggestedStyle);
    // Optionally show a confirmation message
    console.log(`Style changed to: ${suggestedStyle} based on AI recommendation`);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile || !personName.trim() || !description.trim()) {
      setError('Please fill in all fields and select a photo.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPoster(null);

    try {
      console.log('Step 1: Creating memorial session with AI photo analysis...');
      const sessionResponse = await memorialService.createMemorialSession(
        selectedFile,
        personName.trim(),
        description.trim()
      );

      if (!sessionResponse.success) {
        throw new Error(sessionResponse.error || 'Failed to create memorial session');
      }

      console.log('Step 2: Generating memorial from session with AI recommendations...');
      console.log('Session created:', sessionResponse.sessionId);
      console.log('AI suggested style:', sessionResponse.suggestedGreetingType);

      const effectiveGreetingType = greetingType;
      
      const memorialResponse = await memorialService.generateMemorialFromSession(
        sessionResponse.sessionId!,
        effectiveGreetingType
      );

      if (memorialResponse.success && memorialResponse.memorial) {
        setGeneratedPoster(memorialResponse.memorial.url);
        
        if (memorialResponse.memorial.enhancedWithAI) {
          console.log('Memorial enhanced with AI photo analysis');
          console.log('Used greeting type:', memorialResponse.memorial.greetingType);
        }
      } else {
        setError(memorialResponse.error || 'Failed to generate memorial');
      }
    } catch (err: any) {
      console.error('Error in enhanced memorial generation:', err);
      setError(err.message || 'Failed to generate memorial. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPersonName('');
    setDescription('');
    setGreetingType(GREETING_TYPES[0].id);
    setGeneratedPoster(null);
    setError(null);
    setPhotoAnalysis(null);
    setIsAnalyzing(false);
    setSessionId(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌟 AI-powered tributes</h1>
        <p>Create beautiful tributes with AI-powered poster generation</p>
      </header>

      <main className="App-main">
        <div className="container">
          <form onSubmit={handleSubmit} className="memorial-form">
            <div className="form-section">
              <h2>📸 Upload Photo</h2>
              <div className="file-upload-container">
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <label htmlFor="photo" className="file-label">
                  {selectedFile ? selectedFile.name : 'Choose a photo...'}
                </label>
              </div>
              
              {previewUrl && (
                <div className="image-preview">
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                </div>
              )}
            </div>

            {/* AI Photo Analysis */}
            {(selectedFile && useEnhancedFeatures) && (
              <PhotoAnalysis
                analysis={photoAnalysis}
                isLoading={isAnalyzing}
                onStyleSuggestionAccept={handleStyleSuggestionAccept}
              />
            )}

            <div className="form-section">
              <h2>💝 Person Details</h2>
              <div className="input-group">
                <label htmlFor="personName">Name:</label>
                <input
                  type="text"
                  id="personName"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Enter the person's name"
                  className="text-input"
                />
              </div>
            </div>

            <div className={`form-section ${photoAnalysis && photoAnalysis.suggestedMemorialStyle === greetingType ? 'with-analysis' : ''}`}>
              <h2>🎨 Tribute Style</h2>
              <div className="input-group">
                <label htmlFor="greetingType">Choose the type of tribute:</label>
                <select
                  id="greetingType"
                  value={greetingType}
                  onChange={(e) => setGreetingType(e.target.value)}
                  className="select-input"
                >
                  {GREETING_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.emoji} {type.name}
                      {photoAnalysis && photoAnalysis.suggestedMemorialStyle === type.id ? ' (AI Recommended)' : ''}
                    </option>
                  ))}
                </select>
                
                {photoAnalysis && photoAnalysis.suggestedMemorialStyle === greetingType && (
                  <div className="analysis-suggestion">
                    🤖 <strong>AI Recommendation:</strong> This style was selected based on the analysis of your photo's emotional tone and context.
                  </div>
                )}
                
                <p className="greeting-description">
                  {GREETING_TYPES.find(t => t.id === greetingType)?.description}
                </p>
              </div>
            </div>

            <div className="form-section">
              <h2>✍️ Heartfelt Message</h2>
              <div className="input-group">
                <label htmlFor="description">Your tribute message:</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share a heartfelt message, memory, or tribute that celebrates their life and impact..."
                  className="textarea-input"
                  rows={5}
                />
              </div>
            </div>

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                disabled={isLoading || !selectedFile || !personName.trim() || !description.trim()}
                className="generate-button"
              >
                {isLoading ? '🎨 Generating Tribute...' : '🌟 Generate Memorial Poster'}
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                className="reset-button"
              >
                🔄 Reset Form
              </button>
            </div>
          </form>

          {isLoading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Creating your beautiful memorial tribute... This may take a moment.</p>
            </div>
          )}

          {generatedPoster && (
            <div className="result-section">
              <h2>✨ Your Memorial Poster</h2>
              <div className="poster-container">
                <img src={generatedPoster} alt="Generated Memorial Poster" className="generated-poster" />
                <div className="poster-actions">
                  <a href={generatedPoster} download className="download-button">
                    💾 Download Poster
                  </a>
                </div>
              </div>
              <p className="success-message">
                🌟 A beautiful tribute has been created. May their memory continue to bring comfort and joy. 💙
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
