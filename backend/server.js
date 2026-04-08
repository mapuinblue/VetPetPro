import express from 'express';
import cors from 'cors';
import { config } from './src/config/index.js';
import { errorHandler } from './src/middleware/auth.js';

// Importar rutas
import authRoutes from './src/routes/authRoutes.js';
import petRoutes from './src/routes/petRoutes.js';
import serviceRoutes from './src/routes/serviceRoutes.js';
import appointmentRoutes from './src/routes/appointmentRoutes.js';
import clinicRoutes from './src/routes/clinicRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import availabilityRoutes from './src/routes/availabilityRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/availability', availabilityRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     VetPetPro API Server Running      ║
╠════════════════════════════════════════╣
║ Server: http://localhost:${PORT}
║ Environment: ${config.NODE_ENV}
║ CORS Origin: ${config.CORS_ORIGIN}
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
