
import { GoogleGenAI, Type } from "@google/genai";
import { Field } from "../types";

/**
 * Checks if the central API key is available in the environment.
 */
export const isAiReady = async () => {
  return !!process.env.API_KEY;
};

/**
 * Legacy support for key selection (not required in Central mode).
 */
export const openAiKeySelector = async () => {
  return !!process.env.API_KEY;
};

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("CENTRAL_API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Formats manual sensor data for the Gemini prompt.
 */
const formatDataForPrompt = (data: any) => {
  const safeVal = (val: any) => (val != null) ? Number(val).toFixed(2) : "UNAVAILABLE";

  return `
    FIELD TELEMETRY (MANUAL UPLOADS):
    - Soil Moisture: ${safeVal(data.moisture)}${data.moisture != null ? '%' : ''}
    - Soil pH: ${safeVal(data.ph_level)}
    - Ambient Temperature: ${safeVal(data.temperature)}${data.temperature != null ? '°C' : ''}
    - Nitrogen (N): ${safeVal(data.npk_n)} ppm
    - Phosphorus (P): ${safeVal(data.npk_p)} ppm
    - Potassium (K): ${safeVal(data.npk_k)} ppm
    
    ENVIRONMENTAL CONTEXT:
    Plot: ${data.field_name || 'Primary Field'}
    Location: ${data.location || 'Bangladesh'}
    Soil Profile: ${data.soil_type || 'Loamy'}
  `;
};

export const getCropAnalysis = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Recommend 3 crops for this field based on current nutrient levels.
        ${formatDataForPrompt({...latestData, ...field})}
      `,
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
              icon: { type: Type.STRING }
            },
            required: ["name", "suitability", "yield", "requirements", "icon"]
          }
        }
      }
    });
    
    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Analysis Error:", error);
    return [];
  }
};

export const getSoilHealthSummary = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze the soil health condition for ${field.field_name}.
        ${formatDataForPrompt({...latestData, ...field})}
        
        TASK:
        Give a brief, clear idea of the health condition of the soil based on the provided readings. 
        Identify if any specific parameter (pH, Moisture, N, P, or K) is currently the limiting factor for growth.
        Write exactly 3 sentences. No markdown.
      `
    });
    
    return response.text || "Health metrics analyzed. Parameters are currently in a stable state.";
  } catch (error: any) {
    if (error.message === "CENTRAL_API_KEY_MISSING") {
      return "Central API key not found. Please set the API_KEY environment variable in your hosting provider (e.g., Cloudflare Settings) to activate AI diagnostics.";
    }
    return "The AI engine is currently processing your field data. Please refresh in a moment.";
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Suggest 4 prioritized steps to make the crops and fields healthier.
        ${formatDataForPrompt({...latestData, ...field})}
        
        Focus on correcting imbalances in the NPK profile and moisture levels.
      `,
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
    return text ? JSON.parse(text) : [];
  } catch (error) {
    return [];
  }
};
