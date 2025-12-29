
import { GoogleGenAI, Type } from "@google/genai";
import { Field, SensorData } from "../types";

export const getCropAnalysis = async (field: Field, latestData: SensorData) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("API_KEY is missing.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze this agricultural field data and provide the top 3 recommended crops.
        Field: ${field.field_name}, Location: ${field.location}, Soil: ${field.soil_type}.
        Latest Soil Data: 
        - Temperature: ${latestData.temperature}°C
        - Moisture: ${latestData.moisture}%
        - pH Level: ${latestData.ph_level}
        - NPK Profile: Nitrogen ${latestData.npk_n}, Phosphorus ${latestData.npk_p}, Potassium ${latestData.npk_k}
        
        Focus only on these four markers to determine growth suitability.
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
              yield: { type: Type.STRING, description: "Expected yield estimate" },
              requirements: { type: Type.STRING, description: "Key growth requirements" },
              icon: { type: Type.STRING, description: "FontAwesome icon class string e.g. fa-leaf" }
            },
            required: ["name", "suitability", "yield", "requirements", "icon"]
          }
        }
      }
    });
    
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
