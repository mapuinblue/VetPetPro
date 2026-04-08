import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100/api';

const api = axios.create({
  baseURL: API_URL,
});

// Agregar token a cada solicitud
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  requestPasswordReset: (email) => api.post('/auth/request-password-reset', { email }),
  getCurrentUser: () => api.get('/auth/profile'),
};

// Pets APIs
export const petAPI = {
  createPet: (data) => api.post('/pets', data),
  getPets: () => api.get('/pets'),
  getPet: (petId) => api.get(`/pets/${petId}`),
  updatePet: (petId, data) => api.put(`/pets/${petId}`, data),
  deletePet: (petId) => api.delete(`/pets/${petId}`),
  getMedicalHistory: (petId) => api.get(`/pets/${petId}/medical-history`),
};

// Services APIs
export const serviceAPI = {
  getServicesbyClinic: (clinicId) => api.get(`/services/clinic/${clinicId}`),
  getServicesByCategory: (clinicId, category) => api.get(`/services/search/${clinicId}?category=${category}`),
  getService: (serviceId) => api.get(`/services/${serviceId}`),
  createService: (data) => api.post('/services', data),
  updateService: (serviceId, data) => api.put(`/services/${serviceId}`, data),
  deleteService: (serviceId) => api.delete(`/services/${serviceId}`),
};

// Appointments APIs
export const appointmentAPI = {
  createAppointment: (data) => api.post('/appointments', data),
  getAppointments: (params) => api.get('/appointments', { params }),
  getClinicAppointments: (clinicId, params) => api.get(`/appointments/clinic/${clinicId}`, { params }),
  getAppointment: (appointmentId) => api.get(`/appointments/${appointmentId}`),
  cancelAppointment: (appointmentId, reason) => api.delete(`/appointments/${appointmentId}/cancel`, { data: { reason } }),
  updateAppointmentStatus: (appointmentId, data) => api.patch(`/appointments/${appointmentId}/status`, data),
};

// Clinics APIs
export const clinicAPI = {
  getClinics: (params) => api.get('/clinics', { params }),
  getClinic: (clinicId) => api.get(`/clinics/${clinicId}`),
  createClinic: (data) => api.post('/clinics', data),
  updateClinic: (clinicId, data) => api.put(`/clinics/${clinicId}`, data),
  deleteClinic: (clinicId) => api.delete(`/clinics/${clinicId}`),
  getClinicStats: (clinicId) => api.get(`/clinics/${clinicId}/stats`),
};

// Reports APIs
export const reportAPI = {
  getAppointmentReport: (clinicId, startDate, endDate) => 
    api.get(`/reports/appointments/${clinicId}`, { params: { startDate, endDate } }),
  getServiceReport: (clinicId) => api.get(`/reports/services/${clinicId}`),
  getRevenueReport: (clinicId, startDate, endDate) => 
    api.get(`/reports/revenue/${clinicId}`, { params: { startDate, endDate } }),
  getTopServices: (clinicId, limit) => api.get(`/reports/top-services/${clinicId}`, { params: { limit } }),
};

// Availability APIs
export const availabilityAPI = {
  updateSchedule: (data) => api.put('/availability/schedule', data),
  getClinicSchedule: (clinicId) => api.get(`/availability/schedule/${clinicId}`),
  getAvailableSlots: (params) => api.get('/availability/slots', { params }),
  getClinicAppointments: (clinicId, params) => api.get(`/availability/clinic/${clinicId}/appointments`, { params }),
};

export default api;
