import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { appointmentAPI } from '../services/api';

export default function MyAppointments() {
  const { user } = useUser();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled

  useEffect(() => {
    if (!user?.id) return;
    fetchAppointments();
  }, [user?.id, filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentAPI.getAppointments({ 
        filter,
        ownerId: user.id 
      });
      setAppointments(response.data || []);
    } catch (err) {
      setError('Error al cargar citas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('¿Deseas cancelar esta cita?')) return;

    try {
      await appointmentAPI.cancelAppointment(appointmentId, 'Cancelada por usuario');
      setAppointments(appointments.filter(a => a.id !== appointmentId));
    } catch (err) {
      alert('Error al cancelar cita');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>📋 Mis Citas</h1>
        <Link to="/book-appointment" className="btn btn-primary">
          + Agendar Nueva Cita
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {['all', 'upcoming', 'completed', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: filter === f ? '#3b82f6' : '#e5e7eb',
              color: filter === f ? '#fff' : '#000',
              cursor: 'pointer',
              fontWeight: filter === f ? 'bold' : 'normal'
            }}
          >
            {f === 'all' && 'Todas'}
            {f === 'upcoming' && 'Próximas'}
            {f === 'completed' && 'Completadas'}
            {f === 'cancelled' && 'Canceladas'}
          </button>
        ))}
      </div>

      {appointments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            No tienes citas {filter !== 'all' ? `${filter}` : ''}
          </p>
          <Link to="/book-appointment" className="btn btn-primary">
            Agendar tu primera cita
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {appointments.map(apt => (
            <div
              key={apt.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1.5rem',
                backgroundColor: apt.status === 'programada' ? '#f0fdf4' : '#f9fafb'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Mascota:</strong> {apt.petName}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Servicio:</strong> {apt.serviceName}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Clínica:</strong> {apt.clinicName}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Fecha:</strong> {new Date(apt.appointmentDate).toLocaleDateString()}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Hora:</strong> {apt.appointmentTime}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Estado:</strong> <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '4px',
                      backgroundColor: apt.status === 'programada' ? '#dcfce7' : '#fee2e2',
                      color: apt.status === 'programada' ? '#15803d' : '#991b1b'
                    }}>
                      {apt.status}
                    </span>
                  </p>
                </div>
              </div>

              {apt.status === 'programada' && (
                <button
                  onClick={() => handleCancelAppointment(apt.id)}
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar Cita
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
