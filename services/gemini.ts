
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Field, CropRecommendation, SensorData, SoilInsight, ManagementPrescription } from "../types";
import * as localExpert from "./localExpert";

/**
 * Multi-Key Rotation System
 * Cycles through up to 3 keys from environment variables.
 * Optimized for Free Tier rate limits.
 */
class RotatingAIProvider {
  private keys: string[];
  private currentIndex: number = 0;
  private instances: Map<string, any> = new Map();

  constructor() {
    const keys: string[] = [];
    try {
      const possibleKeys = [
        process.env.GEMINI_API_KEY,
        (process as any).env.API_KEY,
        (process as any).env.VITE_GEMINI_API_KEY,
        (process as any).env.API_KEY_2,
        (process as any).env.API_KEY_3
      ];
      
      possibleKeys.forEach(k => {
        if (k && typeof k === 'string' && k.length > 10 && k !== "undefined" && k !== "null") {
          keys.push(k);
        }
      });
    } catch (e) {
      console.warn("Environment access restricted:", e);
    }
    
    this.keys = Array.from(new Set(keys));
    if (this.keys.length === 0) {
      console.error("CRITICAL: No valid Gemini API keys found. AI features will be disabled.");
    }
  }

  private getClient() {
    if (this.keys.length === 0) {
      throw new Error("No API keys configured.");
    }
    const key = this.keys[this.currentIndex];
    if (!this.instances.has(key)) {
      this.instances.set(key, new GoogleGenAI({ apiKey: key }));
    }
    return this.instances.get(key);
  }

  private rotate() {
    if (this.keys.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    }
  }

  async generate(params: any, retries = 3): Promise<any> {
    try {
      const ai = this.getClient();
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const errorMsg = error.message?.toLowerCase() || "";
      const isRetryable = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("rate limit");
      
      if (isRetryable && retries > 0) {
        this.rotate();
        // Exponential backoff for free tier: 2s, 4s, 8s
        const delay = Math.pow(2, 4 - retries) * 1000;
        console.warn(`Rate limit hit. Retrying in ${delay}ms with key rotation...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.generate(params, retries - 1);
      }
      
      if (isRetryable) {
        console.error("AI Quota Exhausted. Switching to local expert system (Mock Data).");
        throw new Error("QUOTA_EXHAUSTED");
      }
      throw error;
    }
  }
}

const aiProvider = new RotatingAIProvider();

export const isAiReady = async () => {
  return !!(process.env.GEMINI_API_KEY || process.env.API_KEY);
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

type AnalysisData = Partial<SensorData> & { soil_type?: string; field_name?: string; location?: string };

/**
 * Enhanced Telemetry Context with "Missing" Awareness
 */
const formatDataForPrompt = (data: AnalysisData) => {
  const format = (key: string, label: string, unit: string = '') => {
    const val = (data as any)[key];
    if (val === undefined || val === null) return `${label}: [MISSING]`;
    return `${label}: ${Number(val).toFixed(2)}${unit}`;
  };

  const npkStatus = (data.npk_n !== undefined) 
    ? `N=${data.npk_n}, P=${data.npk_p}, K=${data.npk_k}` 
    : "[MISSING]";

  return `
    [FIELD TELEMETRY]
    - SOIL TYPE: ${data.soil_type || 'Unknown'}
    - MOISTURE: ${format('moisture', 'Value', '%')}
    - pH LEVEL: ${format('ph_level', 'Value')}
    - NPK (N-P-K): ${npkStatus}
    - TEMPERATURE: ${format('temperature', 'Value', '°C')}
    
    [AGRICULTURAL KNOWLEDGE BASE (BARI & KAGGLE SYNC)]
    You must synthesize recommendations by cross-referencing the telemetry against these established patterns:
    1. RICE/BORO RICE: Requires high moisture (60-95%) and clay/peaty soil. Boro rice prefers acidic pH (4-6).
    2. WHEAT/MAIZE: Prefers loamy/alluvial soil with moderate moisture (30-70%). Wheat needs Nitrogen > 60.
    3. COTTON/LINSEED: Thrives in Black soil with lower moisture (20-50%) and slightly alkaline pH (7-8.5).
    4. WATERMELON/GROUNDNUT: Best in Sandy/Red soil with low-to-moderate moisture (10-50%).
    5. POTATO: Needs Loamy/Sandy soil, acidic-to-neutral pH (5.5-6.5), and high Potassium (K > 70).
    6. JUTE/SUGARCANE: Requires Alluvial/Silty soil and high moisture (60-95%).
    7. MILLETS/PULSES: Drought-resistant, works in Red/Black soil with low moisture (10-40%).
    
    INSTRUCTION: You are a real-time Agricultural Expert System. Analyze the [FIELD TELEMETRY] and provide 3 specific crop suggestions. Do not use generic placeholders. If a sensor is [MISSING], state that the recommendation is limited by missing data but still provide the best possible guess based on Soil Type.
  `;
};

const MODEL_NAME = 'gemini-flash-lite-latest';
const DYNAMIC_CONFIG = {
  temperature: 0.1, 
  topP: 0.95,
  topK: 40
};

export const getCropAnalysis = async (field: Field, latestData: AnalysisData): Promise<CropRecommendation[]> => {
  try {
    const prompt = `Suggest 3 best crops based on this telemetry: ${formatDataForPrompt({...latestData, ...field})}. 
    Analyze the intersection of soil type, moisture, pH, and NPK.`;
    
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        ...DYNAMIC_CONFIG,
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
    
    const text = response.text;
    return cleanAndParseJSON(text) || localExpert.getLocalCropAnalysis(field, latestData);
  } catch (error: any) {
    console.error("Crop Analysis Error:", error);
    return localExpert.getLocalCropAnalysis(field, latestData);
  }
};

export const getSoilHealthSummary = async (field: Field, latestData: AnalysisData): Promise<SoilInsight> => {
  try {
    const prompt = `Provide Soil Restoration Strategy for: ${formatDataForPrompt({...latestData, ...field})}.`;
    
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        ...DYNAMIC_CONFIG,
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
    return cleanAndParseJSON(response.text) || localExpert.getLocalSoilInsight(field, latestData);
  } catch (error: any) {
    console.error("Soil Health Error:", error);
    return localExpert.getLocalSoilInsight(field, latestData);
  }
};

export const getManagementPrescriptions = async (field: Field, latestData: AnalysisData): Promise<ManagementPrescription> => {
  try {
    const prompt = `Create management prescriptions for: ${formatDataForPrompt({...latestData, ...field})}.`;
    
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        ...DYNAMIC_CONFIG,
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
    return cleanAndParseJSON(response.text) || localExpert.getLocalPrescription(field, latestData);
  } catch (error: any) {
    console.error("Prescription Error:", error);
    return localExpert.getLocalPrescription(field, latestData);
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: AnalysisData) => {
  try {
    const prompt = `Build a 4-step Operational Roadmap for: ${formatDataForPrompt({...latestData, ...field})}.`;
    
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        ...DYNAMIC_CONFIG,
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
    return cleanAndParseJSON(response.text) || localExpert.getLocalManagementPlan(field, latestData);
  } catch (error: any) {
    console.error("Management Plan Error:", error);
    return localExpert.getLocalManagementPlan(field, latestData);
  }
};

// --- DYNAMIC DATA-AWARE FALLBACKS ---

const getFallbackCrops = (data: AnalysisData, isQuotaExhausted = false): CropRecommendation[] => {
  const prefix = isQuotaExhausted ? "[Demo Mode] " : "";
  const soilType = (data.soil_type || "Alluvial").toLowerCase();
  
  if (soilType.includes("clay") || soilType.includes("peaty")) {
    return [
      { name: prefix + "Boro Rice", suitability: 92, yield: "4.5-5.5 Ton/Ha", requirements: "High moisture, acidic pH", fertilizer: "Urea, TSP, MoP", icon: "fa-seedling" },
      { name: prefix + "Jute", suitability: 85, yield: "2.5-3.0 Ton/Ha", requirements: "High humidity, silty soil", fertilizer: "Nitrogen rich", icon: "fa-leaf" },
      { name: prefix + "Sugarcane", suitability: 78, yield: "60-80 Ton/Ha", requirements: "Deep soil, high water", fertilizer: "NPK 120:60:60", icon: "fa-tree" }
    ];
  }
  
  return [
    { name: prefix + "Wheat", suitability: 88, yield: "3.5-4.2 Ton/Ha", requirements: "Cool weather, loamy soil", fertilizer: "DAP, Urea, Gypsum", icon: "fa-wheat-awn" },
    { name: prefix + "Maize", suitability: 82, yield: "7.0-9.0 Ton/Ha", requirements: "Well drained soil", fertilizer: "High Nitrogen", icon: "fa-sun" },
    { name: prefix + "Potato", suitability: 75, yield: "25-30 Ton/Ha", requirements: "Potassium rich soil", fertilizer: "MoP, Urea", icon: "fa-circle" }
  ];
};

const getFallbackSoilInsight = (data: AnalysisData, isQuotaExhausted = false): SoilInsight => {
  const prefix = isQuotaExhausted ? "[Demo Mode] " : "";
  return {
    summary: prefix + "Based on current telemetry, the soil shows moderate fertility. Moisture levels are within acceptable ranges for seasonal crops.",
    soil_fertilizer: prefix + "Recommended: Apply organic compost and balanced NPK (10:10:10) to maintain nutrient levels."
  };
};

const getFallbackPrescription = (data: AnalysisData, isQuotaExhausted = false): ManagementPrescription => {
  return {
    irrigation: { needed: (data.moisture || 0) < 40, volume: "15-20mm", schedule: "Every 3-4 days" },
    nutrient: { needed: true, fertilizers: [{ type: "Urea", amount: "50kg/Ha" }, { type: "DAP", amount: "30kg/Ha" }], advice: "Apply during early morning hours." }
  };
};

const getFallbackPlan = (data: AnalysisData, isQuotaExhausted = false) => {
  return [
    { priority: "HIGH", title: "Moisture Regulation", description: "Maintain soil moisture between 60-70% for optimal growth.", icon: "fa-tint" },
    { priority: "MEDIUM", title: "Nutrient Top-up", description: "Apply secondary nitrogen dose after 15 days of sowing.", icon: "fa-flask" },
    { priority: "LOW", title: "Pest Scouting", description: "Monitor for common seasonal pests every 48 hours.", icon: "fa-bug" }
  ];
};
