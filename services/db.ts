import { User, Field, Sensor } from '../types';
import { MOCK_FIELDS, MOCK_SENSORS } from '../constants';

// Internal State Helpers
const getStorage = <T>(key: string, fallback: T): T => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
};

const setStorage = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const loginUser = async (email: string, pass: string): Promise<User | null> => {
  // Simple check for demo purposes
  if (email.includes('error')) return null;
  
  return {
    id: 'user-demo-id',
    name: 'Arif Hossain',
    email: email,
    subscriptionPlan: 'premium',
    subscriptionEnd: '2025-12-31'
  };
};

export const registerUser = async (userData: User, pass: string): Promise<User> => {
  const newUser = { ...userData, id: 'user-' + Math.random().toString(36).substr(2, 9) };
  return newUser;
};

export const syncFields = async (userId: string): Promise<Field[]> => {
  return getStorage('agricare_fields', MOCK_FIELDS);
};

export const addFieldToDb = async (field: Field) => {
  const fields = getStorage('agricare_fields', MOCK_FIELDS);
  setStorage('agricare_fields', [...fields, field]);
};

export const syncSensorsFromDb = async (fields: Field[]): Promise<Sensor[]> => {
  return getStorage('agricare_sensors', MOCK_SENSORS);
};

export const addOrUpdateSensorInDb = async (sensor: Sensor) => {
  const sensors = getStorage('agricare_sensors', MOCK_SENSORS);
  const index = sensors.findIndex(s => s.sensor_id === sensor.sensor_id);
  const updated = [...sensors];
  if (index >= 0) {
    updated[index] = sensor;
  } else {
    updated.push(sensor);
  }
  setStorage('agricare_sensors', updated);
};

export const deleteSensorFromDb = async (id: number) => {
  const sensors = getStorage('agricare_sensors', MOCK_SENSORS);
  setStorage('agricare_sensors', sensors.filter(s => s.sensor_id !== id));
};

export const DbService = {
  getFields: syncFields,
  getSensors: async (fieldIds: number[]) => {
    const all = getStorage('agricare_sensors', MOCK_SENSORS);
    return all.filter(s => fieldIds.includes(s.field_id));
  }
};