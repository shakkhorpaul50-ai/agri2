
const fs = require('fs');

const soilTypes = ['Loamy', 'Clay', 'Sandy', 'Alluvial', 'Black', 'Red', 'Peaty'];
const cropDatabase = [
  { name: 'Rice', ph: [5.0, 7.0], moisture: [50, 90], n: [30, 60], p: [20, 40], k: [20, 40], soil: ['Clay', 'Alluvial', 'Peaty'] },
  { name: 'Wheat', ph: [6.0, 7.5], moisture: [20, 40], n: [60, 100], p: [30, 50], k: [30, 50], soil: ['Loamy', 'Alluvial', 'Black'] },
  { name: 'Potato', ph: [5.0, 6.5], moisture: [30, 50], n: [40, 80], p: [30, 60], k: [80, 150], soil: ['Loamy', 'Sandy'] },
  { name: 'Cotton', ph: [7.0, 8.5], moisture: [15, 30], n: [50, 90], p: [30, 50], k: [30, 60], soil: ['Black', 'Alluvial'] },
  { name: 'Watermelon', ph: [6.0, 7.5], moisture: [10, 25], n: [20, 40], p: [10, 30], k: [40, 80], soil: ['Sandy'] },
  { name: 'Jute', ph: [6.0, 7.5], moisture: [60, 90], n: [40, 70], p: [20, 40], k: [30, 60], soil: ['Clay', 'Alluvial'] },
  { name: 'Maize', ph: [5.5, 7.5], moisture: [30, 60], n: [80, 120], p: [40, 70], k: [40, 80], soil: ['Loamy', 'Alluvial'] },
  { name: 'Mustard', ph: [6.0, 7.5], moisture: [20, 40], n: [40, 70], p: [20, 40], k: [20, 40], soil: ['Alluvial', 'Loamy'] },
  { name: 'Groundnut', ph: [6.0, 7.5], moisture: [15, 30], n: [20, 40], p: [30, 50], k: [20, 40], soil: ['Sandy', 'Red'] },
  { name: 'Sugarcane', ph: [6.5, 8.0], moisture: [50, 80], n: [100, 150], p: [50, 80], k: [100, 200], soil: ['Alluvial', 'Black'] },
  { name: 'Tea', ph: [4.0, 5.5], moisture: [60, 90], n: [60, 100], p: [20, 40], k: [40, 80], soil: ['Peaty', 'Red'] },
  { name: 'Pineapple', ph: [4.5, 5.5], moisture: [40, 70], n: [40, 70], p: [20, 40], k: [60, 100], soil: ['Peaty', 'Sandy'] },
  { name: 'Millet', ph: [7.0, 8.5], moisture: [10, 25], n: [20, 50], p: [20, 40], k: [20, 40], soil: ['Red', 'Sandy'] },
  { name: 'Tomato', ph: [6.0, 7.0], moisture: [40, 60], n: [60, 100], p: [40, 80], k: [60, 120], soil: ['Loamy'] },
  { name: 'Carrot', ph: [6.0, 7.0], moisture: [30, 50], n: [40, 70], p: [40, 70], k: [80, 150], soil: ['Sandy', 'Loamy'] },
  { name: 'Onion', ph: [6.0, 7.5], moisture: [30, 50], n: [60, 100], p: [40, 80], k: [60, 120], soil: ['Loamy', 'Sandy'] },
  { name: 'Banana', ph: [6.0, 7.5], moisture: [60, 90], n: [150, 250], p: [50, 100], k: [200, 400], soil: ['Alluvial', 'Loamy'] },
  { name: 'Lentil', ph: [6.0, 7.5], moisture: [20, 40], n: [20, 40], p: [40, 80], k: [20, 40], soil: ['Loamy', 'Alluvial'] }
];

function getSuggestedCrops(ph, moisture, soil) {
  let suggested = cropDatabase
    .filter(crop => {
      const phMatch = ph >= crop.ph[0] && ph <= crop.ph[1];
      const moistureMatch = moisture >= crop.moisture[0] && moisture <= crop.moisture[1];
      const soilMatch = crop.soil.includes(soil);
      return phMatch && moistureMatch && soilMatch;
    })
    .map(c => c.name);
    
  if (suggested.length < 3) {
    const fallbacks = ['Maize', 'Millet', 'Lentil', 'Mustard', 'Tomato', 'Rice', 'Wheat'];
    for (const f of fallbacks) {
      if (!suggested.includes(f)) {
        suggested.push(f);
      }
      if (suggested.length >= 3) break;
    }
  }
  return suggested;
}

const data = [];
let id = 1;

for (const soil of soilTypes) {
  for (let ph = 4.0; ph <= 8.5; ph += 0.5) {
    for (let moisture = 10; moisture <= 90; moisture += 10) {
      const n = Math.floor(Math.random() * 100) + 20;
      const p = Math.floor(Math.random() * 60) + 10;
      const k = Math.floor(Math.random() * 150) + 20;
      const temp = Math.floor(Math.random() * 15) + 20;

      let suggested = getSuggestedCrops(ph, moisture, soil);

      data.push({
        ID: id++,
        Soil_Type: soil,
        pH: ph.toFixed(1),
        Nitrogen_N: n,
        Phosphorus_P: p,
        Potassium_K: k,
        Moisture_Percent: moisture,
        Temperature_C: temp,
        Suggested_Crops: suggested.join('; ')
      });
    }
  }
}

const header = Object.keys(data[0]).join(',');
const rows = data.map(row => Object.values(row).join(',')).join('\n');
fs.writeFileSync('bari_dataset.csv', header + '\n' + rows);
console.log('Generated ' + data.length + ' combinations in bari_dataset.csv');
