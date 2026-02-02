
import { GoogleGenAI, Type } from "@google/genai";
import { Field, CropRecommendation } from "../types";

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-3-pro-preview for advanced agricultural reasoning
const MODEL_NAME = 'gemini-3-pro-preview';

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
    fertilizers: {
      type: string;
      amount: string;
    }[];
    advice: string;
  };
}

const safeParse = (text: string | undefined, fallback: any) => {
  if (!text) return fallback;
  try {
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.warn("AI Response parsing failed:", e);
    return fallback;
  }
};

const formatDataForPrompt = (data: any) => {
  const getVal = (v: any, unit: string = '') => (v !== undefined && v !== null) ? `${Number(v).toFixed(2)}${unit}` : "[NOT_DETECTED]";
  
  const npk = (data.npk_n !== undefined) 
    ? `N:${data.npk_n}, P:${data.npk_p}, K:${data.npk_k}` 
    : "[NOT_DETECTED]";

  return `
    [ACTUAL FIELD SENSOR DATA]
    - MOISTURE (VWC): ${getVal(data.moisture, '%')}
    - pH (ACIDITY/ALKALINITY): ${getVal(data.ph_level)}
    - NPK PROFILE: ${npk}
    - TEMPERATURE: ${getVal(data.temperature, '°C')}
    
    [LOCATION CONTEXT]
    - Site: ${data.field_name}
    - Soil Class: ${data.soil_type || 'Loamy'}
    - District: ${data.location}
  `;
};

export const getCropAnalysis = async (field: Field, latestData: any): Promise<CropRecommendation[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `ACT AS: Precision Agronomy Engine.
      TASK: Generate a "Harvest Compatibility Index" (0-100%) for 3 potential crops based strictly on the [ACTUAL FIELD SENSOR DATA].
      
      MATCHING LOGIC:
      1. If only ONE sensor is active (e.g., pH 5.2), provide recommendations based on that pillar (e.g., Acid-loving crops like Tea or Blueberries).
      2. If multiple sensors are active, cross-correlate them for a higher-confidence match.
      3. In the 'requirements' field, you MUST explain the data-match (e.g., "92% Match: Ideal pH and Nitrogen levels for high-yield Jute production").
      4. If zero sensors are detected, return 0% suitability and name the crop "Hardware Sync Required".
      
      ${formatDataForPrompt({...latestData, ...field})}`,
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
    return safeParse(response.text, []);
  } catch (error) {
    console.error("AI Node Failure:", error);
    return [];
  }
};

export const getSoilHealthSummary = async (field: Field, latestData: any): Promise<SoilInsight> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Perform a Biological Soil Audit based ONLY on detected sensors.
      If only one reading exists, explain the microbial and nutrient implications of that one reading.
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
    return safeParse(response.text, { summary: "Waiting for sensor data...", soil_fertilizer: "Sync hardware." });
  } catch (error) {
    return { summary: "Connection error.", soil_fertilizer: "Check hub." };
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Create an Operational Roadmap. If data is partial, the first priority is always filling the telemetry gap by registering missing sensors.
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
    return safeParse(response.text, []);
  } catch (error) {
    return [];
  }
};

export const getManagementPrescriptions = async (field: Field, latestData: any): Promise<ManagementPrescription | null> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate technical prescriptions based ONLY on available telemetry pillars.
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
    return safeParse(response.text, null);
  } catch (error) {
    return null;
  }
};
