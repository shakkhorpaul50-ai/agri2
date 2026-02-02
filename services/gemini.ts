
import { GoogleGenAI, Type } from "@google/genai";
import { Field, CropRecommendation } from "../types";

// Initialize AI with Gemini 3 Flash for complex reasoning
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';

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

const cleanAndParseJSON = (text: string | undefined) => {
  if (!text) return null;
  try {
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    return null;
  }
};

const formatTelemetryForAI = (data: any) => {
  return `
    [CURRENT SENSOR TELEMETRY]
    - Volumetric Moisture: ${data.moisture ?? 'N/A'}%
    - Soil pH: ${data.ph_level ?? 'N/A'}
    - Ground Temp: ${data.temperature ?? 'N/A'}°C
    - NPK Profile: N:${data.npk_n ?? 'N/A'}, P:${data.npk_p ?? 'N/A'}, K:${data.npk_k ?? 'N/A'}
  `;
};

/**
 * Generates the "Harvest Compatibility Index" (suitability percentage) 
 * by correlating hardware telemetry with crop biological requirements.
 */
export const getCropAnalysis = async (field: Field, latestData: any): Promise<CropRecommendation[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `ACT AS: Senior Agricultural Scientist in Bangladesh.
      TASK: Generate a "Harvest Compatibility Index" (suitability 0-100) for 3 crops based on live data.
      ${formatTelemetryForAI(latestData)}
      Field Profile: ${field.soil_type} soil in ${field.location}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              suitability: { type: Type.NUMBER, description: "Harvest Compatibility Index (0-100)" },
              yield: { type: Type.STRING },
              requirements: { type: Type.STRING },
              fertilizer: { type: Type.STRING },
              icon: { type: Type.STRING, description: "FontAwesome icon class e.g. fa-wheat-awn" }
            },
            required: ["name", "suitability", "yield", "requirements", "fertilizer", "icon"]
          }
        }
      }
    });
    return cleanAndParseJSON(response.text) || [];
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return [];
  }
};

export const getSoilHealthSummary = async (field: Field, latestData: any): Promise<SoilInsight> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Provide a soil health summary and specific fertilizer advice based on these markers: ${formatTelemetryForAI(latestData)}`,
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
    return cleanAndParseJSON(response.text) || { summary: "Analysis node offline.", soil_fertilizer: "Check hardware." };
  } catch (error) {
    return { summary: "Offline.", soil_fertilizer: "N/A" };
  }
};

export const getManagementPrescriptions = async (field: Field, latestData: any): Promise<ManagementPrescription | null> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate actionable prescriptions for irrigation and nutrient supplementation: ${formatTelemetryForAI(latestData)}`,
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
    return null;
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Create a 4-step operational roadmap for this specific plot: ${formatTelemetryForAI(latestData)}`,
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
