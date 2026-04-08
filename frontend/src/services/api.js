import axios from 'axios';

/**
 * API CLIENT CONFIGURATION
 * 
 * Este archivo centraliza todas las llamadas a la API del backend.
 * Usa Axios como cliente HTTP y configura interceptores para:
 * - Agregar token JWT a todos los requests
 * - Manejar problemas de autenticación (401)
 * - Redirect automático al login si el token expira
 * 
 * RUTAS DEL BACKEND:
 * - http://localhost:3100/api
 * 
 * AMBIENTE:
 * - Desarrollo: VITE_API_URL = http://localhost:3100/api
 * - Producción: Se configura en variables de ambiente
 */

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100/api';

/**
 * Crear instancia de Axios con configuración base
 * Se usa esta instancia para todos los requests HTTP
 */
const api = axios.create({
  baseURL: API_URL,
});

/**
 * INTERCEPTOR: Agregar token JWT a todos los requests
 * 
 * Automáticamente añade el header:
 * Authorization: Bearer <token>
 * 
 * Esto permite que el backend verifique que el usuario está autenticado.
 * El token se obtiene de localStorage (se guarda al hacer login).
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * INTERCEPTOR: Manejar errores de respuesta
 * 
 * Casos especiales:
 * - 401 (No autenticado): Token inválido o expirado
 *   → Limpia el token del storage
 *   → Redirige al login automáticamente
 * 
 * - Otros errores: Se pasan al catch de la llamada original
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiró o es inválido
      localStorage.removeItem('token');
      // Redirigir al login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH APIs - Autenticación y Perfil
// ============================================
export const authAPI = {
  // Registrar nuevo usuario (dueño o clínica)
  register: (data) => api.post('/auth/register', data),
  
  // Login - obtener token JWT
  login: (data) => api.post('/auth/login', data),
  
  // Solicitar recuperación de contraseña
  requestPasswordReset: (email) => api.post('/auth/request-password-reset', { email }),
  
  // Obtener perfil del usuario autenticado
  getCurrentUser: () => api.get('/auth/profile'),
};

// ============================================
// PETS APIs - Mascotas
// ============================================
export const petAPI = {
  // Crear mascota para el usuario actual
  createPet: (data) => api.post('/pets', data),
  
  // Obtener todas las mascotas del usuario
  getPets: () => api.get('/pets'),
  
  // Obtener detalles de una mascota específica
  getPet: (petId) => api.get(`/pets/${petId}`),
  
  // Actualizar datos de una mascota
  updatePet: (petId, data) => api.put(`/pets/${petId}`, data),
  
  // Eliminar una mascota (soft delete)
  deletePet: (petId) => api.delete(`/pets/${petId}`),
  
  // Obtener historial médico de una mascota
  getMedicalHistory: (petId) => api.get(`/pets/${petId}/medical-history`),
};

// ============================================
// SERVICES APIs - Servicios Veterinarios
// ============================================
export const serviceAPI = {
  // Obtener todos los servicios activos de una clínica
  // Usado por dueños para ver servicios disponibles
  getServicesbyClinic: (clinicId) => api.get(`/services/clinic/${clinicId}`),
  
  // Filtrar servicios por categoría (salud, estética, nutrición, guardería, funeraria)
  getServicesByCategory: (clinicId, category) => api.get(`/services/search/${clinicId}?category=${category}`),
  
  // Obtener detalles de un servicio específico
  getService: (serviceId) => api.get(`/services/${serviceId}`),
  
  // Crear nuevo servicio (solo clínicas autenticadas)
  // Body: {name, description, category, duration, price}
  createService: (data) => api.post('/services', data),
  
  // Actualizar servicio existente (solo propietario)
  updateService: (serviceId, data) => api.put(`/services/${serviceId}`, data),
  
  // Eliminar servicio (soft delete - marca como inactivo)
  deleteService: (serviceId) => api.delete(`/services/${serviceId}`),
};

// ============================================
// APPOINTMENTS APIs - Citas/Agendamientos
// ============================================
export const appointmentAPI = {
  // Crear nueva cita (solo dueños)
  // Body: {petId, serviceId, clinicId, appointmentDate, appointmentTime, notes}
  createAppointment: (data) => api.post('/appointments', data),
  
  // Obtener citas del usuario actual (con filtros opcionales)
  // Params: {status: 'upcoming'|'completed'|'cancelled'|'all'}
  getAppointments: (params) => api.get('/appointments', { params }),
  
  // Obtener citas de una clínica (solo para clínicas)
  getClinicAppointments: (clinicId, params) => api.get(`/appointments/clinic/${clinicId}`, { params }),
  
  // Obtener detalles de una cita específica
  getAppointment: (appointmentId) => api.get(`/appointments/${appointmentId}`),
  
  // Cancelar una cita con razón opcional
  // Body: {reason: "string"}
  cancelAppointment: (appointmentId, reason) => api.delete(`/appointments/${appointmentId}/cancel`, { data: { reason } }),
  
  // Actualizar estado de una cita (solo clínicteca)
  // Body: {status: 'completada'|'cancelada'|'no_asistió'}
  updateAppointmentStatus: (appointmentId, data) => api.patch(`/appointments/${appointmentId}/status`, data),
};

// ============================================
// CLINICS APIs - Información de Clínicas
// ============================================
export const clinicAPI = {
  // Obtener lista de clínicas (con paginación y búsqueda)
  getClinics: (params) => api.get('/clinics', { params }),
  
  // Obtener detalles de una clínica específica
  getClinic: (clinicId) => api.get(`/clinics/${clinicId}`),
  
  // Crear nueva clínica (solo admin)
  createClinic: (data) => api.post('/clinics', data),
  
  // Actualizar datos de clínica (solo propietario)
  updateClinic: (clinicId, data) => api.put(`/clinics/${clinicId}`, data),
  
  // Eliminar clínica (solo admin)
  deleteClinic: (clinicId) => api.delete(`/clinics/${clinicId}`),
  
  // Obtener estadísticas de una clínica
  getClinicStats: (clinicId) => api.get(`/clinics/${clinicId}/stats`),
};

// ============================================
// AVAILABILITY APIs - Disponibilidad/Horarios
// ============================================
export const availabilityAPI = {
  // Obtener horario de atención de una clínica (7 días)
  // Returns: [{dayOfWeek, startTime, endTime, isActive}, ...]
  getClinicSchedule: (clinicId) => api.get(`/availability/schedule/${clinicId}`),
  
  // Actualizar horario de una clínica (solo clínicas)
  // Body: {dayOfWeek, startTime, endTime, isOpen}
  updateSchedule: (data) => api.put('/availability/schedule', data),
  
  // Obtener slots disponibles para agendar
  // Params: {clinicId, serviceId, date}
  // Returns: ["09:00", "09:30", "10:00", ...]
  getAvailableSlots: (params) => api.get('/availability/slots', { params }),
  
  // Obtener citas de un día específico en una clínica
  // Params: {date}
  getClinicAppointmentsForDay: (clinicId, params) => api.get(`/availability/clinic/${clinicId}/appointments`, { params }),
};

// ============================================
// REPORTS APIs - Reportes y Estadísticas
// ============================================
export const reportAPI = {
  // Obtener reporte de citas en un rango de fechas
  getAppointmentReport: (clinicId, startDate, endDate) => 
    api.get(`/reports/appointments/${clinicId}`, { params: { startDate, endDate } }),
  getServiceReport: (clinicId) => api.get(`/reports/services/${clinicId}`),
  getRevenueReport: (clinicId, startDate, endDate) => 
    api.get(`/reports/revenue/${clinicId}`, { params: { startDate, endDate } }),
  getTopServices: (clinicId, limit) => api.get(`/reports/top-services/${clinicId}`, { params: { limit } }),
};

export default api;
