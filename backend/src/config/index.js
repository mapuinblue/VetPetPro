import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 3100,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_PATH: process.env.DB_PATH || './data/vetpetpro.db',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3001',
  EMAIL_HOST: process.env.EMAIL_HOST || 'localhost',
  EMAIL_PORT: process.env.EMAIL_PORT || 1025,
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_AUTH_USER: process.env.EMAIL_AUTH_USER,
  EMAIL_AUTH_PASS: process.env.EMAIL_AUTH_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@vetpetpro.com'
};
