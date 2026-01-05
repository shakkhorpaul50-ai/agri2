
import { GoogleGenAI, Type } from "@google/genai";
import { Field } from "../types";

/**
 * Safely retrieves the API key from the environment.
 * Modern bundlers inject these at build time.
 */
const getSafeApiKey = () => {
  try {
    // Check for VITE_ prefix (Vite), process.env (Webpack/Cloudflare), or global window variables
    const key = 
      (typeof process !== 'undefined' && process.env ? (process.env.VITE_API_KEY || process.env.API_KEY) : null) || 
      (window as any).VITE_API_KEY || 
      (window as any).API_KEY;
      
    return (key && key !== "undefined" && key !== "") ? key : null;
  } catch (e) {
    return null;
  }
};

export const isAiReady = async () => {
  return !!getSafeApiKey();
};

const getAIClient = () => {
  const apiKey = getSafeApiKey();
  if (!apiKey) {
    throw new Error("API_KEY_NOT_FOUND");
  }
  return new GoogleGenAI({ apiKey });
};

const formatDataForPrompt = (data: any) => {
  const safeVal = (val: any) => (val != null) ? Number(val).toFixed(2) : "N/A";
  return `
    FIELD DATA:
    - Moisture: ${safeVal(data.moisture)}%
    - pH: ${safeVal(data.ph_level)}
    - Temp: ${safeVal(data.temperature)}°C
    - NPK: ${safeVal(data.npk_n)}-${safeVal(data.npk_p)}-${safeVal(data.npk_k)}
    Location: ${data.location || 'Bangladesh'}
    Soil: ${data.soil_type || 'Loamy'}
  `;
};

export const getCropAnalysis = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Recommend 3 crops for ${field.field_name}. ${formatDataForPrompt({...latestData, ...field})}`,
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
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};

export const getSoilHealthSummary = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Evaluate soil health for ${field.field_name}. ${formatDataForPrompt({...latestData, ...field})}. Write 3 sentences.`
    });
    return response.text || "Analysis complete.";
  } catch (error: any) {
    if (error.message === "API_KEY_NOT_FOUND") {
      return "AI Connection Error: The API key was not detected in the current build. Please verify that your environment variable is correctly injected into the application bundle.";
    }
    return "AI Node connecting...";
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide 4 improvement steps for ${field.field_name}. ${formatDataForPrompt({...latestData, ...field})}`,
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
    return [];
  }
};
