import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { availabilityAPI } from '../../services/api';

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' }
];

export default function Availability() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Obtener horarios actuales
  useEffect(() => {
    if (!user?.clinicId) {
      navigate('/clinic/dashboard');
      return;
    }
    fetchSchedule();
  }, [user?.clinicId]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await availabilityAPI.getClinicSchedule(user.clinicId);
      const scheduleMap = {};
      response.data.forEach(item => {
        scheduleMap[item.dayOfWeek] = {
          startTime: item.startTime,
          endTime: item.endTime,
          isOpen: item.isActive === 1
        };
      });
      setSchedule(scheduleMap);
    } catch (err) {
      setError('Error al cargar horarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (dayOfWeek, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value
      }
    }));
  };

  const handleToggleDay = (dayOfWeek) => {
    setSchedule(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        isOpen: !prev[dayOfWeek]?.isOpen
      }
    }));
  };

  const handleSaveSchedule = async () => {
    try {
      setError('');
      setSuccess('');

      for (const [dayOfWeek, daySchedule] of Object.entries(schedule)) {
        if (daySchedule.isOpen && daySchedule.startTime && daySchedule.endTime) {
          await availabilityAPI.updateSchedule({
            clinicId: user.clinicId,
            dayOfWeek: parseInt(dayOfWeek),
            startTime: daySchedule.startTime,
            endTime: daySchedule.endTime,
            isOpen: true
          });
        }
      }

      setSuccess('✅ Horarios guardados exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al guardar horarios');
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '2rem' }}>📅 Gestionar Disponibilidad</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.5rem',
        maxWidth: '800px'
      }}>
        {DAYS.map(day => (
          <div
            key={day.value}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem',
              backgroundColor: schedule[day.value]?.isOpen ? '#f0fdf4' : '#f9fafb'
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <input
                type="checkbox"
                checked={schedule[day.value]?.isOpen || false}
                onChange={() => handleToggleDay(day.value)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', minWidth: '120px' }}>
                {day.label}
              </span>
            </div>

            {schedule[day.value]?.isOpen && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Hora de Apertura</label>
                  <input
                    type="time"
                    value={schedule[day.value]?.startTime || '08:00'}
                    onChange={(e) => handleScheduleChange(day.value, 'startTime', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Hora de Cierre</label>
                  <input
                    type="time"
                    value={schedule[day.value]?.endTime || '18:00'}
                    onChange={(e) => handleScheduleChange(day.value, 'endTime', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button
          className="btn btn-primary"
          onClick={handleSaveSchedule}
          style={{ padding: '1rem 2rem', fontSize: '1rem' }}
        >
          💾 Guardar Horarios
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/clinic/dashboard')}
          style={{ padding: '1rem 2rem', fontSize: '1rem' }}
        >
          ← Volver
        </button>
      </div>

      {/* Info */}
      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        borderLeft: '4px solid #3b82f6'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>💡 Cómo Funciona</h3>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>Marca los días que tu clínica está abierta</li>
          <li>Define la hora de apertura y cierre para cada día</li>
          <li>Los dueños verán solo horarios dentro de estas franjas</li>
          <li>Los slots se generan automáticamente según la duración del servicio</li>
        </ul>
      </div>
    </div>
  );
}
