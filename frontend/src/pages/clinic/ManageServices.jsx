import { useState, useEffect } from 'react';
import { useUser } from '../../hooks/useUser';
import { serviceAPI, availabilityAPI } from '../../services/api';

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' }
];

export default function ManageServices() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('services'); // 'services' o 'availability'
  const [services, setServices] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar servicios y horarios
  useEffect(() => {
    if (user?.clinicId) {
      if (activeTab === 'services') {
        fetchServices();
      } else {
        fetchSchedule();
      }
    }
  }, [activeTab, user?.clinicId]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await serviceAPI.getServicesbyClinic(user.clinicId);
      setServices(response.data || []);
    } catch (err) {
      setError('Error al cargar servicios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      setLoading(true);

      for (const [dayOfWeek, daySchedule] of Object.entries(schedule)) {
        if (daySchedule.isOpen && daySchedule.startTime && daySchedule.endTime) {
          const response = await availabilityAPI.updateSchedule({
            clinicId: user.clinicId,
            dayOfWeek: parseInt(dayOfWeek),
            startTime: daySchedule.startTime,
            endTime: daySchedule.endTime,
            isOpen: true
          });
          console.log('Schedule response:', response);
        }
      }

      setSuccess('✅ Horarios guardados exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error guardando horarios:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Error al guardar horarios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '2rem' }}>🏥 Gestionar Clínica</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('services')}
          style={{
            padding: '1rem 2rem',
            backgroundColor: activeTab === 'services' ? '#2563eb' : 'transparent',
            color: activeTab === 'services' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'services' ? 'bold' : 'normal',
            borderBottom: activeTab === 'services' ? '3px solid #2563eb' : 'none'
          }}
        >
          💊 Servicios
        </button>
        <button
          onClick={() => setActiveTab('availability')}
          style={{
            padding: '1rem 2rem',
            backgroundColor: activeTab === 'availability' ? '#2563eb' : 'transparent',
            color: activeTab === 'availability' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'availability' ? 'bold' : 'normal',
            borderBottom: activeTab === 'availability' ? '3px solid #2563eb' : 'none'
          }}
        >
          📅 Disponibilidad
        </button>
      </div>

      {/* Sección Servicios */}
      {activeTab === 'services' && (
        <div>
          <h2 style={{ marginBottom: '1.5rem' }}>Servicios de tu Clínica</h2>
          {loading ? (
            <p>Cargando servicios...</p>
          ) : services.length === 0 ? (
            <div className="alert alert-info">
              No hay servicios configurados. Contacta a administración.
            </div>
          ) : (
            <div>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Aquí puedes editar el precio de los servicios que ofrece tu clínica. Estos precios serán visibles para los dueños de mascotas al agendar citas.
              </p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr',
                gap: '1rem',
                maxWidth: '900px'
              }}>
                {services.map(service => (
                  <div
                    key={service.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      backgroundColor: '#f9fafb',
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      gap: '1rem',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>{service.name}</h4>
                      <p style={{ color: '#666', margin: '0', fontSize: '0.9rem' }}>
                        {service.description}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <small style={{ color: '#999' }}>Duración</small>
                      <div style={{ fontWeight: 'bold' }}>{service.duration} min</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <small style={{ color: '#999' }}>Precio</small>
                      <div style={{ fontWeight: 'bold' }}>
                        <span style={{ fontSize: '1.2rem' }}>$</span>{service.price}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#d1fae5',
                        color: '#047857',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}>
                        ✓ Activo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                borderLeft: '4px solid #f59e0b'
              }}>
                <strong>ℹ️ Nota:</strong> Para editar o agregar nuevos servicios, contacta al administrador del sistema.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sección Disponibilidad */}
      {activeTab === 'availability' && (
        <div>
          <h2 style={{ marginBottom: '1.5rem' }}>Horarios de Atención</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1.5rem',
            maxWidth: '800px',
            marginBottom: '2rem'
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
                      <label>Apertura</label>
                      <input
                        type="time"
                        value={schedule[day.value]?.startTime || '09:00'}
                        onChange={(e) => handleScheduleChange(day.value, 'startTime', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Cierre</label>
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

          <button
            className="btn btn-primary"
            onClick={handleSaveSchedule}
            disabled={loading}
            style={{ padding: '1rem 2rem', fontSize: '1rem' }}
          >
            💾 Guardar Horarios
          </button>

          {/* Info */}
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <h4>💡 Cómo Funciona</h4>
            <ul style={{ marginLeft: '1.5rem', margin: '0.5rem 0' }}>
              <li>Marca los días que tu clínica está abierta</li>
              <li>Define las horas de apertura y cierre</li>
              <li>Los dueños verán solo horarios dentro de estas franjas</li>
              <li>Los slots se generan automáticamente según duración del servicio</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
