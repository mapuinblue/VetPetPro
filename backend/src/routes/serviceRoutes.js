import express from 'express';
import * as serviceController from '../controllers/serviceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas - consultar servicios
router.get('/clinic/:clinicId', serviceController.getServicesByClinic);
router.get('/search/:clinicId', serviceController.getServicesByCategory);
router.get('/:serviceId', serviceController.getServiceById);

// Rutas privadas - solo para clínicas
router.post('/', authenticate, authorize(['clinic']), serviceController.createService);
router.put('/:serviceId', authenticate, authorize(['clinic']), serviceController.updateService);
router.delete('/:serviceId', authenticate, authorize(['clinic']), serviceController.deleteService);

export default router;
