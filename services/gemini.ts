
import { GoogleGenAI, Type } from "@google/genai";
import { Field, Sensor } from '../types';

export interface SoilInsight {
  summary: string;
  soil_fertilizer: string;
}

export interface ManagementPrescription {
  irrigation: {
    needed: boolean;
    volume: string;
    schedule: string;
  };
  nutrient: {
    needed: boolean;
    fertilizers: Array<{ type: string; amount: string }>;
    advice: string;
  };
}

export interface PlantDiagnosis {
  diagnosis: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  treatment: string;
  prevention: string;
}

export const GeminiService = {
  async analyzeField(field: Field, sensors: Sensor[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-preview';
    
    const activeSensors = sensors.filter(s => s.last_reading);
    const sensorTypes = activeSensors.map(s => s.sensor_type.toLowerCase());
    
    const telemetryContext = activeSensors.map(s => {
      const r = s.last_reading;
      if (!r) return `${s.sensor_type}: MISSING`;
      if (s.sensor_type.toLowerCase().includes('npk')) return `NPK: N=${r.n || 0}, P=${r.p || 0}, K=${r.k || 0} ppm`;
      if (s.sensor_type.toLowerCase().includes('moisture')) return `Moisture: ${r.value || 0}%`;
      if (s.sensor_type.toLowerCase().includes('temperature')) return `Temperature: ${r.value || 0}°C`;
      if (s.sensor_type.toLowerCase().includes('ph')) return `pH: ${r.value || 0}`;
      return `${s.sensor_type}: ${r.value || 0}`;
    }).join(', ');

    const prompt = `
      You are Agricare AI, a precision agricultural expert specialized in Bangladesh's deltaic agriculture.
      
      FIELD DATA:
      - Field Name: ${field.field_name}
      - Location: ${field.location}
      - Soil Type: ${field.soil_type}
      - Registered/Active Sensors: ${sensorTypes.length > 0 ? sensorTypes.join(', ') : 'None (Predictive Baseline Mode)'}
      - Telemetry Data: ${telemetryContext || 'No real-time data available.'}

      STRICT INSTRUCTIONS:
      1. Provide a "Soil Restoration Strategy" and "Operational Roadmap".
      2. These MUST ONLY be based on the sensor types that are currently active.
      3. Suggest 3 crops suitable for the Bangladesh climate.
      4. Return a valid JSON object matching the requested schema.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          thinkingConfig: { thinkingBudget: 16000 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              soilInsight: { type: Type.STRING },
              restorationStrategy: { type: Type.STRING },
              crops: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    suitability: { type: Type.NUMBER },
                    icon: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    fertilizer: { type: Type.STRING }
                  }
                }
              },
              roadmap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.STRING },
                    priority: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["soilInsight", "restorationStrategy", "crops", "roadmap"]
          }
        }
      });
      return JSON.parse(response.text.trim());
    } catch (e) {
      console.error("AI Node Failure:", e);
      return null;
    }
  },

  async getManagementPrescriptions(field: Field, data: any): Promise<ManagementPrescription> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';

    const prompt = `
      Act as an AI Agricultural Manager. Based on the following field data:
      Field: ${field.field_name}
      Location: ${field.location}
      Soil: ${field.soil_type}
      Current Metrics: ${JSON.stringify(data)}

      Provide irrigation and nutrient prescriptions.
      Return strictly valid JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
                }
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
                      }
                    }
                  },
                  advice: { type: Type.STRING }
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text.trim());
    } catch (e) {
      return {
        irrigation: { needed: false, volume: "N/A", schedule: "Sensor sync required" },
        nutrient: { needed: false, fertilizers: [], advice: "Check sensor connectivity" }
      };
    }
  },

  async diagnosePlantHealth(base64Image: string, mimeType: string): Promise<PlantDiagnosis | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';

    const prompt = `
      You are an expert plant pathologist. Analyze this image of a plant/leaf.
      Identify the plant species, detect any diseases, pests, or nutrient deficiencies.
      Provide a diagnosis, severity level, and specific treatment/prevention steps for farmers in Bangladesh.
      
      Return a JSON object with:
      diagnosis: plant name and issue name
      issue: concise summary of the problem
      severity: low, medium, high, critical
      confidence: 0-1
      treatment: actionable steps to fix the issue
      prevention: how to stop it from recurring
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { data: base64Image, mimeType } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diagnosis: { type: Type.STRING },
              issue: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
              confidence: { type: Type.NUMBER },
              treatment: { type: Type.STRING },
              prevention: { type: Type.STRING }
            },
            required: ["diagnosis", "issue", "severity", "confidence", "treatment", "prevention"]
          }
        }
      });
      return JSON.parse(response.text.trim());
    } catch (e) {
      console.error("Vision AI Failure:", e);
      return null;
    }
  }
};

export const getCropAnalysis = async (field: Field, stats: any) => {
  const result = await GeminiService.analyzeField(field, []);
  return result?.crops || [];
};

export const getSoilHealthSummary = async (field: Field, stats: any): Promise<SoilInsight> => {
  const result = await GeminiService.analyzeField(field, []);
  return { summary: result?.soilInsight || 'No data', soil_fertilizer: result?.restorationStrategy || '' };
};

export const getDetailedManagementPlan = async (field: Field, stats: any) => {
  const result = await GeminiService.analyzeField(field, []);
  return result?.roadmap || [];
};

export const getManagementPrescriptions = GeminiService.getManagementPrescriptions;
