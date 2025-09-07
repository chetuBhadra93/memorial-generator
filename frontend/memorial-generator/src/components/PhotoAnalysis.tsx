import React from 'react';
import { PhotoAnalysis as PhotoAnalysisType } from '../types/memorial';
import memorialService from '../services/memorialService';

interface PhotoAnalysisProps {
  analysis: PhotoAnalysisType | null;
  isLoading: boolean;
  onStyleSuggestionAccept: (suggestedStyle: string) => void;
}

const PhotoAnalysis: React.FC<PhotoAnalysisProps> = ({ 
  analysis, 
  isLoading, 
  onStyleSuggestionAccept 
}) => {
  if (isLoading) {
    return (
      <div className="analysis-loading">
        <div className="loading-spinner small"></div>
        <p>Analyzing your photo...</p>
        <small>AI is understanding the context and emotion to suggest the best memorial style</small>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const insights = memorialService.getAnalysisInsights(analysis);
  const recommendations = memorialService.getGreetingRecommendations(analysis);
  const confidence = analysis.confidence === 'high' ? '95%' : 
                    analysis.confidence === 'medium' ? '80%' : '65%';

  return (
    <div className="photo-analysis-card">
      <div className="analysis-header">
        <h3>🤖 AI Photo Analysis</h3>
        <span className={`confidence-badge ${analysis.confidence || 'high'}`}>
          {confidence} confidence
        </span>
      </div>

      <div className="analysis-content">
        {/* Key Insights */}
        <div className="insights-section">
          <h4>📋 Key Insights</h4>
          <div className="insights-list">
            {insights.map((insight, index) => (
              <div key={index} className="insight-item">
                <span className="insight-dot"></span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Style Recommendation */}
        <div className="recommendation-section">
          <h4>🎨 Recommended Memorial Style</h4>
          <div className="recommended-style">
            <div className="style-card primary">
              <div className="style-header">
                <span className="style-name">
                  {getStyleDisplayName(recommendations.recommended)}
                </span>
                <button
                  className="accept-suggestion-btn"
                  onClick={() => onStyleSuggestionAccept(recommendations.recommended)}
                >
                  Use This Style
                </button>
              </div>
              <p className="style-reason">
                {recommendations.alternatives.find(alt => alt.id === recommendations.recommended)?.reason ||
                 'This style best matches the emotional tone and context of your photo.'}
              </p>
            </div>
          </div>

          {/* Alternative Styles */}
          {recommendations.alternatives.length > 0 && (
            <div className="alternative-styles">
              <h5>Alternative Options</h5>
              {recommendations.alternatives.slice(0, 2).map((alt) => (
                <div key={alt.id} className="style-card alternative">
                  <div className="style-header">
                    <span className="style-name">
                      {getStyleDisplayName(alt.id)}
                    </span>
                    <span className="style-score">{Math.round(alt.score * 20)}% match</span>
                  </div>
                  <p className="style-reason">{alt.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Analysis (Collapsible) */}
        <details className="detailed-analysis">
          <summary>View Detailed Analysis</summary>
          <div className="analysis-details">
            <div className="detail-section">
              <h5>👤 Person Characteristics</h5>
              <ul>
                <li><strong>Age Range:</strong> {analysis.personCharacteristics.estimatedAge}</li>
                <li><strong>Expression:</strong> {analysis.personCharacteristics.expressions.join(', ')}</li>
                <li><strong>Setting:</strong> {analysis.personCharacteristics.setting}</li>
                <li><strong>Clothing:</strong> {analysis.personCharacteristics.clothing}</li>
              </ul>
            </div>

            <div className="detail-section">
              <h5>📷 Technical Quality</h5>
              <ul>
                <li><strong>Resolution:</strong> {analysis.technicalQuality.resolution}</li>
                <li><strong>Lighting:</strong> {analysis.technicalQuality.lighting}</li>
                <li><strong>Composition:</strong> {analysis.technicalQuality.composition}</li>
                <li><strong>Color Palette:</strong> {analysis.technicalQuality.colorPalette}</li>
              </ul>
            </div>

            <div className="detail-section">
              <h5>💭 Emotional Tone</h5>
              <ul>
                <li><strong>Mood:</strong> {analysis.emotionalTone.mood}</li>
                <li><strong>Energy:</strong> {analysis.emotionalTone.energy}</li>
                <li><strong>Formality:</strong> {analysis.emotionalTone.formality}</li>
                <li><strong>Time Period:</strong> {analysis.emotionalTone.timePeriod}</li>
              </ul>
            </div>

            <div className="detail-section">
              <h5>🎨 AI Recommendations</h5>
              <ul>
                <li><strong>Colors:</strong> {analysis.recommendations.suggestedColors.join(', ')}</li>
                <li><strong>Elements:</strong> {analysis.recommendations.decorativeElements.join(', ')}</li>
                <li><strong>Overall Tone:</strong> {analysis.recommendations.overallTone}</li>
              </ul>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

// Helper function to get display name for greeting types
function getStyleDisplayName(styleId: string): string {
  const styleMap: Record<string, string> = {
    celebration_of_life: '🌟 Celebration of Life',
    peaceful_remembrance: '🕊️ Peaceful Remembrance',
    eternal_love: '💖 Eternal Love',
    heroic_tribute: '🦸 Heroic Tribute',
    gentle_farewell: '🌸 Gentle Farewell'
  };
  
  return styleMap[styleId] || styleId;
}

export default PhotoAnalysis;