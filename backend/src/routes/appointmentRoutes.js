import express from 'express';
import * as appointmentController from '../controllers/appointmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rutas para propietarios de mascotas
router.post('/', authenticate, authorize(['owner']), appointmentController.createAppointment);
router.get('/', authenticate, authorize(['owner']), appointmentController.getAppointmentsByOwner);
router.delete('/:appointmentId/cancel', authenticate, authorize(['owner']), appointmentController.cancelAppointment);

// Rutas para clínicas
router.get('/clinic/:clinicId', authenticate, authorize(['clinic']), appointmentController.getAppointmentsByClinic);
router.patch('/:appointmentId/status', authenticate, authorize(['clinic']), appointmentController.updateAppointmentStatus);

// Rutas comunes
router.get('/:appointmentId', authenticate, appointmentController.getAppointmentById);

export default router;
