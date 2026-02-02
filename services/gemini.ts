
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

/**
 * Safely parses JSON from AI response, handling markdown blocks and potential errors.
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

const formatDataForPrompt = (data: any) => {
  const getVal = (v: any, unit: string = '') => (v !== undefined && v !== null) ? `${Number(v).toFixed(2)}${unit}` : "[NOT_REGISTERED]";
  
  const npk = (data.npk_n !== undefined) 
    ? `N:${data.npk_n}, P:${data.npk_p}, K:${data.npk_k}` 
    : "[NOT_REGISTERED]";

  return `
    [LIVE SENSOR FEED]
    - MOISTURE: ${getVal(data.moisture, '%')}
    - pH LEVEL: ${getVal(data.ph_level)}
    - NPK PROFILE: ${npk}
    - TEMPERATURE: ${getVal(data.temperature, '°C')}
    
    [FIELD METADATA]
    - Name: ${data.field_name}
    - Soil: ${data.soil_type || 'Loamy'}
    - District: ${data.location}
  `;
};

export const getCropAnalysis = async (field: Field, latestData: any): Promise<CropRecommendation[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `ACT AS: Senior Agronomist. 
      TASK: Recommend 3 crops based on the provided [LIVE SENSOR FEED].
      
      CORE LOGIC:
      1. If even ONE sensor (e.g., just pH) is active, you MUST correlate it with the District's typical climate and recommend crops.
      2. If data is partial, set 'suitability' based on the match to active sensors.
      3. In 'requirements', explicitly state: "Analysis based on [List Active Sensors]".
      4. If NO sensors are active, suitability must be 0, name crop "Sensor Activation Required".
      
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
      contents: `Summarize soil health markers. Use whatever telemetry is present. If only one sensor exists, focus 100% on the implications of that one reading.
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
    return safeParse(response.text, { summary: "Awaiting sensor handshake...", soil_fertilizer: "Telemetric verification required." });
  } catch (error) {
    return { summary: "Analysis node connectivity error.", soil_fertilizer: "Check hardware bridge." };
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a prioritized management roadmap. If sensors are missing, the #1 task should be 'Deploy [Missing Sensor Name]'. 
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
      contents: `Provide direct irrigation and nutrient prescriptions. If data for a pillar (like NPK) is missing, set 'needed: false' and explain why in advice.
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
