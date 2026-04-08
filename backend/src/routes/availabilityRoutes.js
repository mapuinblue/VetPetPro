import express from 'express';
import * as availabilityController from '../controllers/availabilityController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rutas para clínicas - Gestionar disponibilidad
router.put(
  '/schedule',
  authenticate,
  authorize(['clinic', 'admin']),
  availabilityController.updateClinicSchedule
);

router.get(
  '/schedule/:clinicId',
  availabilityController.getClinicSchedule
);

// Rutas para dueños - Ver slots disponibles
router.get(
  '/slots',
  availabilityController.getAvailableSlots
);

// Rutas para clínicas - Ver citas del día
router.get(
  '/clinic/:clinicId/appointments',
  authenticate,
  authorize(['clinic', 'admin']),
  availabilityController.getClinicAppointmentsForDay
);

export default router;
