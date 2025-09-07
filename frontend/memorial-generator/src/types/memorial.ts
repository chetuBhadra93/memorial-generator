// Memorial Generator Types
export interface PhotoAnalysis {
  personCharacteristics: {
    estimatedAge: string;
    expressions: string[];
    setting: string;
    clothing: string;
    peopleCount: string;
  };
  technicalQuality: {
    resolution: string;
    lighting: string;
    composition: string;
    colorPalette: string;
  };
  emotionalTone: {
    mood: string;
    energy: string;
    formality: string;
    timePeriod: string;
  };
  recommendations: {
    suggestedColors: string[];
    decorativeElements: string[];
    overallTone: string;
  };
  suggestedMemorialStyle: string;
  confidence?: string;
}

export interface MemorialSession {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'completed' | 'archived';
  person_name: string;
  original_message: string;
  photo_path: string;
  photo_analysis: PhotoAnalysis | null;
  cultural_context: CulturalContext | null;
  user_preferences: UserPreferences | null;
}

export interface GeneratedMemorial {
  id: string;
  session_id: string;
  version: number;
  created_at: string;
  greeting_type: string;
  generated_prompt: string;
  memorial_path: string | null;
  memorial_url: string | null;
  quality_score: number;
  quality_assessment: QualityAssessment | null;
  user_feedback: UserFeedback | null;
  is_selected: boolean;
  generation_metadata: GenerationMetadata | null;
}

export interface CulturalContext {
  religion?: 'christian' | 'jewish' | 'muslim' | 'buddhist' | 'hindu' | 'secular';
  culturalBackground?: string[];
  symbolPreferences?: string[];
  colorSignificance?: Record<string, string>;
}

export interface QualityAssessment {
  visualClarity: number;
  emotionalAppropriateness: number;
  designHarmony: number;
  textReadability: number;
  culturalSensitivity: number;
  overallScore: number;
  improvementSuggestions: string[];
}

export interface UserFeedback {
  feedbackText: string;
  feedbackType: 'improvement' | 'refinement' | 'complaint' | 'praise';
  sentiment: 'positive' | 'negative' | 'neutral';
  appliedToVersion?: number;
}

export interface UserPreferences {
  preferredStyles: string[];
  colorPreferences: string[];
  avoidedElements: string[];
  feedbackHistory: UserFeedback[];
}

export interface GenerationMetadata {
  analysisUsed: boolean;
  culturalContextApplied: boolean;
  generationTime: number;
  model: string;
  promptVersion: string;
}

export interface AnalysisResponse {
  success: boolean;
  message?: string;
  analysis?: PhotoAnalysis;
  timestamp?: string;
  error?: string;
  fallback?: PhotoAnalysis;
}

export interface SessionResponse {
  success: boolean;
  message?: string;
  sessionId?: string;
  photoAnalysis?: PhotoAnalysis;
  suggestedGreetingType?: string;
  error?: string;
}

export interface SessionDetailsResponse {
  success: boolean;
  session?: MemorialSession;
  memorials?: GeneratedMemorial[];
  memorialCount?: number;
  error?: string;
}

// Enhanced greeting type with analysis integration
export interface GreetingType {
  id: string;
  name: string;
  description: string;
  emoji: string;
  isRecommended?: boolean;
  confidenceScore?: number;
  reasonForRecommendation?: string;
}