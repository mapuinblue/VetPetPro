import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const generateToken = (userId, role, clinicId = null) => {
  const payload = { userId, role };
  if (clinicId) {
    payload.clinicId = clinicId;
  }
  return jwt.sign(
    payload,
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};
