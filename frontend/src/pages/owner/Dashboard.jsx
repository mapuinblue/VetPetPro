import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentAPI, petAPI } from '../../services/api';

export default function OwnerDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [apptResponse, petsResponse] = await Promise.all([
        appointmentAPI.getAppointments({ status: 'programada' }),
        petAPI.getPets()
      ]);
      setAppointments(apptResponse.data);
      setPets(petsResponse.data);
    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container mt-3">Cargando...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1>Panel de Control</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Quick Actions */}
      <div className="grid-3" style={{ marginBottom: '3rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>📅 Próximas Citas</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{appointments.length}</p>
          <Link to="/appointments" className="btn btn-primary btn-sm">Ver Citas</Link>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>🐕 Mis Mascotas</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{pets.length}</p>
          <Link to="/pets" className="btn btn-primary btn-sm">Gestionar</Link>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>🏥 Agendar Cita</h3>
          <p style={{ fontSize: '1rem' }}>Reserva una nueva cita</p>
          <Link to="/book-appointment" className="btn btn-success btn-sm">Agendar</Link>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="card">
        <h2>Próximas Citas</h2>
        {appointments.length === 0 ? (
          <p>No tienes citas programadas. <Link to="/book-appointment">Agenda una ahora</Link></p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mascota</th>
                <th>Servicio</th>
                <th>Clínica</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {appointments.slice(0, 5).map((appt) => (
                <tr key={appt.id}>
                  <td>{appt.petName}</td>
                  <td>{appt.serviceName}</td>
                  <td>{appt.clinicName}</td>
                  <td>{new Date(appt.appointmentDate).toLocaleDateString('es-ES')}</td>
                  <td><span style={{ backgroundColor: '#dcfce7', padding: '0.25rem 0.75rem', borderRadius: '0.25rem' }}>{appt.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
