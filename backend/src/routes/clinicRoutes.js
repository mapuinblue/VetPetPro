import express from 'express';
import * as clinicController from '../controllers/clinicController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/', clinicController.getAllClinics);
router.get('/:clinicId', clinicController.getClinicById);

// Rutas protegidas - solo para clínicas
router.post('/', authenticate, authorize(['admin']), clinicController.createClinic);
router.put('/:clinicId', authenticate, authorize(['admin', 'clinic']), clinicController.updateClinic);
router.delete('/:clinicId', authenticate, authorize(['admin']), clinicController.deleteClinic);

// Estadísticas
router.get('/:clinicId/stats', authenticate, authorize(['clinic']), clinicController.getClinicStats);

export default router;
