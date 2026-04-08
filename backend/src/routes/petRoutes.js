import express from 'express';
import * as petController from '../controllers/petController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas de mascotas requieren autenticación
router.use(authenticate);

router.post('/', petController.createPet);
router.get('/', petController.getPetsByOwner);
router.get('/:petId', petController.getPetById);
router.put('/:petId', petController.updatePet);
router.delete('/:petId', petController.deletePet);
router.get('/:petId/medical-history', petController.getPetMedicalHistory);

export default router;
