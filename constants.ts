
import { Field, SensorData, Sensor } from './types';

export const MOCK_FIELDS: Field[] = [
  { field_id: 1, user_id: '1', field_name: 'North Valley Corn', location: 'Iowa, USA', size: 50.5, soil_type: 'Loamy' },
  { field_id: 2, user_id: '1', field_name: 'East Ridge Wheat', location: 'Kansas, USA', size: 120.0, soil_type: 'Clay' },
  { field_id: 3, user_id: '1', field_name: 'South Orchard', location: 'California, USA', size: 35.2, soil_type: 'Sandy' },
];

export const generateMockSensorData = (fieldId: number): SensorData[] => {
  const data: SensorData[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      data_id: Math.random(),
      field_id: fieldId,
      temperature: 20 + Math.random() * 10,
      moisture: 30 + Math.random() * 40,
      ph_level: 6.0 + Math.random() * 1.5,
      conductivity: 500 + Math.random() * 300,
      npk_n: 40 + Math.random() * 20,
      npk_p: 30 + Math.random() * 15,
      npk_k: 50 + Math.random() * 25,
      timestamp: date.toISOString().split('T')[0],
    });
  }
  return data;
};

export const MOCK_SENSORS: Sensor[] = [
  { sensor_id: 101, field_id: 1, sensor_type: 'Moisture/Temp', battery_level: 85, status: 'active', last_active: new Date().toISOString() },
  { sensor_id: 102, field_id: 1, sensor_type: 'NPK Analyzer', battery_level: 42, status: 'active', last_active: new Date().toISOString() },
  { sensor_id: 103, field_id: 2, sensor_type: 'Integrated Soil Probe', battery_level: 95, status: 'active', last_active: new Date().toISOString() },
  { sensor_id: 104, field_id: 3, sensor_type: 'Moisture', battery_level: 12, status: 'inactive', last_active: new Date().toISOString() },
];
