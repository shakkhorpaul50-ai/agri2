import { GoogleGenAI, Type } from "@google/genai";
import { Field, CropRecommendation } from "../types";

/**
 * Multi-Key Rotation System
 * Cycles through keys to handle quota limits efficiently.
 */
class RotatingAIProvider {
  private keys: string[];
  private currentIndex: number = 0;
  private instances: Map<string, any> = new Map();

  constructor() {
    const env = (typeof process !== 'undefined' && process.env) ? process.env : { API_KEY: '' };
    this.keys = [
      env.API_KEY,
      (env as any).API_KEY_2,
      (env as any).API_KEY_3
    ].filter(k => k && k.length > 5) as string[];
  }

  private getClient() {
    if (this.keys.length === 0) {
      console.warn("No API keys configured. AI features will be disabled.");
    }
    const key = this.keys[this.currentIndex];
    if (key && !this.instances.has(key)) {
      this.instances.set(key, new GoogleGenAI({ apiKey: key }));
    }
    return key ? this.instances.get(key) : null;
  }

  private rotate() {
    if (this.keys.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    }
  }

  async generate(params: any, retries = 2): Promise<any> {
    const ai = this.getClient();
    if (!ai) return { text: "{}" };
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const errorMsg = error.message?.toLowerCase() || "";
      const isRetryable = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("rate limit");
      if (isRetryable && retries > 0) {
        this.rotate();
        await new Promise(resolve => setTimeout(resolve, 300));
        return this.generate(params, retries - 1);
      }
      throw error;
    }
  }
}

const aiProvider = new RotatingAIProvider();

const cleanAndParseJSON = (text: string | undefined) => {
  if (!text) return null;
  try {
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    return null;
  }
};

const formatDataForPrompt = (data: any) => {
  const format = (key: string, label: string, unit: string = '') => {
    const val = data[key];
    if (val === undefined || val === null) return `${label}: [MISSING - SENSOR NOT REGISTERED]`;
    return `${label}: ${Number(val).toFixed(2)}${unit}`;
  };

  const npkStatus = (data.npk_n !== undefined) 
    ? `Nitrogen=${data.npk_n}, Phosphorus=${data.npk_p}, Potassium=${data.npk_k}` 
    : "[MISSING - NPK ANALYZER NOT REGISTERED]";

  return `
    [TELEMETRY PILLARS]
    MOISTURE: ${format('moisture', 'Current', '%')}
    pH LEVEL: ${format('ph_level', 'Current')}
    NPK: ${npkStatus}
    TEMP: ${format('temperature', 'Current', '°C')}
    FIELD: ${data.field_name}, Soil: ${data.soil_type || 'Loamy'}
  `;
};

const MODEL_NAME = 'gemini-3-flash-preview';

export interface SoilInsight {
  summary: string;
  soil_fertilizer: string;
}

export interface CompanionAdvisory {
  companion_name: string;
  benefits: string;
  density_per_sqm: string;
  compatibility_score: number;
}

export interface PrecisionCropMatch {
  best_crop: string;
  match_probability: number;
  biological_advantage: string;
  critical_metric: string;
}

export interface ManagementPrescription {
  irrigation: {
    needed: boolean;
    volume: string;
    schedule: string;
  };
  nutrient: {
    needed: boolean;
    fertilizers: Array<{
      type: string;
      amount: string;
    }>;
    advice: string;
  };
}

export const getCropAnalysis = async (field: Field, latestData: any): Promise<CropRecommendation[]> => {
  try {
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: `Recommend 3 crops based on sensor data: ${formatDataForPrompt({...latestData, ...field})}`,
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
  } catch (error) { return []; }
};

export const getPrecisionCropMatch = async (field: Field, latestData: any): Promise<PrecisionCropMatch | null> => {
  try {
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: `Provide a Precision Bio-Match Analysis for this sensor profile: ${formatDataForPrompt({...latestData, ...field})}. 
      Determine which specific crop has the absolute highest biological synergy with these exact Nitrogen and pH levels.`,
      config: {
        systemInstruction: "You are a Digital Agronomist specializing in Bio-Digital Telemetry. Analyze soil sensors to find the single most compatible crop. Focus on the relationship between current pH and Nutrient availability. Output MUST be valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            best_crop: { type: Type.STRING },
            match_probability: { type: Type.NUMBER },
            biological_advantage: { type: Type.STRING },
            critical_metric: { type: Type.STRING }
          },
          required: ["best_crop", "match_probability", "biological_advantage", "critical_metric"]
        }
      }
    });
    return cleanAndParseJSON(response.text);
  } catch (error) { return null; }
};

export const getSoilHealthSummary = async (field: Field, latestData: any): Promise<SoilInsight> => {
  try {
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: `Provide Soil Restoration Strategy for: ${formatDataForPrompt({...latestData, ...field})}`,
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
    return cleanAndParseJSON(response.text) || { summary: "Unavailable", soil_fertilizer: "Check Sensors" };
  } catch (error) { return { summary: "Unavailable", soil_fertilizer: "Check Sensors" }; }
};

export const getCompanionCropAdvisory = async (field: Field, latestData: any): Promise<CompanionAdvisory | null> => {
  try {
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: `Suggest a companion intercropping strategy based on sensor data: ${formatDataForPrompt({...latestData, ...field})}.`,
      config: {
        systemInstruction: "You are an agricultural researcher. Suggest ONE specific companion crop that maximizes land usage and soil health based on current NPK and moisture. Output MUST be valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companion_name: { type: Type.STRING },
            benefits: { type: Type.STRING },
            density_per_sqm: { type: Type.STRING },
            compatibility_score: { type: Type.NUMBER }
          },
          required: ["companion_name", "benefits", "density_per_sqm", "compatibility_score"]
        }
      }
    });
    return cleanAndParseJSON(response.text);
  } catch (error) { return null; }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: `Build a 4-step Operational Roadmap based on sensor data: ${formatDataForPrompt({...latestData, ...field})}`,
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
  } catch (error) { return []; }
};

export const getManagementPrescriptions = async (field: Field, latestData: any): Promise<ManagementPrescription | null> => {
  try {
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: `Provide prescriptions: ${formatDataForPrompt({...latestData, ...field})}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            irrigation: {
              type: Type.OBJECT,
              properties: { needed: { type: Type.BOOLEAN }, volume: { type: Type.STRING }, schedule: { type: Type.STRING } },
              required: ["needed", "volume", "schedule"]
            },
            nutrient: {
              type: Type.OBJECT,
              properties: {
                needed: { type: Type.BOOLEAN },
                fertilizers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, amount: { type: Type.STRING } }, required: ["type", "amount"] } },
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
  } catch (error) { return null; }
};