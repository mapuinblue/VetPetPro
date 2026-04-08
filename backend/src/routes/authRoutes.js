import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/request-password-reset', authController.requestPasswordReset);

// Rutas autenticadas
router.get('/profile', authenticate, authController.getCurrentUser);

export default router;
