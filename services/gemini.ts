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
    if (val === undefined || val === null) return `${label}: [MISSING]`;
    return `${label}: ${Number(val).toFixed(2)}${unit}`;
  };

  const npkStatus = (data.npk_n !== undefined) 
    ? `Nitrogen=${data.npk_n}, Phosphorus=${data.npk_p}, Potassium=${data.npk_k}` 
    : "[SENSORS OFFLINE]";

  return `
    [SENSOR PROFILE]
    MOISTURE: ${format('moisture', 'Value', '%')}
    pH: ${format('ph_level', 'Value')}
    NPK: ${npkStatus}
    TEMP: ${format('temperature', 'Value', '°C')}
    FIELD: ${data.field_name}, Soil: ${data.soil_type}
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

export interface SoilCropDiagnostic {
  suitability_index: number;
  logic: string;
  nutrient_limitation: string;
  suggested_variety: string;
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
      contents: `Suggest 3 crops based on soil metrics: ${formatDataForPrompt({...latestData, ...field})}`,
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

export const getPrecisionSensorCropMatch = async (field: Field, latestData: any): Promise<PrecisionCropMatch | null> => {
  try {
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: `Perform a High-Fidelity Precision Match for this sensor profile: ${formatDataForPrompt({...latestData, ...field})}. 
      Which specific crop variety is the absolute best match for these exact NPK and pH values?`,
      config: {
        systemInstruction: "You are a Bio-Digital Agronomist. Your goal is to analyze specific sensor telemetry (NPK, pH, Moisture) and find the most biologically compatible crop. Output MUST be valid JSON.",
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

export const getSoilToCropDiagnostic = async (field: Field, latestData: any): Promise<SoilCropDiagnostic | null> => {
  try {
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: `Provide a Soil-to-Crop Diagnostic: ${formatDataForPrompt({...latestData, ...field})}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suitability_index: { type: Type.NUMBER },
            logic: { type: Type.STRING },
            nutrient_limitation: { type: Type.STRING },
            suggested_variety: { type: Type.STRING }
          },
          required: ["suitability_index", "logic", "nutrient_limitation", "suggested_variety"]
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
      contents: `Companion intercropping strategy for: ${formatDataForPrompt({...latestData, ...field})}.`,
      config: {
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
      contents: `4-step Roadmap based on: ${formatDataForPrompt({...latestData, ...field})}`,
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
      contents: `Prescriptions for: ${formatDataForPrompt({...latestData, ...field})}`,
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