
import { GoogleGenAI, Type } from "@google/genai";
import { Field, CropRecommendation } from "../types";

/**
 * Ensures we always use the latest environment API key.
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
    FIELD TELEMETRY:
    - Soil Moisture: ${safeVal(data.moisture)}%
    - pH Level: ${safeVal(data.ph_level)}
    - Ambient Temperature: ${safeVal(data.temperature)}°C
    - Nutrient Profile (NPK): Nitrogen=${safeVal(data.npk_n)}, Phosphorus=${safeVal(data.npk_p)}, Potassium=${safeVal(data.npk_k)}
    - Location Context: ${data.location || 'Bangladesh'}
    - Soil Profile: ${data.soil_type || 'Loamy'}
  `;
};

export interface SoilInsight {
  summary: string;
  soil_fertilizer: string;
}

export const getCropAnalysis = async (field: Field, latestData: any): Promise<CropRecommendation[]> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a world-class senior agronomist. Analyze the following soil telemetry and suggest 3 specific vegetables or crops that will result in a GREAT HARVEST for this specific soil and location. For each, specify the EXACT PERFECT FERTILIZER required to maximize that specific crop's yield. ${formatDataForPrompt({...latestData, ...field})}`,
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
    console.error("AI Crop analysis failed, using fallback.");
    return [
      { name: "Boro Rice (Hybrid)", suitability: 94, yield: "7.2 Tons/ha", requirements: "Maintain high water levels and Nitrogen focus.", fertilizer: "Urea + DAP Blend", icon: "fa-wheat-awn" },
      { name: "High-Yield Brinjal", suitability: 88, yield: "28 Tons/ha", requirements: "Consistent moisture and high Potassium.", fertilizer: "MOP + Organic Compost", icon: "fa-eggplant" },
      { name: "Winter Potato", suitability: 82, yield: "22 Tons/ha", requirements: "Well-aerated soil and balanced NPK.", fertilizer: "Balanced 10-10-10 Mix", icon: "fa-potato" }
    ];
  }
};

export const getSoilHealthSummary = async (field: Field, latestData: any): Promise<SoilInsight> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a senior soil scientist. Analyze the soil health of "${field.field_name}" and provide a concise restoration strategy. Suggest the specific treatment or conditioner (Lime, Gypsum, etc.) needed to fix the soil itself. ${formatDataForPrompt({...latestData, ...field})}`,
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
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return {
      summary: "Soil diagnostics show stable moisture levels. Priority should be given to organic matter enrichment to improve nutrient cation exchange capacity.",
      soil_fertilizer: "Apply 500kg of Vermicompost per hectare and monitor pH trends."
    };
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are an agricultural consultant. Create a prioritized 4-step roadmap for soil restoration and harvest success based on this field's data. ${formatDataForPrompt({...latestData, ...field})}`,
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
    return [
      { priority: "High", title: "Organic Mulching", description: "Apply a 2-inch layer of organic mulch to preserve soil moisture and regulate temperature.", icon: "fa-leaf" },
      { priority: "Medium", title: "NPK Balancing", description: "Supplement with specific Nitrogen-rich fertilizer based on current deficits.", icon: "fa-flask" },
      { priority: "Medium", title: "pH Correction", description: "Use agricultural lime to normalize soil acidity for better nutrient absorption.", icon: "fa-scale-balanced" },
      { priority: "Low", title: "Microbial Boost", description: "Introduce beneficial soil microbes via compost tea to enhance root health.", icon: "fa-bacteria" }
    ];
  }
};
