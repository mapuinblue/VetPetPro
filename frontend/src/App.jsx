import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authAPI } from './services/api';

// Páginas públicas
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Páginas de usuario
import OwnerDashboard from './pages/owner/Dashboard';
import MyPets from './pages/owner/MyPets';
import ServicesCatalog from './pages/owner/ServicesCatalog';
import BookAppointment from './pages/owner/BookAppointment';
import MyAppointments from './pages/owner/MyAppointments';
import PetMedicalHistory from './pages/owner/PetMedicalHistory';

// Páginas de clínica
import ClinicDashboard from './pages/clinic/Dashboard';
import ManageServices from './pages/clinic/ManageServices';
import ManageAppointments from './pages/clinic/ManageAppointments';
import Reports from './pages/clinic/Reports';
import Availability from './pages/clinic/Availability';

// Componentes
import Header from './components/Header';
import Footer from './components/Footer';

// Protección de rutas
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const response = await authAPI.getCurrentUser();
        setUserRole(response.data.role);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div className="container mt-3"><p>Cargando...</p></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main style={{ minHeight: 'calc(100vh - 200px)' }}>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Rutas de dueños de mascotas */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/pets" element={
              <ProtectedRoute requiredRole="owner">
                <MyPets />
              </ProtectedRoute>
            } />
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
