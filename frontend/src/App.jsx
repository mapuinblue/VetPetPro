import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authAPI } from './services/api';

/**
 * ARCHIVO PRINCIPAL - App.jsx
 * 
 * Define todas las rutas de la aplicación y su protección.
 * Estructura:
 * 1. Páginas públicas (sin autenticación)
 * 2. Rutas protegidas por rol (owner, clinic, admin)
 * 3. Componentes reutilizables (Header, Footer)
 * 4. Protección automática de rutas según autenticación
 * 
 * ROLES Y ACCESO:
 * - owner: Dueño de mascotas
 *   /dashboard, /pets, /services, /book-appointment, /appointments, /pet-history
 * 
 * - clinic: Clínica veterinaria  
 *   /clinic/dashboard, /clinic/services, /clinic/appointments, /clinic/reports
 * 
 * - admin: Administrativo
 *   /admin/* (futuras rutas)
 * 
 * ARQUITECTURA DE SEGURIDAD:
 * - ProtectedRoute wrapper para validar token
 * - Verificación de rol requerido
 * - Redirect automático a login si no autenticado
 */

// ============================================
// PÁGINAS PÚBLICAS - Accesibles sin login
// ============================================
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// ============================================
// PÁGINAS PARA DUEÑOS DE MASCOTAS (role: owner)
// ============================================
import OwnerDashboard from './pages/owner/Dashboard';
import MyPets from './pages/owner/MyPets';
import ServicesCatalog from './pages/owner/ServicesCatalog';
import BookAppointment from './pages/owner/BookAppointment';
import MyAppointments from './pages/owner/MyAppointments';
import PetMedicalHistory from './pages/owner/PetMedicalHistory';

// ============================================
// PÁGINAS PARA CLÍNICAS (role: clinic)
// ============================================
import ClinicDashboard from './pages/clinic/Dashboard';
import ManageServices from './pages/clinic/ManageServices';
import ManageAppointments from './pages/clinic/ManageAppointments';
import Reports from './pages/clinic/Reports';
import Availability from './pages/clinic/Availability';

// Componentes reutilizables
import Header from './components/Header';
import Footer from './components/Footer';

/**
 * COMPONENTE: ProtectedRoute
 * 
 * Wrapper que protege rutas requiriendo autenticación.
 * Opcionalemente, valida que el usuario tenga un rol específico.
 * 
 * USO:
 * <ProtectedRoute requiredRole="owner">
 *   <MiPagina />
 * </ProtectedRoute>
 * 
 * FLUJO:
 * 1. Verifica que existe token en localStorage
 * 2. Llama al backend para obtener datos del usuario (y su rol)
 * 3. Si requiredRole es especificado, valida que el usuario tenga ese rol
 * 4. Si todo es OK, muestra el componente
 * 5. Si no autenticado o rol no coincide, redirige al home o login
 * 
 * @param {React.ReactNode} children - Componente a renderizar si autorizado
 * @param {string} requiredRole - Rol requerido (opcional): 'owner', 'clinic', 'admin'
 */
const ProtectedRoute = ({ children, requiredRole = null }) => {
  // Estado de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Rol del usuario autenticado
  const [userRole, setUserRole] = useState(null);
  
  // Indicador de que aún se está verificando autenticación
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Verificar autenticación del usuario
     * 
     * 1. Obtener token de localStorage
     * 2. Si no hay token, no está autenticado
     * 3. Si hay token, hacer request al backend para obtener datos
     * 4. Guardar rol para verificación de autorización
     */
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // No hay token = no autenticado
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Obtener datos del usuario usando el token
        const response = await authAPI.getCurrentUser();
        setUserRole(response.data.role);
        setIsAuthenticated(true);
      } catch (error) {
        // Token inválido o expirado
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Mostrando pantalla de carga
  if (loading) {
    return <div className="container mt-3"><p>Cargando...</p></div>;
  }

  // No autenticado → Redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Rol requerido pero no coincide → Redirigir a home
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Autorizado → Mostrar componente
  return children;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app">
        <Header />
        <main style={{ minHeight: 'calc(100vh - 200px)' }}>
          <Routes>
            {/* ============================================
                RUTAS PÚBLICAS - Sin autenticación requerida
                ============================================ */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ============================================
                RUTAS PARA DUEÑOS DE MASCOTAS
                ============================================ */}
            
            {/* Dashboard del dueño - índice principal */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            } />
            
            {/* Gestión de mascotas del dueño */}
            <Route path="/pets" element={
              <ProtectedRoute requiredRole="owner">
                <MyPets />
              </ProtectedRoute>
            } />
            
            {/* Ver catálogo de servicios de clínicas */}
            <Route path="/services" element={
              <ProtectedRoute requiredRole="owner">
                <ServicesCatalog />
              </ProtectedRoute>
            } />
            <Route path="/book-appointment" element={
              <ProtectedRoute requiredRole="owner">
                <BookAppointment />
              </ProtectedRoute>
            } />
            <Route path="/appointments" element={
              <ProtectedRoute requiredRole="owner">
                <MyAppointments />
              </ProtectedRoute>
            } />
            <Route path="/pet/:petId/medical-history" element={
              <ProtectedRoute requiredRole="owner">
                <PetMedicalHistory />
              </ProtectedRoute>
            } />

            {/* Rutas de clínicas */}
            <Route path="/clinic/dashboard" element={
              <ProtectedRoute requiredRole="clinic">
                <ClinicDashboard />
              </ProtectedRoute>
            } />
            <Route path="/clinic/services" element={
              <ProtectedRoute requiredRole="clinic">
                <ManageServices />
              </ProtectedRoute>
            } />
            <Route path="/clinic/appointments" element={
              <ProtectedRoute requiredRole="clinic">
                <ManageAppointments />
              </ProtectedRoute>
            } />
            <Route path="/clinic/availability" element={
              <ProtectedRoute requiredRole="clinic">
                <Availability />
              </ProtectedRoute>
            } />
            <Route path="/clinic/reports" element={
              <ProtectedRoute requiredRole="clinic">
                <Reports />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
