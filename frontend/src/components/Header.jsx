import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';

export default function Header() {
  const { user } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#1e3a8a' }}>
          <img 
            src="/vetpetpro-logo.png" 
            alt="VetPetPro Logo" 
            style={{ height: '40px', width: '40px' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>VetPetPro</span>
        </Link>

        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {!user ? (
            <>
              <Link to="/services">Servicios</Link>
              <Link to="/login" className="btn btn-primary btn-sm">Iniciar Sesión</Link>
              <Link to="/register" className="btn btn-secondary btn-sm">Registrarse</Link>
            </>
          ) : (
            <>
              {user.role === 'owner' && (
                <>
                  <Link to="/dashboard">Panel</Link>
                  <Link to="/pets">Mis Mascotas</Link>
                  <Link to="/book-appointment">Agendar Cita</Link>
                  <Link to="/appointments">Mis Citas</Link>
                  <Link to="/services">Servicios</Link>
                </>
              )}
              {user.role === 'clinic' && (
                <>
                  <Link to="/clinic/dashboard">Panel</Link>
                  <Link to="/clinic/appointments">Citas</Link>
                  <Link to="/clinic/services">Servicios</Link>
                  <Link to="/clinic/reports">Reportes</Link>
                </>
              )}
              <span>{user.firstName} ({user.role})</span>
              <button className="btn btn-danger btn-sm" onClick={handleLogout}>Cerrar Sesión</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
