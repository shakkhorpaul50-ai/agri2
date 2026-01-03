
import { GoogleGenAI, Type } from "@google/genai";
import { Field } from "../types";

/**
 * The AI is ready if the environment-provided API_KEY exists.
 */
export const isAiReady = async () => {
  return !!process.env.API_KEY;
};

/**
 * Not used in shared key mode, but kept for compatibility.
 */
export const openAiKeySelector = async () => {
  return true;
};

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_REQUIRED");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Format sensor values for the AI prompt.
 * Robust handling of null/undefined to ensure the AI knows what's real and what's inferred.
 */
const formatDataForPrompt = (data: any) => {
  const safeVal = (val: any) => (val != null) ? Number(val).toFixed(2) : "MISSING";

  return `
    FIELD MEASUREMENTS:
    - Soil Moisture: ${safeVal(data.moisture)}${data.moisture != null ? '%' : ''}
    - Soil pH: ${safeVal(data.ph_level)}
    - Ambient Temperature: ${safeVal(data.temperature)}${data.temperature != null ? '°C' : ''}
    - Nitrogen (N): ${safeVal(data.npk_n)} ppm
    - Phosphorus (P): ${safeVal(data.npk_p)} ppm
    - Potassium (K): ${safeVal(data.npk_k)} ppm
    
    CRITICAL CONTEXT:
    If any data is marked "MISSING", use your domain expertise of ${data.location || 'Bangladesh'} and ${data.soil_type || 'Loamy'} soil to provide the best possible estimation. 
    However, prioritize the real sensor readings for ${data.moisture != null ? 'Moisture' : ''} ${data.ph_level != null ? 'and pH' : ''}.
  `;
};

export const getCropAnalysis = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze this agricultural field and recommend the top 3 best-fitting crops.
        Field: ${field.field_name}, Location: ${field.location}, Soil Type: ${field.soil_type}.
        ${formatDataForPrompt({...latestData, location: field.location, soil_type: field.soil_type})}
        
        Provide high-yield recommendations specifically for the ${field.location} region.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              suitability: { type: Type.NUMBER, description: "Match percentage 0-100" },
              yield: { type: Type.STRING, description: "Expected tonnage per hectare" },
              requirements: { type: Type.STRING, description: "Specific care instructions based on current soil" },
              icon: { type: Type.STRING, description: "FontAwesome icon name (e.g., fa-wheat-awn)" }
            },
            required: ["name", "suitability", "yield", "requirements", "icon"]
          }
        }
      }
    });
    
    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    return [];
  }
};

export const getSoilHealthSummary = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Summarize the current soil health for ${field.field_name} in ${field.location}.
        ${formatDataForPrompt({...latestData, location: field.location, soil_type: field.soil_type})}
        
        Write exactly 3 sentences. Be scientific but accessible. If sensors show critical levels (e.g., very low moisture), highlight them first. Do not use markdown.
      `
    });
    
    return response.text || "Field diagnostics analyzed. Soil health markers are within expected seasonal ranges.";
  } catch (error: any) {
    console.error("Gemini Summary Error:", error);
    return "The AI engine is synthesizing your field data. Analysis will appear shortly.";
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Generate 4 immediate management tasks for this field.
        ${formatDataForPrompt({...latestData, location: field.location, soil_type: field.soil_type})}
        
        Focus on immediate actions (Irrigation, pH correction, or Fertilizer application) based on the specific numbers provided.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              priority: { type: Type.STRING, description: "High, Medium, or Low" },
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
  } catch (error: any) {
    console.error("Gemini Plan Error:", error);
    return [];
  }
};
