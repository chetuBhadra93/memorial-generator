import axios from "axios";
import {
  AnalysisResponse,
  SessionResponse,
  SessionDetailsResponse,
  PhotoAnalysis,
  CulturalContext,
} from "../types/memorial";

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api`;

class MemorialService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60 second timeout for AI operations
  });

  /**
   * Analyze uploaded photo to get AI insights and style suggestions
   */
  async analyzePhoto(photoFile: File): Promise<AnalysisResponse> {
    try {
      const formData = new FormData();
      formData.append("photo", photoFile);

      const response = await this.apiClient.post<AnalysisResponse>(
        "/analyze-photo",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Photo analysis failed:", error);

      if (error.code === "ECONNABORTED") {
        throw new Error("Photo analysis timed out. Please try again.");
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error(
          "Failed to analyze photo. Please check your connection."
        );
      }
    }
  }

  /**
   * Create a new memorial session with enhanced analysis
   */
  async createMemorialSession(
    photoFile: File,
    personName: string,
    description: string,
    culturalContext?: CulturalContext
  ): Promise<SessionResponse> {
    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      formData.append("personName", personName);
      formData.append("description", description);

      if (culturalContext) {
        formData.append("culturalContext", JSON.stringify(culturalContext));
      }

      const response = await this.apiClient.post<SessionResponse>(
        "/create-memorial-session",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Memorial session creation failed:", error);

      if (error.code === "ECONNABORTED") {
        throw new Error("Session creation timed out. Please try again.");
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error(
          "Failed to create memorial session. Please check your connection."
        );
      }
    }
  }

  /**
   * Get memorial session details including generated memorials
   */
  async getMemorialSession(sessionId: string): Promise<SessionDetailsResponse> {
    try {
      const response = await this.apiClient.get<SessionDetailsResponse>(
        `/memorial-session/${sessionId}`
      );

      return response.data;
    } catch (error: any) {
      console.error("Failed to retrieve memorial session:", error);

      if (error.response?.status === 404) {
        throw new Error("Memorial session not found.");
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error(
          "Failed to retrieve memorial session. Please check your connection."
        );
      }
    }
  }

  async generateMemorialFromSession(
    sessionId: string,
    greetingType?: string
  ): Promise<any> {
    try {
      const response = await this.apiClient.post(
        `/generate-memorial/${sessionId}`,
        {
          greetingType,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Memorial generation from session failed:", error);

      if (error.code === "ECONNABORTED") {
        throw new Error("Memorial generation timed out. Please try again.");
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error(
          "Failed to generate memorial. Please check your connection."
        );
      }
    }
  }

  async generateMemorialPoster(
    photoFile: File,
    personName: string,
    description: string,
    greetingType: string
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      formData.append("personName", personName);
      formData.append("description", description);
      formData.append("greetingType", greetingType);

      const response = await this.apiClient.post("/generate-poster", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Memorial poster generation failed:", error);

      if (error.code === "ECONNABORTED") {
        throw new Error("Generation timed out. Please try again.");
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error(
          "Failed to generate memorial poster. Please check your connection."
        );
      }
    }
  }

  /**
   * Safely convert any value to string, handling objects and arrays
   * @param value - Value to convert
   * @returns Safe string representation
   */
  private safeStringConvert(value: any): string {
    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "object" && value !== null) {
      // If it's an object, extract meaningful string values
      if (Array.isArray(value)) {
        return value.filter((v) => v && typeof v === "string").join(", ");
      } else {
        const values = Object.values(value).filter(
          (v) => v && typeof v === "string"
        );
        if (values.length > 0) {
          return values.join(", ");
        }
      }
    }

    return String(value || "");
  }

  /**
   * Get smart greeting type recommendations based on photo analysis
   */
  getGreetingRecommendations(analysis: PhotoAnalysis): {
    recommended: string;
    alternatives: Array<{ id: string; score: number; reason: string }>;
  } {
    const { emotionalTone, personCharacteristics } = analysis;

    // Safe string conversion with fallbacks
    const mood = this.safeStringConvert(emotionalTone.mood).toLowerCase();
    const energy = this.safeStringConvert(emotionalTone.energy).toLowerCase();
    const age = this.safeStringConvert(
      personCharacteristics.estimatedAge
    ).toLowerCase();
    const expressions = Array.isArray(personCharacteristics.expressions)
      ? personCharacteristics.expressions.join(" ").toLowerCase()
      : this.safeStringConvert(personCharacteristics.expressions).toLowerCase();

    // Scoring system for each greeting type
    const scores = {
      celebration_of_life: 0,
      peaceful_remembrance: 0,
      eternal_love: 0,
      heroic_tribute: 0,
      gentle_farewell: 0,
    };

    // Score based on mood
    if (
      mood.includes("joy") ||
      mood.includes("happy") ||
      expressions.includes("smiling")
    ) {
      scores.celebration_of_life += 3;
    }
    if (
      mood.includes("peaceful") ||
      mood.includes("serene") ||
      mood.includes("calm")
    ) {
      scores.peaceful_remembrance += 3;
      scores.gentle_farewell += 1;
    }
    if (
      mood.includes("love") ||
      mood.includes("intimate") ||
      mood.includes("romantic")
    ) {
      scores.eternal_love += 3;
    }
    if (
      mood.includes("strong") ||
      mood.includes("confident") ||
      mood.includes("determined")
    ) {
      scores.heroic_tribute += 3;
    }

    // Score based on energy
    if (
      energy.includes("high") ||
      energy.includes("dynamic") ||
      energy.includes("vibrant")
    ) {
      scores.celebration_of_life += 2;
      scores.heroic_tribute += 1;
    }
    if (
      energy.includes("calm") ||
      energy.includes("low") ||
      energy.includes("peaceful")
    ) {
      scores.peaceful_remembrance += 2;
      scores.gentle_farewell += 2;
    }

    // Score based on age
    if (age.includes("child") || age.includes("young")) {
      scores.celebration_of_life += 1;
      scores.heroic_tribute += 1;
    }
    if (age.includes("elderly") || age.includes("senior")) {
      scores.gentle_farewell += 2;
      scores.peaceful_remembrance += 1;
    }

    // Find the highest scoring option
    const sortedScores = Object.entries(scores)
      .map(([id, score]) => ({
        id,
        score,
        reason: this.getRecommendationReason(id, analysis),
      }))
      .sort((a, b) => b.score - a.score);

    return {
      recommended: sortedScores[0].id,
      alternatives: sortedScores.slice(1, 3), // Top 2 alternatives
    };
  }

  /**
   * Generate explanation for why a greeting type is recommended
   */
  private getRecommendationReason(
    greetingType: string,
    analysis: PhotoAnalysis
  ): string {
    const { emotionalTone, personCharacteristics } = analysis;

    switch (greetingType) {
      case "celebration_of_life":
        return `The joyful expression and ${emotionalTone.energy} energy in this photo suggest a celebration of their vibrant life.`;
      case "peaceful_remembrance":
        return `The ${emotionalTone.mood} mood and ${emotionalTone.formality} setting convey a sense of peaceful reflection.`;
      case "eternal_love":
        return `The intimate nature and warm emotional tone suggest a focus on enduring love and connection.`;
      case "heroic_tribute":
        return `The confident expression and strong presence indicate a tribute to their inspiring qualities.`;
      case "gentle_farewell":
        return `The gentle expressions and serene atmosphere suggest a soft, comforting farewell.`;
      default:
        return "This style matches the overall tone and feeling of the photograph.";
    }
  }

  /**
   * Extract key insights from photo analysis for display
   */
  getAnalysisInsights(analysis: PhotoAnalysis): string[] {
    const insights = [];

    const age = this.safeStringConvert(
      analysis.personCharacteristics.estimatedAge
    );
    if (age !== "not determined" && age) {
      insights.push(`Appears to be ${age}`);
    }

    const mood = this.safeStringConvert(analysis.emotionalTone.mood);
    if (mood !== "not determined" && mood) {
      insights.push(`Emotional tone: ${mood}`);
    }

    const lighting = this.safeStringConvert(analysis.technicalQuality.lighting);
    if (lighting !== "not determined" && lighting) {
      insights.push(`Photo quality: ${lighting} lighting`);
    }

    const setting = this.safeStringConvert(
      analysis.personCharacteristics.setting
    );
    if (setting !== "not determined" && setting) {
      insights.push(`Setting: ${setting}`);
    }

    const overallTone = this.safeStringConvert(
      analysis.recommendations.overallTone
    );
    if (overallTone !== "not determined" && overallTone) {
      insights.push(`Recommended tone: ${overallTone}`);
    }

    return insights.slice(0, 4); // Limit to top 4 insights
  }
}

export default new MemorialService();
