
import { GoogleGenAI, Type } from "@google/genai";
import { Field } from "../types";

/**
 * The API key is obtained exclusively from the environment variable process.env.API_KEY.
 */
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_NOT_FOUND");
  }
  return new GoogleGenAI({ apiKey });
};

export const isAiReady = async () => {
  return !!process.env.API_KEY && process.env.API_KEY.length > 5;
};

const formatDataForPrompt = (data: any) => {
  const safeVal = (val: any) => (val != null) ? Number(val).toFixed(2) : "N/A";
  return `
    FIELD TELEMETRY DATA:
    - Soil Moisture Content: ${safeVal(data.moisture)}%
    - Soil pH Level: ${safeVal(data.ph_level)}
    - Ambient Temperature: ${safeVal(data.temperature)}°C
    - Nutrient Content (NPK): Nitrogen=${safeVal(data.npk_n)}, Phosphorus=${safeVal(data.npk_p)}, Potassium=${safeVal(data.npk_k)}
    - Geographic Context: ${data.location || 'Bangladesh'}
    - Soil Profile: ${data.soil_type || 'Loamy'}
  `;
};

export interface SoilInsight {
  summary: string;
  soil_fertilizer: string;
}

export const getCropAnalysis = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a world-class agronomist. Based on the NPK, pH, and Moisture data, suggest 3 specific vegetables or crops that will result in a GREAT HARVEST. For each, specify the EXACT PERFECT FERTILIZER required to maximize that specific crop's yield in this specific soil. ${formatDataForPrompt({...latestData, ...field})}`,
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
    
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Crop analysis failed", error);
    return [];
  }
};

export const getSoilHealthSummary = async (field: Field, latestData: any): Promise<SoilInsight> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the soil health of "${field.field_name}". Provide a detailed summary of how to improve its health. Specifically, suggest what type of fertilizer or soil conditioner (like Lime, Gypsum, or specialized NPK boosters) is perfect for restoring this SPECIFIC soil type to its optimal state. ${formatDataForPrompt({...latestData, ...field})}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Detailed 3-sentence restoration strategy" },
            soil_fertilizer: { type: Type.STRING, description: "The specific fertilizer/conditioner needed for the soil itself" }
          },
          required: ["summary", "soil_fertilizer"]
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty AI response");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Soil summary failed", error);
    return {
      summary: "Soil health is currently stable but requires organic matter to increase microbial activity.",
      soil_fertilizer: "Apply Vermicompost (5kg/sqm) and check pH balance."
    };
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Create a prioritized 4-step roadmap for soil restoration and harvest success. Include scientific steps for fixing the soil and preparing for high-yield planting. ${formatDataForPrompt({...latestData, ...field})}`,
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
    
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Management plan failed", error);
    return [];
  }
};
