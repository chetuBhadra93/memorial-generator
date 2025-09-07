import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';
import * as path from 'node:path';

class PhotoAnalysisService {
  constructor(apiKey) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Analyze uploaded photo to understand context and suggest memorial style
   * @param {string} photoPath - Path to uploaded photo
   * @returns {Promise<PhotoAnalysis>} - Detailed photo analysis
   */
  async analyzePhoto(photoPath) {
    try {
      const imageBase64 = this.encodeImageToBase64(photoPath);
      const mimeType = this.getImageMimeType(photoPath);

      const analysisPrompt = `Analyze this photo carefully for memorial creation purposes. Provide detailed insights about:

1. PERSON CHARACTERISTICS:
   - Estimated age range (child, young adult, middle-aged, elderly)
   - Facial expressions and mood (happy, peaceful, contemplative, etc.)
   - Setting/environment (indoor, outdoor, formal, casual, etc.)
   - Clothing style (formal, casual, professional, traditional, etc.)
   - Number of people (solo portrait, group photo, family photo)

2. TECHNICAL QUALITY:
   - Photo resolution and clarity (excellent, good, fair, poor)
   - Lighting quality (natural, professional, low-light, artistic)
   - Composition style (portrait, candid, professional, artistic)
   - Color palette dominance (warm, cool, neutral, vibrant, muted)

3. EMOTIONAL TONE:
   - Overall mood of the photo (joyful, serene, dignified, intimate, etc.)
   - Energy level (high energy, calm, peaceful, dynamic)
   - Formality level (very formal, semi-formal, casual, intimate)
   - Time period feeling (recent, vintage, classic, timeless)

4. MEMORIAL STYLE RECOMMENDATIONS:
   - Which memorial style would best match this photo (Celebration of Life, Peaceful Remembrance, Eternal Love, Heroic Tribute, Gentle Farewell)
   - Suggested color palette based on photo analysis
   - Recommended decorative elements that would complement the photo
   - Overall tone that should be conveyed in the memorial

Please provide your analysis in JSON format with specific, actionable insights that will help create a more personalized and appropriate memorial.`;

      console.log('Sending photo analysis request to Gemini AI...');
      
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: [
          {
            role: "user",
            parts: [
              { text: analysisPrompt },
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

      console.log('Received response from Gemini AI');
      
      if (!response.candidates || !response.candidates[0] || !response.candidates[0].content) {
        throw new Error('Invalid response structure from AI service');
      }

      const analysisText = response.candidates[0].content.parts[0].text;
      console.log('AI Analysis Response (first 200 chars):', analysisText.substring(0, 200) + '...');
      
      // Parse the AI response and structure it
      const rawAnalysis = this.parseAnalysisResponse(analysisText);
      
      // Ensure analysis has all required properties with fallbacks
      const safeAnalysis = this.ensureAnalysisStructure(rawAnalysis);
      
      // Add suggested memorial style based on analysis
      safeAnalysis.suggestedMemorialStyle = this.determineBestMemorialStyle(safeAnalysis);
      
      console.log('Photo analysis completed:', {
        suggestedStyle: safeAnalysis.suggestedMemorialStyle,
        confidence: safeAnalysis.confidence || 'medium',
        hasPersonCharacteristics: !!safeAnalysis.personCharacteristics,
        hasEmotionalTone: !!safeAnalysis.emotionalTone
      });

      return {
        success: true,
        analysis: safeAnalysis,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in photo analysis:', error);
      
      // Generate fallback analysis with proper structure
      const fallbackAnalysis = this.getFallbackAnalysis();
      
      // Add suggested memorial style to fallback
      fallbackAnalysis.suggestedMemorialStyle = this.determineBestMemorialStyle(fallbackAnalysis);
      
      return {
        success: false,
        error: error.message,
        fallback: fallbackAnalysis
      };
    }
  }

  /**
   * Parse AI response into structured format
   * @param {string} analysisText - Raw AI response text
   * @returns {Object} - Structured analysis object
   */
  parseAnalysisResponse(analysisText) {
    try {
      console.log('Parsing AI response (first 300 chars):', analysisText.substring(0, 300));
      
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || 
                       analysisText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const rawJson = JSON.parse(jsonStr);
        console.log('Parsed JSON keys:', Object.keys(rawJson));
        
        // Convert AI response format to our expected format
        return this.convertAIResponseFormat(rawJson);
      }

      // If no JSON found, parse manually based on keywords
      return this.manualParseAnalysis(analysisText);
    } catch (error) {
      console.warn('Could not parse analysis response, using manual parsing:', error.message);
      return this.manualParseAnalysis(analysisText);
    }
  }

  /**
   * Convert AI response format to our expected structure
   * @param {Object} aiResponse - Raw AI JSON response
   * @returns {Object} - Converted analysis object
   */
  convertAIResponseFormat(aiResponse) {
    // Handle different possible field name formats from AI
    const personChars = aiResponse.PERSON_CHARACTERISTICS || aiResponse.person_characteristics || {};
    const techQuality = aiResponse.TECHNICAL_QUALITY || aiResponse.technical_quality || {};
    const emotionalTone = aiResponse.EMOTIONAL_TONE || aiResponse.emotional_tone || {};
    const recommendations = aiResponse.MEMORIAL_STYLE_RECOMMENDATIONS || aiResponse.recommendations || {};

    console.log('Converting AI response fields:', {
      hasPersonChars: !!personChars,
      hasTechQuality: !!techQuality,
      hasEmotionalTone: !!emotionalTone,
      hasRecommendations: !!recommendations
    });

    // Log the actual field names to debug
    if (personChars && typeof personChars === 'object') {
      console.log('Person characteristics field names:', Object.keys(personChars));
    }

    return {
      personCharacteristics: {
        estimatedAge: this.findFieldValue(personChars, [
          'Estimated age range', 'estimated_age_range', 'estimatedAge', 'age_range', 'age'
        ], 'not determined'),
        expressions: this.parseExpressions(
          this.findFieldValue(personChars, [
            'Facial expressions and mood', 'facial_expressions_and_mood', 'expressions', 'mood', 'expression'
          ], '')
        ),
        setting: this.findFieldValue(personChars, [
          'Setting/environment', 'setting_environment', 'setting', 'environment', 'location'
        ], 'not determined'),
        clothing: this.findFieldValue(personChars, [
          'Clothing style', 'clothing_style', 'clothing', 'attire', 'dress'
        ], 'not determined'),
        peopleCount: this.findFieldValue(personChars, [
          'Number of people', 'number_of_people', 'peopleCount', 'people_count', 'count'
        ], 'solo')
      },
      technicalQuality: {
        resolution: this.findFieldValue(techQuality, [
          'Photo resolution and clarity', 'photo_resolution_and_clarity', 'resolution', 'clarity', 'quality'
        ], 'good'),
        lighting: this.findFieldValue(techQuality, [
          'Lighting quality', 'lighting_quality', 'lighting', 'illumination'
        ], 'natural'),
        composition: this.findFieldValue(techQuality, [
          'Composition style', 'composition_style', 'composition', 'framing'
        ], 'portrait'),
        colorPalette: this.findFieldValue(techQuality, [
          'Color palette dominance', 'color_palette_dominance', 'colorPalette', 'color_palette', 'colors'
        ], 'mixed')
      },
      emotionalTone: {
        mood: this.findFieldValue(emotionalTone, [
          'Overall mood of photo', 'overall_mood_of_photo', 'mood', 'feeling', 'emotion'
        ], 'peaceful'),
        energy: this.findFieldValue(emotionalTone, [
          'Energy level', 'energy_level', 'energy', 'vigor', 'vitality'
        ], 'calm'),
        formality: this.findFieldValue(emotionalTone, [
          'Formality level', 'formality_level', 'formality', 'formal', 'casual'
        ], 'casual'),
        timePeriod: this.findFieldValue(emotionalTone, [
          'Time period feeling', 'time_period_feeling', 'timePeriod', 'time_period', 'era', 'period'
        ], 'recent')
      },
      recommendations: {
        suggestedColors: this.parseRecommendationArray(
          this.findFieldValue(recommendations, [
            'Suggested color palette', 'suggested_color_palette', 'suggestedColors', 'colors', 'color_suggestions'
          ], [])
        ),
        decorativeElements: this.parseRecommendationArray(
          this.findFieldValue(recommendations, [
            'Recommended decorative elements', 'recommended_decorative_elements', 'decorativeElements', 'elements', 'decorations'
          ], [])
        ),
        overallTone: this.findFieldValue(recommendations, [
          'Overall tone to convey', 'overall_tone_to_convey', 'overallTone', 'tone', 'style'
        ], 'respectful')
      }
    };
  }

  /**
   * Find field value from object using multiple possible field names
   * @param {Object} obj - Object to search in
   * @param {string[]} fieldNames - Array of possible field names
   * @param {any} defaultValue - Default value if not found
   * @returns {any} - Found value or default
   */
  findFieldValue(obj, fieldNames, defaultValue) {
    if (!obj || typeof obj !== 'object') {
      return defaultValue;
    }

    for (const fieldName of fieldNames) {
      if (obj.hasOwnProperty(fieldName) && obj[fieldName] != null && obj[fieldName] !== '') {
        return this.extractStringFromValue(obj[fieldName]);
      }
    }

    // Also try case-insensitive search
    const objKeys = Object.keys(obj);
    for (const searchField of fieldNames) {
      const foundKey = objKeys.find(key => 
        key.toLowerCase() === searchField.toLowerCase() ||
        key.toLowerCase().includes(searchField.toLowerCase()) ||
        searchField.toLowerCase().includes(key.toLowerCase())
      );
      if (foundKey && obj[foundKey] != null && obj[foundKey] !== '') {
        return this.extractStringFromValue(obj[foundKey]);
      }
    }

    return defaultValue;
  }

  /**
   * Extract meaningful string from various value types (handles nested objects)
   * @param {any} value - Value to extract string from
   * @returns {string} - Extracted string value
   */
  extractStringFromValue(value) {
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'object' && value !== null) {
      // If it's an object, try to extract meaningful values
      const values = Object.values(value).filter(v => v && typeof v === 'string');
      if (values.length > 0) {
        // Join multiple values or return the first meaningful one
        return values.join(', ');
      }
      
      // Fallback to JSON stringify for complex objects
      try {
        return JSON.stringify(value);
      } catch (e) {
        return String(value);
      }
    }
    
    return String(value);
  }

  /**
   * Parse expressions from AI response
   */
  parseExpressions(expressionString) {
    if (Array.isArray(expressionString)) {
      return expressionString;
    }
    if (typeof expressionString === 'string') {
      // Split on common delimiters and clean up
      return expressionString.split(/[,;]/)
        .map(expr => expr.trim().toLowerCase())
        .filter(expr => expr.length > 0)
        .slice(0, 5); // Limit to 5 expressions
    }
    return ['peaceful'];
  }

  /**
   * Parse recommendation arrays from AI response
   */
  parseRecommendationArray(input) {
    if (Array.isArray(input)) {
      return input.slice(0, 5); // Limit to 5 items
    }
    if (typeof input === 'string') {
      return input.split(/[,;]/)
        .map(item => item.trim().toLowerCase())
        .filter(item => item.length > 0)
        .slice(0, 5);
    }
    return ['gentle', 'natural'];
  }

  /**
   * Ensure analysis object has all required properties with fallbacks
   * @param {Object} analysis - Parsed analysis object
   * @returns {Object} - Analysis with guaranteed structure
   */
  ensureAnalysisStructure(analysis) {
    return {
      personCharacteristics: {
        estimatedAge: analysis?.personCharacteristics?.estimatedAge || 'not determined',
        expressions: Array.isArray(analysis?.personCharacteristics?.expressions) 
          ? analysis.personCharacteristics.expressions 
          : ['peaceful'],
        setting: analysis?.personCharacteristics?.setting || 'not determined',
        clothing: analysis?.personCharacteristics?.clothing || 'not determined',
        peopleCount: analysis?.personCharacteristics?.peopleCount || 'solo'
      },
      technicalQuality: {
        resolution: analysis?.technicalQuality?.resolution || 'good',
        lighting: analysis?.technicalQuality?.lighting || 'natural',
        composition: analysis?.technicalQuality?.composition || 'portrait',
        colorPalette: analysis?.technicalQuality?.colorPalette || 'mixed'
      },
      emotionalTone: {
        mood: analysis?.emotionalTone?.mood || 'peaceful',
        energy: analysis?.emotionalTone?.energy || 'calm',
        formality: analysis?.emotionalTone?.formality || 'casual',
        timePeriod: analysis?.emotionalTone?.timePeriod || 'recent'
      },
      recommendations: {
        suggestedColors: Array.isArray(analysis?.recommendations?.suggestedColors)
          ? analysis.recommendations.suggestedColors
          : ['soft', 'warm'],
        decorativeElements: Array.isArray(analysis?.recommendations?.decorativeElements)
          ? analysis.recommendations.decorativeElements
          : ['gentle', 'natural'],
        overallTone: analysis?.recommendations?.overallTone || 'respectful'
      },
      confidence: analysis?.confidence || 'medium'
    };
  }

  /**
   * Manual parsing fallback for analysis text
   * @param {string} text - AI response text
   * @returns {Object} - Parsed analysis object
   */
  manualParseAnalysis(text) {
    const analysis = {
      personCharacteristics: {
        estimatedAge: this.extractValue(text, 'age'),
        expressions: this.extractArray(text, 'expression', 'mood'),
        setting: this.extractValue(text, 'setting', 'environment'),
        clothing: this.extractValue(text, 'clothing'),
        peopleCount: this.extractValue(text, 'people', 'person')
      },
      technicalQuality: {
        resolution: this.extractValue(text, 'resolution', 'clarity'),
        lighting: this.extractValue(text, 'lighting'),
        composition: this.extractValue(text, 'composition'),
        colorPalette: this.extractValue(text, 'color', 'palette')
      },
      emotionalTone: {
        mood: this.extractValue(text, 'mood', 'emotional'),
        energy: this.extractValue(text, 'energy'),
        formality: this.extractValue(text, 'formal'),
        timePeriod: this.extractValue(text, 'time', 'period', 'vintage')
      },
      recommendations: {
        suggestedColors: this.extractArray(text, 'color'),
        decorativeElements: this.extractArray(text, 'decorative', 'element'),
        overallTone: this.extractValue(text, 'tone', 'feeling')
      }
    };

    return analysis;
  }

  /**
   * Extract single value from analysis text
   */
  extractValue(text, ...keywords) {
    const lines = text.toLowerCase().split('\n');
    for (const keyword of keywords) {
      for (const line of lines) {
        if (line.includes(keyword)) {
          // Extract value after colon or parentheses
          const match = line.match(new RegExp(`${keyword}[^:]*:?\\s*([^,\\n\\(]+)`, 'i'));
          if (match) return match[1].trim();
        }
      }
    }
    return 'not determined';
  }

  /**
   * Extract array values from analysis text
   */
  extractArray(text, ...keywords) {
    const values = [];
    const lines = text.toLowerCase().split('\n');
    for (const keyword of keywords) {
      for (const line of lines) {
        if (line.includes(keyword)) {
          const matches = line.match(/([a-z]+(?:\s+[a-z]+)*)/gi);
          if (matches) values.push(...matches);
        }
      }
    }
    return [...new Set(values)].slice(0, 3); // Remove duplicates, limit to 3
  }

  /**
   * Determine best memorial style based on analysis
   * @param {Object} analysis - Photo analysis results
   * @returns {string} - Suggested memorial style ID
   */
  determineBestMemorialStyle(analysis) {
    try {
      // Safely extract properties with fallbacks
      const emotionalTone = analysis?.emotionalTone || {};
      const personCharacteristics = analysis?.personCharacteristics || {};
      
      // Safe string conversion with fallbacks
      const mood = String(emotionalTone.mood || '').toLowerCase();
      const energy = String(emotionalTone.energy || '').toLowerCase();
      const age = String(personCharacteristics.estimatedAge || '').toLowerCase();
      const expressions = Array.isArray(personCharacteristics.expressions) ? 
        personCharacteristics.expressions.join(' ').toLowerCase() : String(personCharacteristics.expressions || '').toLowerCase();

      console.log('Determining memorial style from analysis:', {
        mood,
        energy,
        age,
        expressions: expressions.substring(0, 50) + (expressions.length > 50 ? '...' : '')
      });

      // Logic to suggest memorial style based on analysis
      if (mood.includes('joy') || mood.includes('happy') || mood.includes('cheerful') || mood.includes('warm') ||
          energy.includes('high') || expressions.includes('smiling') || expressions.includes('happy') || 
          expressions.includes('cheerful') || expressions.includes('joyful') || expressions.includes('warm')) {
        console.log('Selected: celebration_of_life (joyful/happy indicators)');
        return 'celebration_of_life';
      }
      
      if (mood.includes('peaceful') || mood.includes('serene') || 
          energy.includes('calm') || expressions.includes('peaceful')) {
        console.log('Selected: peaceful_remembrance (peaceful indicators)');
        return 'peaceful_remembrance';
      }
      
      if (mood.includes('love') || mood.includes('intimate') || 
          mood.includes('romantic') || expressions.includes('loving')) {
        console.log('Selected: eternal_love (love/intimate indicators)');
        return 'eternal_love';
      }
      
      if (mood.includes('strong') || mood.includes('confident') || 
          age.includes('young') || expressions.includes('confident')) {
        console.log('Selected: heroic_tribute (strong/confident indicators)');
        return 'heroic_tribute';
      }
      
      if (mood.includes('gentle') || age.includes('elderly') || 
          mood.includes('spiritual') || expressions.includes('gentle')) {
        console.log('Selected: gentle_farewell (gentle/elderly indicators)');
        return 'gentle_farewell';
      }

      // Default fallback with logging
      console.log('Selected: celebration_of_life (default fallback)');
      return 'celebration_of_life';
      
    } catch (error) {
      console.error('Error in determineBestMemorialStyle:', error);
      console.log('Selected: celebration_of_life (error fallback)');
      return 'celebration_of_life';
    }
  }

  /**
   * Get fallback analysis when AI analysis fails
   * @returns {Object} - Basic fallback analysis
   */
  getFallbackAnalysis() {
    return {
      personCharacteristics: {
        estimatedAge: 'not determined',
        expressions: ['peaceful'],
        setting: 'not determined',
        clothing: 'not determined',
        peopleCount: 'solo'
      },
      technicalQuality: {
        resolution: 'good',
        lighting: 'natural',
        composition: 'portrait',
        colorPalette: 'mixed'
      },
      emotionalTone: {
        mood: 'peaceful',
        energy: 'calm',
        formality: 'casual',
        timePeriod: 'recent'
      },
      recommendations: {
        suggestedColors: ['soft', 'warm'],
        decorativeElements: ['gentle', 'natural'],
        overallTone: 'respectful'
      },
      suggestedMemorialStyle: 'celebration_of_life',
      confidence: 'low'
    };
  }

  /**
   * Helper function to encode image to base64
   */
  encodeImageToBase64(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
  }

  /**
   * Helper function to determine MIME type
   */
  getImageMimeType(filename) {
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
}

export default PhotoAnalysisService;