
import { GoogleGenAI, Type } from "@google/genai";
import { Field, CropRecommendation } from "../types";

/**
 * Multi-Key Rotation System
 * Cycles through up to 3 keys from environment variables.
 */
class RotatingAIProvider {
  private keys: string[];
  private currentIndex: number = 0;
  private instances: Map<string, any> = new Map();

  constructor() {
    this.keys = [
      process.env.API_KEY,
      (process as any).env.API_KEY_2,
      (process as any).env.API_KEY_3
    ].filter(k => k && k.length > 5) as string[];
  }

  private getClient() {
    if (this.keys.length === 0) {
      throw new Error("No API keys configured. Ensure process.env.API_KEY is defined.");
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

  async generate(params: any, retries = 2): Promise<any> {
    try {
      const ai = this.getClient();
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
 * Comprehensive Telemetry Context
 */
const formatDataForPrompt = (data: any) => {
  const safeVal = (val: any) => (val != null && !isNaN(Number(val))) ? Number(val).toFixed(2) : "N/A";
  
  return `
    [SENSOR DATA PILLARS]
    1. MOISTURE: ${safeVal(data.moisture)}% (Thresholds: <20% Dry, >75% Saturated)
    2. pH LEVEL: ${safeVal(data.ph_level)} (Acidity: <5.5 is harmful for NPK absorption)
    3. NPK PROFILE (ppm): Nitrogen=${safeVal(data.npk_n)}, Phosphorus=${safeVal(data.npk_p)}, Potassium=${safeVal(data.npk_k)}
    4. TEMPERATURE: ${safeVal(data.temperature)}°C
    
    FIELD CONTEXT: ${data.field_name} at ${data.location}, Soil Type: ${data.soil_type || 'Loamy'}.
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
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: `Suggest 3 crops considering NPK levels and Temperature constraints: ${formatDataForPrompt({...latestData, ...field})}`,
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
    return cleanAndParseJSON(response.text) || getFallbackCrops(latestData);
  } catch (error) {
    return getFallbackCrops(latestData);
  }
};

export const getSoilHealthSummary = async (field: Field, latestData: any): Promise<SoilInsight> => {
  try {
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: `Provide a Soil Restoration Strategy focusing on pH, Moisture and NPK balance. Analyze how pH ${latestData.ph_level} affects nutrient availability: ${formatDataForPrompt({...latestData, ...field})}`,
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
    return cleanAndParseJSON(response.text) || getFallbackSoilInsight(latestData);
  } catch (error) {
    return getFallbackSoilInsight(latestData);
  }
};

export const getManagementPrescriptions = async (field: Field, latestData: any): Promise<ManagementPrescription> => {
  try {
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: `Create exact irrigation and nutrient prescriptions for these specific pillars: ${formatDataForPrompt({...latestData, ...field})}`,
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
    return cleanAndParseJSON(response.text) || getFallbackPrescription(latestData);
  } catch (error) {
    return getFallbackPrescription(latestData);
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: `Build a 4-step Operational Roadmap. Step 1 must address Moisture/Temp, Step 2 pH, Step 3 NPK, and Step 4 Long-term health: ${formatDataForPrompt({...latestData, ...field})}`,
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
    return cleanAndParseJSON(response.text) || getFallbackPlan(latestData);
  } catch (error) {
    return getFallbackPlan(latestData);
  }
};

// --- DYNAMIC DATA-AWARE FALLBACKS ---

const getFallbackCrops = (data: any): CropRecommendation[] => {
  const isDry = (data.moisture || 45) < 20;
  return [
    { name: isDry ? "Millets" : "Hybrid Rice", suitability: 90, yield: isDry ? "2.0t/ha" : "7.5t/ha", requirements: "Resilient to current temp.", fertilizer: "Urea (High Nitrogen)", icon: "fa-wheat-awn" },
    { name: "Potato", suitability: 82, yield: "22t/ha", requirements: "Needs loose soil.", fertilizer: "MOP (Potassium rich)", icon: "fa-potato" },
    { name: "Eggplant", suitability: 75, yield: "18t/ha", requirements: "High Nitrogen needs.", fertilizer: "Organic Compost", icon: "fa-seedling" }
  ];
};

const getFallbackSoilInsight = (data: any): SoilInsight => {
  const isDry = (data.moisture || 45) < 20;
  const isAcidic = (data.ph_level || 6.5) < 5.5;
  return {
    summary: `Restoration priority: ${isDry ? 'WATER REPLENISHMENT' : (isAcidic ? 'pH CORRECTION' : 'NUTRIENT BOOST')}. Sensors show ${data.moisture.toFixed(0)}% moisture and ${data.ph_level.toFixed(1)} pH.`,
    soil_fertilizer: isAcidic ? "Apply 250kg Agricultural Lime to neutralize acidity." : (isDry ? "Deep-bore irrigation required immediately." : "Apply 100kg balanced NPK complex.")
  };
};

const getFallbackPrescription = (data: any): ManagementPrescription => {
  const isDry = (data.moisture || 45) < 20;
  return {
    irrigation: { needed: isDry, volume: isDry ? "15,000L/ha" : "Maintain monitoring", schedule: "Early Morning (5 AM)" },
    nutrient: { needed: true, fertilizers: [{ type: "Urea", amount: "50kg" }, { type: "TSP", amount: "30kg" }], advice: "Apply after first irrigation cycle." }
  };
};

const getFallbackPlan = (data: any) => {
  const isDry = (data.moisture || 45) < 20;
  return [
    { priority: isDry ? "CRITICAL" : "NORMAL", title: "Moisture Sync", description: isDry ? "Immediate hydration required to prevent root wilting." : "Moisture levels stable, monitor daily.", icon: "fa-droplet" },
    { priority: "HIGH", title: "pH Stabilization", description: "Ensure pH is within 6.0-7.0 range for NPK uptake.", icon: "fa-scale-balanced" },
    { priority: "MEDIUM", title: "NPK Amendment", description: "Apply Phosphorus-rich fertilizer to boost root vigor.", icon: "fa-flask" },
    { priority: "LOW", title: "Temperature Shielding", description: "Apply mulch if soil temp exceeds 30°C.", icon: "fa-sun" }
  ];
};
