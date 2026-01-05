
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

export const getCropAnalysis = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert agronomist. Based on the provided NPK and pH data, suggest 3 specific crops or vegetables that will have a GREAT HARVEST in these conditions. For each, suggest the EXACT PERFECT FERTILIZER strategy (e.g. Urea, TSP, MOP, Gypsum, or specific Organic Compost) required to optimize growth for that specific plant in this soil. ${formatDataForPrompt({...latestData, ...field})}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the crop or vegetable" },
              suitability: { type: Type.NUMBER, description: "Match percentage (0-100)" },
              yield: { type: Type.STRING, description: "Estimated harvest potential" },
              requirements: { type: Type.STRING, description: "Key growing conditions needed" },
              fertilizer: { type: Type.STRING, description: "Specific fertilizer recommendation for this crop given the current soil deficit" },
              icon: { type: Type.STRING, description: "FontAwesome icon name (e.g. fa-carrot, fa-seedling)" }
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

export const getSoilHealthSummary = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a 3-sentence expert summary on HOW TO IMPROVE THE HEALTH of this specific field's soil. Focus on pH restoration, organic matter replenishment, and nutrient balancing. Be scientifically specific. ${formatDataForPrompt({...latestData, ...field})}`
    });
    return response.text || "Diagnostic complete. Monitor NPK levels closely.";
  } catch (error: any) {
    console.error("Soil summary failed", error);
    return "Soil health is currently stable. Recommend adding vermicompost to improve microbial activity and moisture retention.";
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Create a prioritized 4-step SOIL IMPROVEMENT AND HARVEST ROADMAP for "${field.field_name}". Steps MUST include specific actions to improve soil quality (like liming for acidity, adding potash for strength) and timing for the recommended harvest. ${formatDataForPrompt({...latestData, ...field})}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              priority: { type: Type.STRING, description: "High, Medium, or Low" },
              title: { type: Type.STRING, description: "Short title of the improvement task" },
              description: { type: Type.STRING, description: "Detailed instruction on how to perform the soil restoration" },
              icon: { type: Type.STRING, description: "FontAwesome icon name" }
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
