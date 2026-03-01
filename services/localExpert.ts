import { CropRecommendation, SensorData, Field, SoilInsight, ManagementPrescription } from "../types";

/**
 * Local Expert System based on Kaggle Crop Recommendation & BARI Guidelines
 * This acts as a robust fallback or primary engine when AI is unavailable.
 */

interface CropProfile {
  name: string;
  n: [number, number];
  p: [number, number];
  k: [number, number];
  ph: [number, number];
  temp: [number, number];
  moisture: [number, number];
  soilTypes: string[];
  yield: string;
  requirements: string;
  fertilizer: string;
  icon: string;
}

const CROP_PROFILES: CropProfile[] = [
  {
    name: "Rice (Boro)",
    n: [60, 100], p: [30, 50], k: [30, 50], ph: [5.0, 6.5], temp: [20, 35], moisture: [70, 95],
    soilTypes: ["clay", "peaty", "alluvial"],
    yield: "4.5-6.0 Ton/Ha",
    requirements: "Requires standing water and high nitrogen.",
    fertilizer: "Urea (150kg), TSP (80kg), MoP (70kg)",
    icon: "fa-seedling"
  },
  {
    name: "Wheat",
    n: [80, 120], p: [40, 60], k: [20, 40], ph: [6.0, 7.5], temp: [15, 25], moisture: [30, 60],
    soilTypes: ["loamy", "alluvial"],
    yield: "3.5-4.5 Ton/Ha",
    requirements: "Cool climate and well-drained loamy soil.",
    fertilizer: "DAP (100kg), Urea (80kg), Gypsum (20kg)",
    icon: "fa-wheat-awn"
  },
  {
    name: "Maize",
    n: [90, 130], p: [45, 70], k: [30, 60], ph: [5.5, 7.0], temp: [20, 30], moisture: [50, 80],
    soilTypes: ["loamy", "alluvial", "red"],
    yield: "7.0-10.0 Ton/Ha",
    requirements: "High nutrient feeder, needs good drainage.",
    fertilizer: "Urea (200kg), TSP (100kg), MoP (80kg)",
    icon: "fa-sun"
  },
  {
    name: "Jute",
    n: [40, 80], p: [20, 40], k: [20, 40], ph: [6.0, 7.5], temp: [24, 35], moisture: [70, 90],
    soilTypes: ["alluvial", "silty", "clay"],
    yield: "2.5-3.5 Ton/Ha",
    requirements: "High humidity and standing water during growth.",
    fertilizer: "Urea (100kg), TSP (50kg)",
    icon: "fa-leaf"
  },
  {
    name: "Potato",
    n: [80, 120], p: [60, 90], k: [100, 150], ph: [5.5, 6.5], temp: [15, 22], moisture: [60, 80],
    soilTypes: ["loamy", "sandy"],
    yield: "25-35 Ton/Ha",
    requirements: "Potassium heavy crop, needs loose soil.",
    fertilizer: "MoP (150kg), Urea (120kg), TSP (100kg)",
    icon: "fa-circle"
  },
  {
    name: "Cotton",
    n: [100, 140], p: [40, 60], k: [20, 40], ph: [7.0, 8.5], temp: [22, 32], moisture: [40, 70],
    soilTypes: ["black", "alluvial"],
    yield: "2.0-3.0 Ton/Ha",
    requirements: "Deep soil and moderate rainfall.",
    fertilizer: "Urea (120kg), DAP (80kg)",
    icon: "fa-shirt"
  },
  {
    name: "Watermelon",
    n: [80, 120], p: [20, 40], k: [40, 80], ph: [6.0, 7.0], temp: [24, 32], moisture: [20, 50],
    soilTypes: ["sandy", "red"],
    yield: "40-60 Ton/Ha",
    requirements: "Warm weather and sandy soil for root expansion.",
    fertilizer: "Urea (100kg), MoP (60kg)",
    icon: "fa-apple-whole"
  },
  {
    name: "Millet",
    n: [40, 70], p: [20, 40], k: [20, 40], ph: [5.5, 7.5], temp: [25, 35], moisture: [10, 40],
    soilTypes: ["red", "sandy", "loamy"],
    yield: "1.5-2.5 Ton/Ha",
    requirements: "Drought resistant, low water requirement.",
    fertilizer: "Urea (50kg), TSP (30kg)",
    icon: "fa-bowl-rice"
  },
  {
    name: "Pulses (Lentil)",
    n: [20, 40], p: [40, 60], k: [20, 40], ph: [6.0, 7.5], temp: [15, 25], moisture: [30, 50],
    soilTypes: ["loamy", "alluvial"],
    yield: "1.2-1.8 Ton/Ha",
    requirements: "Nitrogen fixing crop, needs moderate moisture.",
    fertilizer: "Urea (20kg), TSP (60kg), MoP (30kg)",
    icon: "fa-seedling"
  },
  {
    name: "Mustard",
    n: [60, 90], p: [30, 50], k: [20, 40], ph: [6.0, 7.5], temp: [10, 25], moisture: [30, 50],
    soilTypes: ["loamy", "alluvial"],
    yield: "1.5-2.2 Ton/Ha",
    requirements: "Cool weather crop, sensitive to frost.",
    fertilizer: "Urea (100kg), TSP (70kg), Gypsum (20kg)",
    icon: "fa-oil-can"
  },
  {
    name: "Soyabean",
    n: [30, 60], p: [60, 100], k: [40, 70], ph: [6.0, 7.0], temp: [20, 30], moisture: [50, 70],
    soilTypes: ["loamy", "clay"],
    yield: "2.5-3.5 Ton/Ha",
    requirements: "High protein crop, needs phosphorus.",
    fertilizer: "Urea (40kg), TSP (120kg), MoP (60kg)",
    icon: "fa-leaf"
  }
];

const calculateScore = (crop: CropProfile, data: Partial<SensorData>, soilType: string): number => {
  let score = 0;
  const weights = { n: 15, p: 10, k: 10, ph: 20, temp: 15, moisture: 20, soil: 10 };

  const inRange = (val: number | undefined, range: [number, number]) => {
    if (val === undefined) return 0.5; // Neutral if data missing
    if (val >= range[0] && val <= range[1]) return 1;
    // Penalty for being far out of range
    const mid = (range[0] + range[1]) / 2;
    const dist = Math.abs(val - mid);
    const span = range[1] - range[0] || 1;
    return Math.max(0, 1 - dist / (span * 2));
  };

  score += inRange(data.npk_n, crop.n) * weights.n;
  score += inRange(data.npk_p, crop.p) * weights.p;
  score += inRange(data.npk_k, crop.k) * weights.k;
  score += inRange(data.ph_level, crop.ph) * weights.ph;
  score += inRange(data.temperature, crop.temp) * weights.temp;
  score += inRange(data.moisture, crop.moisture) * weights.moisture;

  if (crop.soilTypes.includes(soilType.toLowerCase())) {
    score += weights.soil;
  } else if (soilType === "Unknown") {
    score += weights.soil * 0.5;
  }

  return score;
};

export const getLocalCropAnalysis = (field: Field, data: Partial<SensorData>): CropRecommendation[] => {
  const soilType = field.soil_type || "Alluvial";
  const scoredCrops = CROP_PROFILES.map(crop => ({
    ...crop,
    score: calculateScore(crop, data, soilType)
  })).sort((a, b) => b.score - a.score);

  return scoredCrops.slice(0, 3).map(crop => ({
    name: `${crop.name}`,
    suitability: Math.round((crop.score / 100) * 100),
    yield: crop.yield,
    requirements: crop.requirements,
    fertilizer: crop.fertilizer,
    icon: crop.icon
  }));
};

export const getLocalSoilInsight = (field: Field, data: Partial<SensorData>): SoilInsight => {
  const ph = data.ph_level || 7;
  const moisture = data.moisture || 50;
  
  let summary = `Analysis based on Kaggle & BARI guidelines for ${field.soil_type || 'Alluvial'} soil. `;
  let strategy = "Recommended: ";

  if (ph < 5.5) {
    summary += "Soil is acidic. ";
    strategy += "Apply Lime (Dolomite) to increase pH. ";
  } else if (ph > 7.5) {
    summary += "Soil is alkaline. ";
    strategy += "Apply Gypsum to lower pH. ";
  } else {
    summary += "pH level is optimal. ";
    strategy += "Maintain organic matter. ";
  }

  if (moisture < 30) {
    summary += "Critically low moisture detected.";
    strategy += "Immediate irrigation required.";
  } else {
    summary += "Moisture levels are stable.";
  }

  return {
    summary: summary,
    soil_fertilizer: strategy
  };
};

export const getLocalPrescription = (field: Field, data: Partial<SensorData>): ManagementPrescription => {
  const moisture = data.moisture || 50;
  const n = data.npk_n || 50;
  
  return {
    irrigation: {
      needed: moisture < 40,
      volume: moisture < 20 ? "25-30mm" : "15-20mm",
      schedule: moisture < 20 ? "Daily" : "Every 3 days"
    },
    nutrient: {
      needed: n < 60,
      fertilizers: [
        { type: "Urea", amount: n < 40 ? "75kg/Ha" : "40kg/Ha" },
        { type: "Organic Compost", amount: "2 Ton/Ha" }
      ],
      advice: "Apply nitrogen in split doses for better absorption."
    }
  };
};

export const getLocalManagementPlan = (field: Field, data: Partial<SensorData>) => {
  return [
    { priority: "HIGH", title: "Kaggle-BARI Soil Prep", description: "Deep plowing recommended to improve aeration based on soil density.", icon: "fa-tractor" },
    { priority: "MEDIUM", title: "BARI Seasonal Sync", description: "Cross-verify planting dates with BARI seasonal calendar.", icon: "fa-calendar-check" },
    { priority: "MEDIUM", title: "NPK Balancing", description: "Adjust Nitrogen levels based on the specific crop selected.", icon: "fa-flask" },
    { priority: "LOW", title: "Drainage Audit", description: "Ensure field slope is optimal to prevent waterlogging.", icon: "fa-water" }
  ];
};
