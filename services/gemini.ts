
import { GoogleGenAI, Type } from "@google/genai";
import { Field, CropRecommendation } from "../types";

// Initialize the Google GenAI client following strict guidelines
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

/**
 * Safely parses JSON from AI response, handling potential markdown blocks.
 */
const safeParse = (text: string | undefined, fallback: any) => {
  if (!text) return fallback;
  try {
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.warn("AI Response parsing failed, using fallback.", e);
    return fallback;
  }
};

/**
 * Formats sensor data into a structured prompt context.
 * Clearly labels missing sensors so the AI can perform partial correlation.
 */
const formatDataForPrompt = (data: any) => {
  const getVal = (v: any, unit: string = '') => (v !== undefined && v !== null) ? `${Number(v).toFixed(2)}${unit}` : "[SENSOR_NOT_ACTIVE]";
  
  const npk = (data.npk_n !== undefined) 
    ? `Nitrogen:${data.npk_n}, Phosphorus:${data.npk_p}, Potassium:${data.npk_k}` 
    : "[NPK_SENSOR_NOT_ACTIVE]";

  return `
    [LIVE FIELD TELEMETRY]
    - MOISTURE: ${getVal(data.moisture, '%')}
    - pH LEVEL: ${getVal(data.ph_level)}
    - NPK PROFILE: ${npk}
    - TEMPERATURE: ${getVal(data.temperature, '°C')}
    
    [FIELD CONTEXT]
    - Field Name: ${data.field_name}
    - Location: ${data.location}
    - Soil Type: ${data.soil_type || 'Loamy'}
  `;
};

export const getCropAnalysis = async (field: Field, latestData: any): Promise<CropRecommendation[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `ACT AS: Senior Agronomy Data Scientist.
      TASK: Generate a "Harvest Compatibility Index" (0-100%) for 3 potential crops based strictly on the provided [LIVE FIELD TELEMETRY].
      
      LOGIC RULES:
      1. If even ONE sensor (e.g., only pH) is active, correlate its value with the field location/soil and recommend compatible crops.
      2. The 'suitability' score MUST represent the statistical match between the sensor values and the crop's biological needs.
      3. In the 'requirements' field, explicitly state which sensor readings drove the compatibility (e.g., "90% Match: Optimal 6.2 pH for Rice").
      4. If NO sensors are active, return suitability 0% and name the crop "Hardware Sync Required".
      
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
    console.error("Crop analysis failed:", error);
    return [];
  }
};

export const getSoilHealthSummary = async (field: Field, latestData: any): Promise<SoilInsight> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze soil health markers. If data is partial, provide insight based ONLY on the active sensors.
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
    return safeParse(response.text, { summary: "Waiting for sensor pulse...", soil_fertilizer: "Handshake required." });
  } catch (error) {
    return { summary: "Soil node offline.", soil_fertilizer: "Check hardware." };
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Build a management roadmap. Prioritize filling telemetry gaps for missing sensors.
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
      contents: `Generate precise irrigation and nutrient prescriptions based only on active telemetry pillars.
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
