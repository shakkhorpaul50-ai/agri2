
import { GoogleGenAI, Type } from "@google/genai";
import { Field, CropRecommendation } from "../types";

// Always initialize the AI with the required pattern
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

/**
 * Standard utility for safe JSON extraction from AI text responses.
 */
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
 * Enhanced context builder that bridges hardware telemetry with AI agronomy.
 */
const formatDataForPrompt = (data: any) => {
  const getVal = (v: any, unit: string = '') => (v !== undefined && v !== null) ? `${Number(v).toFixed(2)}${unit}` : "[OFFLINE]";
  
  const npk = (data.npk_n !== undefined) 
    ? `N:${data.npk_n}, P:${data.npk_p}, K:${data.npk_k}` 
    : "[NPK ANALYZER OFFLINE]";

  return `
    [LIVE FIELD TELEMETRY]
    - MOISTURE: ${getVal(data.moisture, '%')}
    - pH LEVEL: ${getVal(data.ph_level)}
    - TEMPERATURE: ${getVal(data.temperature, '°C')}
    - NPK PROFILE: ${npk}
    
    [FIELD CONTEXT]
    - Plot Name: ${data.field_name}
    - Location: ${data.location}
    - Soil Base: ${data.soil_type || 'Loamy'}
  `;
};

export const getCropAnalysis = async (field: Field, latestData: any): Promise<CropRecommendation[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `ACT AS: Senior Agronomy Data Scientist.
      TASK: Generate a "Harvest Compatibility Index" (0-100%) for 3 potential crops based strictly on the provided [LIVE FIELD TELEMETRY].
      
      LOGIC:
      1. Correlate moisture, pH, and NPK with crop biological thresholds.
      2. Match the soil type and location climate.
      3. Return a JSON array of 3 objects.
      
      ${formatDataForPrompt({...latestData, ...field})}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              suitability: { type: Type.NUMBER, description: "The Harvest Compatibility Index percentage" },
              yield: { type: Type.STRING },
              requirements: { type: Type.STRING },
              fertilizer: { type: Type.STRING },
              icon: { type: Type.STRING, description: "FontAwesome icon class" }
            },
            required: ["name", "suitability", "yield", "requirements", "fertilizer", "icon"]
          }
        }
      }
    });
    return cleanAndParseJSON(response.text) || [];
  } catch (error) {
    console.error("AI Node Failure:", error);
    return [];
  }
};

export const getSoilHealthSummary = async (field: Field, latestData: any): Promise<SoilInsight> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze soil health markers based on telemetry.
      ${formatDataForPrompt({...latestData, ...field})}`,
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
    return cleanAndParseJSON(response.text) || { summary: "Data stream interrupted.", soil_fertilizer: "Check hardware." };
  } catch (error) {
    return { summary: "Analysis node offline.", soil_fertilizer: "Check connection." };
  }
};

export const getManagementPrescriptions = async (field: Field, latestData: any): Promise<ManagementPrescription | null> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Provide actionable prescriptions for irrigation and nutrients based on telemetry.
      ${formatDataForPrompt({...latestData, ...field})}`,
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
      contents: `Create a 4-step Operational Roadmap.
      ${formatDataForPrompt({...latestData, ...field})}`,
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
