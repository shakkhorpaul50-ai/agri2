
import { GoogleGenAI, Type } from "@google/genai";
import { Field, CropRecommendation, SensorData } from "../types";

/**
 * Multi-Key Rotation System
 * Cycles through up to 3 keys from environment variables.
 */
class RotatingAIProvider {
  private keys: string[];
  private currentIndex: number = 0;
  private instances: Map<string, any> = new Map();

  constructor() {
    const keys: string[] = [];
    try {
      // Safely collect keys from various possible environment locations
      const possibleKeys = [
        process.env.GEMINI_API_KEY,
        (process as any).env.API_KEY,
        (process as any).env.VITE_GEMINI_API_KEY,
        (process as any).env.API_KEY_2,
        (process as any).env.API_KEY_3
      ];
      
      possibleKeys.forEach(k => {
        if (k && typeof k === 'string' && k.length > 5) {
          keys.push(k);
        }
      });
    } catch (e) {
      console.warn("Environment access restricted:", e);
    }
    
    this.keys = Array.from(new Set(keys));
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

const MODEL_NAME = 'gemini-2.5-flash';
const DYNAMIC_CONFIG = {
  temperature: 0.1, // Low temperature for better JSON formatting
  topP: 0.95,
  topK: 40
};

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

export const getCropAnalysis = async (field: Field, latestData: AnalysisData): Promise<CropRecommendation[]> => {
  try {
    const prompt = `Suggest 3 best crops based on this telemetry: ${formatDataForPrompt({...latestData, ...field})}. 
    Return the result as a raw JSON array of objects with these fields: name (string), suitability (number 0-100), yield (string), requirements (string), fertilizer (string), icon (string).
    Do not include any markdown formatting or explanations. Just the JSON array.`;
    
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: prompt,
      config: DYNAMIC_CONFIG
    });
    
    const text = response.text;
    console.log("AI Raw Response (Crops):", text);
    return cleanAndParseJSON(text) || getFallbackCrops(latestData);
  } catch (error) {
    console.error("Crop Analysis Error:", error);
    return getFallbackCrops(latestData);
  }
};

export const getSoilHealthSummary = async (field: Field, latestData: AnalysisData): Promise<SoilInsight> => {
  try {
    const prompt = `Provide Soil Restoration Strategy for: ${formatDataForPrompt({...latestData, ...field})}. 
    Return as a raw JSON object with fields: summary (string), soil_fertilizer (string).
    No markdown, just raw JSON.`;
    
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: prompt,
      config: DYNAMIC_CONFIG
    });
    return cleanAndParseJSON(response.text) || getFallbackSoilInsight(latestData);
  } catch (error) {
    console.error("Soil Health Error:", error);
    return getFallbackSoilInsight(latestData);
  }
};

export const getManagementPrescriptions = async (field: Field, latestData: AnalysisData): Promise<ManagementPrescription> => {
  try {
    const prompt = `Create management prescriptions for: ${formatDataForPrompt({...latestData, ...field})}. 
    Return as a raw JSON object with fields: irrigation (object with needed:boolean, volume:string, schedule:string), nutrient (object with needed:boolean, fertilizers:array of {type:string, amount:string}, advice:string).
    No markdown, just raw JSON.`;
    
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: prompt,
      config: DYNAMIC_CONFIG
    });
    return cleanAndParseJSON(response.text) || getFallbackPrescription(latestData);
  } catch (error) {
    console.error("Prescription Error:", error);
    return getFallbackPrescription(latestData);
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: AnalysisData) => {
  try {
    const prompt = `Build a 4-step Operational Roadmap for: ${formatDataForPrompt({...latestData, ...field})}. 
    Return as a raw JSON array of objects with fields: priority (string), title (string), description (string), icon (string).
    No markdown, just raw JSON.`;
    
    const response = await aiProvider.generate({
      model: MODEL_NAME,
      contents: prompt,
      config: DYNAMIC_CONFIG
    });
    return cleanAndParseJSON(response.text) || getFallbackPlan(latestData);
  } catch (error) {
    console.error("Management Plan Error:", error);
    return getFallbackPlan(latestData);
  }
};

// --- DYNAMIC DATA-AWARE FALLBACKS ---

const getFallbackCrops = (data: AnalysisData): CropRecommendation[] => {
  return [
    { name: "Syncing AI Node...", suitability: 0, yield: "N/A", requirements: "The AI is currently processing your telemetry. Please ensure your API key is active.", fertilizer: "N/A", icon: "fa-spinner" }
  ];
};

const getFallbackSoilInsight = (data: AnalysisData): SoilInsight => {
  return {
    summary: "AI Node Synchronization in progress...",
    soil_fertilizer: "Waiting for intelligence synthesis..."
  };
};

const getFallbackPrescription = (data: AnalysisData): ManagementPrescription => {
  return {
    irrigation: { needed: false, volume: "N/A", schedule: "N/A" },
    nutrient: { needed: false, fertilizers: [], advice: "N/A" }
  };
};

const getFallbackPlan = (data: AnalysisData) => {
  return [
    { priority: "LOW", title: "Awaiting AI", description: "The system is synchronizing with the intelligence node.", icon: "fa-sync" }
  ];
};
