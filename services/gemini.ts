
import { GoogleGenAI, Type } from "@google/genai";
import { Field, CropRecommendation } from "../types";

// Initialize the Google GenAI client following strict guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-3-pro-preview for complex reasoning tasks
const MODEL_NAME = 'gemini-3-pro-preview';

export interface SoilInsight {
  summary: string;
  soil_fertilizer: string;
}

// Added missing interface for management prescriptions
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

const formatDataForPrompt = (data: any) => {
  const format = (key: string, label: string, unit: string = '') => {
    const val = data[key];
    if (val === undefined || val === null) return `${label}: [MISSING]`;
    return `${label}: ${Number(val).toFixed(2)}${unit}`;
  };

  const npkStatus = (data.npk_n !== undefined) 
    ? `Nitrogen=${data.npk_n}, Phosphorus=${data.npk_p}, Potassium=${data.npk_k}` 
    : "[MISSING]";

  return `
    [ACTUAL SENSOR TELEMETRY FROM FIELD]
    - MOISTURE: ${format('moisture', 'Current', '%')}
    - pH LEVEL: ${format('ph_level', 'Current')}
    - NPK PROFILE: ${npkStatus}
    - TEMPERATURE: ${format('temperature', 'Current', '°C')}
    
    FIELD CONTEXT: ${data.field_name}, ${data.location}, Soil: ${data.soil_type || 'Loamy'}.
  `;
};

export const getCropAnalysis = async (field: Field, latestData: any): Promise<CropRecommendation[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `You are an Adaptive Agricultural Data Analyst. 
      TASK: Suggest 3 crops using a 'Partial Correlation' approach based on whatever sensors are available.
      
      RULES:
      1. If even ONE sensor (e.g., only pH or only Moisture) is provided, you MUST provide a recommendation. 
      2. If data is partial, the 'suitability' should reflect the match against the KNOWN metrics, but the 'requirements' field must state: "Partial analysis based only on [Available Sensors]".
      3. If ALL sensors are [MISSING], return suitability 0% and name the crop "Sensor Hardware Required".
      4. Weight your logic: If pH is 5.5, suggest acid-loving crops (like Potatoes or Tea) even if NPK is missing.
      
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
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Crop analysis failed:", error);
    return [];
  }
};

export const getSoilHealthSummary = async (field: Field, latestData: any): Promise<SoilInsight> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Perform a 'Single-Factor' or 'Multi-Factor' soil health summary based on provided data.
      If only one metric exists, analyze the implications of that specific metric for the soil.
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
    return JSON.parse(response.text || '{"summary": "No data available.", "soil_fertilizer": "Register sensors."}');
  } catch (error) {
    console.error("Soil health summary failed:", error);
    return { summary: "Analysis node offline.", soil_fertilizer: "Check connectivity." };
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Create a prioritized action plan. If telemetry is partial, prioritize installing the missing sensors while offering advice on the metrics that ARE present.
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
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Management plan failed:", error);
    return [];
  }
};

export const getManagementPrescriptions = async (field: Field, latestData: any): Promise<ManagementPrescription | null> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate prescriptions. If a specific sensor (e.g. NPK) is missing, return 'needed: false' for that category but explain why in the advice.
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
    return JSON.parse(response.text || "null");
  } catch (error) {
    console.error("Management prescriptions failed:", error);
    return null;
  }
};
