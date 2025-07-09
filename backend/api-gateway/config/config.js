import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT;

export const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL,
  user: process.env.AUTH_SERVICE_URL,
};