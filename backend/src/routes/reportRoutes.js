import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas de reportes requieren autenticación de clínica
router.use(authenticate, authorize(['clinic', 'admin']));

router.get('/appointments/:clinicId', reportController.getAppointmentReport);
router.get('/services/:clinicId', reportController.getServiceReport);
router.get('/revenue/:clinicId', reportController.getRevenueReport);
router.get('/top-services/:clinicId', reportController.getMostRequestedServices);

export default router;
