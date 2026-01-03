
import { GoogleGenAI, Type } from "@google/genai";
import { Field, SensorData } from "../types";

export const checkAIConnection = () => {
  // Safe check for process.env
  try {
    return !!(typeof process !== 'undefined' && process.env && process.env.API_KEY);
  } catch (e) {
    return false;
  }
};

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Format sensor values for the AI prompt, clearly marking missing data.
 * Added safety checks to prevent .toFixed() crashes on null values.
 */
const formatDataForPrompt = (data: any) => {
  const safeFormat = (val: any, suffix: string = '') => {
    if (val === null || val === undefined) return 'STRICTLY NOT PROVIDED (DO NOT GUESS)';
    return `${Number(val).toFixed(1)}${suffix}`;
  };

  const n = data.npk_n !== null && data.npk_n !== undefined ? data.npk_n : 'MISSING';
  const p = data.npk_p !== null && data.npk_p !== undefined ? data.npk_p : 'MISSING';
  const k = data.npk_k !== null && data.npk_k !== undefined ? data.npk_k : 'MISSING';

  return `
    - Temperature: ${safeFormat(data.temperature, '°C')}
    - Moisture: ${safeFormat(data.moisture, '%')}
    - pH Level: ${safeFormat(data.ph_level)}
    - NPK Profile: ${n === 'MISSING' ? 'STRICTLY NOT PROVIDED' : `N=${n}, P=${p}, K=${k}`}
  `;
};

export const getCropAnalysis = async (field: Field, latestData: any) => {
  try {
    if (!checkAIConnection()) return [];
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `
        Analyze this agricultural field data and provide the top 3 recommended crops.
        Field: ${field.field_name}, Location: ${field.location}, Soil: ${field.soil_type}.
        Available Soil Data: ${formatDataForPrompt(latestData)}
        
        CRITICAL RULES:
        1. Base your recommendations ONLY on provided numeric values.
        2. If NPK or pH data is "STRICTLY NOT PROVIDED", do not calculate or suggest specific fertilizer types.
        3. If moisture is missing, do not suggest irrigation schedules.
        4. Explicitly state in the "requirements" field for each crop if certain recommendations are impossible due to missing sensors.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              suitability: { type: Type.NUMBER, description: "Percentage 0-100" },
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
    if (!checkAIConnection()) return "AI is currently offline. Please check your API configuration.";
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Act as an expert agricultural scientist. Provide a concise 3-sentence "Soil Health Summary".
        Field: ${field.field_name}, Location: ${field.location}, Soil: ${field.soil_type}.
        Current Data: ${formatDataForPrompt(latestData)}
        
        STRICT REQUIREMENT: Mention ONLY the parameters that were provided. If a parameter is "STRICTLY NOT PROVIDED", you MUST state: "Data for [Parameter] is missing; unable to assess this metric." No markdown. No hallucinations.
      `
    });
    
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Unable to generate summary at this time.";
  }
};

export const getDetailedManagementPlan = async (field: Field, latestData: any) => {
  try {
    if (!checkAIConnection()) return [];
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `
        Generate exactly 4 prioritized farm management tasks.
        Data: ${formatDataForPrompt(latestData)}
        
        INSTRUCTION: 
        - If NPK, pH, or moisture is missing, the highest priority task MUST be 'Install [Missing Sensor] or Enter Data Manually'.
        - DO NOT give fertilization advice if NPK data is not provided.
        - DO NOT give irrigation advice if Moisture data is not provided.
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

export const startAIConversation = (systemInstruction: string) => {
  try {
    const ai = getAIClient();
    return ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { systemInstruction, temperature: 0.7 },
    });
  } catch (e: any) {
    return null;
  }
};
