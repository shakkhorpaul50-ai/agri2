
import { GoogleGenAI, Type } from "@google/genai";
import { Field, CropRecommendation } from "../types";

/**
 * Multi-Key Rotation System
 * Cycles through available keys to prevent quota exhaustion.
 */
class RotatingAIProvider {
  private keys: string[];
  private currentIndex: number = 0;

  constructor() {
    // Collect keys from environment variables
    this.keys = [
      process.env.API_KEY,
      (process as any).env.API_KEY_2,
      (process as any).env.API_KEY_3
    ].filter(k => k && k.length > 5) as string[];
  }

  private getNextClient() {
    if (this.keys.length === 0) throw new Error("NO_API_KEYS_AVAILABLE");
    const key = this.keys[this.currentIndex];
    return new GoogleGenAI({ apiKey: key });
  }

  private rotate() {
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    console.warn(`Rotating to API Key Index: ${this.currentIndex}`);
  }

  /**
   * Executes a prompt with automatic retry on 429/quota errors
   */
  async generateWithRotation(params: any, retries = 2): Promise<any> {
    try {
      const ai = this.getNextClient();
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const isQuotaError = error.message?.includes("429") || error.message?.includes("quota");
      if (isQuotaError && retries > 0 && this.keys.length > 1) {
        this.rotate();
        return this.generateWithRotation(params, retries - 1);
      }
      throw error;
    }
  }
}

const aiProvider = new RotatingAIProvider();

export const isAiReady = async () => {
  return !!process.env.API_KEY;
};

const cleanAndParseJSON = (text: string | undefined) => {
  if (!text) return null;
  try {
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    return null;
  }
};

/**
 * Strict Data Formatting
 * Forces the AI to acknowledge telemetry before reasoning.
 */
const formatDataForPrompt = (data: any) => {
  const safeVal = (val: any) => (val != null && !isNaN(Number(val))) ? Number(val).toFixed(2) : "N/A";
  
  return `
    [ACTUAL SENSOR TELEMETRY - MANDATORY CONTEXT]
    - Moisture: ${safeVal(data.moisture)}% (CRITICAL: <20% is extreme drought, >80% is waterlogged)
    - pH: ${safeVal(data.ph_level)} (CRITICAL: <5.5 is highly acidic)
    - NPK (ppm): Nitrogen=${safeVal(data.npk_n)}, Phosphorus=${safeVal(data.npk_p)}, Potassium=${safeVal(data.npk_k)}
    - Temp: ${safeVal(data.temperature)}°C
    - Soil: ${data.soil_type || 'Loamy'}

    [STRICT INSTRUCTION]
    You are a precision agronomist. Use the NUMBERS above. If moisture is ${safeVal(data.moisture)}%, your advice MUST address that specific level. Do not provide generic winter/summer advice if the sensors show otherwise.
  `;
};

const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';

export interface SoilInsight {
  summary: string;
  soil_fertilizer: string;
}

export interface ManagementPrescription {
  irrigation: {
    needed: boolean;
    volume: string;
    schedule: string;
  };
  nutrient: {
    needed: boolean;
    fertilizers: { type: string; amount: string }[];
    advice: string;
  };
}

export const getCropAnalysis = async (field: Field, latestData: any): Promise<CropRecommendation[]> => {
  try {
    const response = await aiProvider.generateWithRotation({
      model: MODEL_NAME,
      contents: `Based on these specific readings, suggest 3 crops: ${formatDataForPrompt({...latestData, ...field})}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              suitability: { type: Type.NUMBER },
              yield: { type: Type.STRING },
              requirements: { type: Type.STRING },
              fertilizer: { type: Type.STRING },
              icon: { type: Type.STRING }
            },
            required: ["name", "suitability", "yield", "requirements", "fertilizer", "icon"]
          }
        }
      }
    });
    return cleanAndParseJSON(response.text) || [];
  } catch (error) {
    console.error("Gemini 2.5 Flash Rotation Error:", error);
    return [];
  }
};

export const getSoilHealthSummary = async (field: Field, latestData: any): Promise<SoilInsight> => {
  try {
    const response = await aiProvider.generateWithRotation({
      model: MODEL_NAME,
      contents: `Synthesize a soil restoration summary based on: ${formatDataForPrompt({...latestData, ...field})}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            soil_fertilizer: { type: Type.STRING }
          },
          required: ["summary", "soil_fertilizer"]
        }
      }
    });
    return cleanAndParseJSON(response.text) || { summary: "Syncing data...", soil_fertilizer: "Calculating..." };
  } catch (error) {
    return { summary: "Analysis temporarily offline.", soil_fertilizer: "Check local sensors." };
  }
};

export const getManagementPrescriptions = async (field: Field, latestData: any): Promise<ManagementPrescription> => {
  try {
    const response = await aiProvider.generateWithRotation({
      model: MODEL_NAME,
      contents: `Generate irrigation and nutrient plan: ${formatDataForPrompt({...latestData, ...field})}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            irrigation: {
              type: Type.OBJECT,
              properties: {
                needed: { type: Type.BOOLEAN },
                volume: { type: Type.STRING },
                schedule: { type: Type.STRING }
              },
              required: ["needed", "volume", "schedule"]
            },
            nutrient: {
              type: Type.OBJECT,
              properties: {
                needed: { type: Type.BOOLEAN },
                fertilizers: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      amount: { type: Type.STRING }
                    },
                    required: ["type", "amount"]
                  }
                },
                advice: { type: Type.STRING }
              },
              required: ["needed", "fertilizers", "advice"]
            }
          },
          required: ["irrigation", "nutrient"]
        }
      }
    });
    return cleanAndParseJSON(response.text);
  } catch (error) {
    throw error;
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const response = await aiProvider.generateWithRotation({
      model: MODEL_NAME,
      contents: `Action roadmap based on sensors: ${formatDataForPrompt({...latestData, ...field})}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              priority: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              icon: { type: Type.STRING }
            },
            required: ["priority", "title", "description", "icon"]
          }
        }
      }
    });
    return cleanAndParseJSON(response.text) || [];
  } catch (error) {
    return [];
  }
};
