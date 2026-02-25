
import { GoogleGenAI, Type } from "@google/genai";
import { Field, CropRecommendation } from "../types";

/**
 * Actual AI Provider
 * Implements reasoning, grounding, and dynamic synthesis.
 */
class AgricareAI {
  private ai: GoogleGenAI;
  private modelName = "gemini-2.5-flash-preview-09-2025";

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY is required");
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Core generation logic with System Instructions and Search Grounding
   */
  async synthesize(prompt: string, schema?: any) {
    const config: any = {
      systemInstruction: `You are the Agricare "Harvest Intelligence Engine," a world-class agronomist specializing in South Asian agriculture (BARI/BRRI standards). 
      Your goal is to provide high-precision, data-driven agricultural prescriptions.
      
      REASONING PROTOCOL:
      1. Analyze the provided telemetry (pH, NPK, Moisture, Temp).
      2. Cross-reference with the BARI/Kaggle 6,000-record dataset logic (Rice for high moisture/clay, Wheat/Maize for high N, etc.).
      3. Use Google Search to check current seasonal trends and regional weather if location is provided.
      4. Synthesize a "Harvest Compatibility Index" that accounts for both soil health and economic viability.
      
      Strictly avoid generic advice. If a sensor is missing, acknowledge the data gap and provide a "Safety First" recommendation.`,
      tools: [{ googleSearch: {} }],
    };

    if (schema) {
      config.responseMimeType = "application/json";
      config.responseSchema = schema;
    }

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config,
    });

    return response;
  }
}

const agricareAI = new AgricareAI();

/**
 * Clean and Parse Helper
 */
const parseAIResponse = (text: string | undefined) => {
  if (!text) return null;
  try {
    return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
  } catch (e) {
    console.error("AI Parsing Error:", e);
    return null;
  }
};

/**
 * 1. Harvest Compatibility Index (Dynamic Analysis)
 */
export const getCropAnalysis = async (field: Field, latestData: any): Promise<CropRecommendation[]> => {
  const prompt = `
    FIELD: ${field.field_name} in ${field.location}.
    SOIL TYPE: ${field.soil_type}.
    TELEMETRY: 
    - pH: ${latestData.ph_level ?? "MISSING"}
    - NPK: ${latestData.npk_n ?? "M"}-${latestData.npk_p ?? "M"}-${latestData.npk_k ?? "M"}
    - Moisture: ${latestData.moisture ?? "MISSING"}%
    - Temp: ${latestData.temperature ?? "MISSING"}°C
    
    Generate a Harvest Compatibility Index. Suggest 3 crops that maximize yield based on this specific profile.
  `;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        suitability: { type: Type.NUMBER, description: "0-100 compatibility score" },
        yield: { type: Type.STRING, description: "Estimated yield per hectare" },
        requirements: { type: Type.STRING, description: "Specific soil/water needs" },
        fertilizer: { type: Type.STRING, description: "Primary nutrient requirement" },
        icon: { type: Type.STRING, description: "Lucide icon name (e.g., fa-wheat-awn)" }
      },
      required: ["name", "suitability", "yield", "requirements", "fertilizer", "icon"]
    }
  };

  try {
    const result = await agricareAI.synthesize(prompt, schema);
    return parseAIResponse(result.text) || [];
  } catch (err) {
    console.error("Crop Analysis Failed:", err);
    return [];
  }
};

/**
 * 2. Management Prescriptions (Reasoning-based)
 */
export interface ManagementPrescription {
  irrigation: { needed: boolean; volume: string; schedule: string };
  nutrient: { needed: boolean; fertilizers: { type: string; amount: string }[]; advice: string };
}

export const getManagementPrescriptions = async (field: Field, latestData: any): Promise<ManagementPrescription> => {
  const prompt = `
    Analyze soil health for ${field.field_name}. 
    Data: pH=${latestData.ph_level}, NPK=${latestData.npk_n}-${latestData.npk_p}-${latestData.npk_k}, Moisture=${latestData.moisture}%.
    Provide immediate irrigation and nutrient prescriptions.
  `;

  const schema = {
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
              properties: { type: { type: Type.STRING }, amount: { type: Type.STRING } },
              required: ["type", "amount"]
            }
          },
          advice: { type: Type.STRING }
        },
        required: ["needed", "fertilizers", "advice"]
      }
    },
    required: ["irrigation", "nutrient"]
  };

  try {
    const result = await agricareAI.synthesize(prompt, schema);
    return parseAIResponse(result.text) || {
      irrigation: { needed: false, volume: "N/A", schedule: "N/A" },
      nutrient: { needed: false, fertilizers: [], advice: "AI temporary unavailable." }
    };
  } catch (err) {
    return {
      irrigation: { needed: false, volume: "N/A", schedule: "N/A" },
      nutrient: { needed: false, fertilizers: [], advice: "System error." }
    };
  }
};

/**
 * 3. Soil Health Summary (Insightful Analysis)
 */
export interface SoilInsight {
  summary: string;
  soil_fertilizer: string;
}

export const getSoilHealthSummary = async (field: Field, latestData: any): Promise<SoilInsight> => {
  const prompt = `Provide a deep soil health insight for ${field.field_name}. Analyze pH (${latestData.ph_level}) and NPK balance.`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      soil_fertilizer: { type: Type.STRING }
    },
    required: ["summary", "soil_fertilizer"]
  };

  try {
    const result = await agricareAI.synthesize(prompt, schema);
    return parseAIResponse(result.text) || { summary: "Awaiting analysis...", soil_fertilizer: "N/A" };
  } catch (err) {
    return { summary: "Analysis failed.", soil_fertilizer: "N/A" };
  }
};

/**
 * 4. Operational Roadmap (Strategic Planning)
 */
export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  const prompt = `Build a 4-step Operational Roadmap for ${field.field_name} based on current telemetry.`;
  const schema = {
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
  };

  try {
    const result = await agricareAI.synthesize(prompt, schema);
    return parseAIResponse(result.text) || [];
  } catch (err) {
    return [];
  }
};

export const isAiReady = async () => !!process.env.API_KEY;
