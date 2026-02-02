-- Agricare Database Schema

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_end DATE
);

CREATE TABLE IF NOT EXISTS fields (
  field_id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  field_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  size DECIMAL(10, 2),
  soil_type VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS sensors (
  sensor_id SERIAL PRIMARY KEY,
  field_id INTEGER REFERENCES fields(field_id),
  sensor_type VARCHAR(100) NOT NULL,
  battery_level INTEGER CHECK (battery_level BETWEEN 0 AND 100),
  status VARCHAR(50) DEFAULT 'active',
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sensor_data (
  data_id SERIAL PRIMARY KEY,
  field_id INTEGER REFERENCES fields(field_id),
  temperature DECIMAL(5, 2),
  moisture DECIMAL(5, 2),
  ph_level DECIMAL(4, 2),
  npk_n INTEGER,
  npk_p INTEGER,
  npk_k INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);