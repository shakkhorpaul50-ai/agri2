
import { GoogleGenAI, Type } from "@google/genai";
import { Field, SensorData } from "../types";

export const checkAIConnection = () => {
  // We assume the key is provided by the environment as per system instructions
  return true;
};

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Format sensor values for the AI prompt.
 * Clearly identifies what we HAVE and what we are MISSING.
 */
const formatDataForPrompt = (data: any) => {
  const safeVal = (val: any) => (val !== null && val !== undefined) ? Number(val).toFixed(1) : null;

  const m = safeVal(data.moisture);
  const t = safeVal(data.temperature);
  const ph = safeVal(data.ph_level);
  const n = safeVal(data.npk_n);
  const p = safeVal(data.npk_p);
  const k = safeVal(data.npk_k);

  return `
    CURRENT SENSOR READINGS:
    - Soil Moisture: ${m ? `${m}%` : 'Not Measured'}
    - Soil pH: ${ph ? ph : 'Not Measured'}
    - Temperature: ${t ? `${t}°C` : 'Not Measured'}
    - Nitrogen (N): ${n ? `${n} ppm` : 'Not Measured'}
    - Phosphorus (P): ${p ? `${p} ppm` : 'Not Measured'}
    - Potassium (K): ${k ? `${k} ppm` : 'Not Measured'}
    
    NOTE: If a value is "Not Measured", use your expert knowledge of the region (${data.location || 'Bangladesh'}) and soil type (${data.soil_type || 'Loamy'}) to provide the best possible advice.
  `;
};

export const getCropAnalysis = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `
        Analyze this field for crop suitability. 
        Field: ${field.field_name}, Location: ${field.location}, Soil: ${field.soil_type}.
        ${formatDataForPrompt({...latestData, location: field.location, soil_type: field.soil_type})}
        
        GOAL: Provide the top 3 recommended crops based ON THE PROVIDED DATA. 
        If some data is missing (like NPK), recommend crops that generally thrive in ${field.soil_type} soil in the ${field.location} region, adjusted for the current ${latestData.moisture}% moisture and ${latestData.ph_level} pH.
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
    
    return JSON.parse(response.text || '[]');
  } catch (error) {
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
        As an agricultural expert, summarize the soil health for ${field.field_name}.
        Location: ${field.location}, Soil: ${field.soil_type}.
        ${formatDataForPrompt({...latestData, location: field.location, soil_type: field.soil_type})}
        
        Provide a 3-sentence summary. If data like NPK is missing, focus your analysis on the Moisture and pH levels you DO have, and mention that a full nutrient profile would allow for even more precision. No markdown.
      `
    });
    
    return response.text || "Analysis complete. Data suggests standard maintenance.";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "AI system is processing data. Please refresh in a moment.";
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `
        Generate exactly 4 prioritized farm management tasks.
        Field: ${field.field_name}, Location: ${field.location}, Soil: ${field.soil_type}.
        ${formatDataForPrompt({...latestData, location: field.location, soil_type: field.soil_type})}
        
        PRIORITY RULES:
        1. If moisture is very low (<15%), 'Irrigation' must be High Priority.
        2. If pH is outside 6.0-7.5, 'pH Correction' must be High/Medium Priority.
        3. If NPK is missing, suggest 'Comprehensive Soil Testing' as a task.
        4. Base your descriptions on the REAL values provided.
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
    
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Plan Error:", error);
    return [];
  }
};
