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
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal de edición
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [priceDisplay, setPriceDisplay] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    category: 'salud'
  });

  const CATEGORIES = [
    { value: 'salud', label: '🏥 Salud' },
    { value: 'estética', label: '✨ Estética' },
    { value: 'nutrición', label: '🥗 Nutrición' },
    { value: 'guardería', label: '🏠 Guardería' },
    { value: 'funeraria', label: '🪦 Funeraria' }
  ];

  // Funciones para formato de pesos colombianos
  const formatCOP = (value) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseCOP = (value) => {
    return value.replace(/\./g, '');
  };  

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

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        duration: service.duration,
        price: service.price,
        category: service.category || 'salud'
      });
      setPriceDisplay(formatCOP(service.price));
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        duration: 30,
        price: 0,
        category: 'salud'
      });
      setPriceDisplay('');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData({ name: '', description: '', duration: 30, price: 0, category: 'salud' });
    setPriceDisplay('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveService = async () => {
    if (!formData.name) {
      setError('El nombre del servicio es requerido');
      return;
    }

    if (!formData.price || formData.price <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }

    if (!formData.category) {
      setError('Debes seleccionar una categoría');
      return;
    }

    if (!formData.duration || formData.duration < 15) {
      setError('La duración debe ser al menos 15 minutos');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        duration: parseInt(formData.duration),
        price: parseInt(formData.price)
      };

      if (editingService) {
        // Actualizar servicio
        await serviceAPI.updateService(editingService.id, serviceData);
        setSuccess('✅ Servicio actualizado');
      } else {
        // Crear nuevo servicio
        await serviceAPI.createService(serviceData);
        setSuccess('✅ Servicio creado');
      }

      handleCloseModal();
      fetchServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Error al guardar servicio';
      setError(errorMsg);
      console.error('Error guardando servicio:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;

    try {
      setError('');
      await serviceAPI.deleteService(serviceId);
      setSuccess('✅ Servicio eliminado');
      fetchServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar servicio');
      console.error(err);
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Servicios de tu Clínica</h2>
            <button
              className="btn btn-primary"
              onClick={() => handleOpenModal()}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              ➕ Nuevo Servicio
            </button>
          </div>

          {loading ? (
            <p>Cargando servicios...</p>
          ) : services.length === 0 ? (
            <div className="alert alert-info">
              No hay servicios. Crea uno haciendo click en "Nuevo Servicio".
            </div>
          ) : (
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
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 0.5fr',
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
                      $ {formatCOP(service.price)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#d1fae5',
                      color: '#047857',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      ✓ Activo
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                      onClick={() => handleOpenModal(service)}
                    >
                      ✏️
                    </button>
                    <button
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                      onClick={() => handleDeleteService(service.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Edición */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginTop: 0 }}>
              {editingService ? '✏️ Editar Servicio' : '➕ Nuevo Servicio'}
            </h2>

            <div className="form-group">
              <label>Nombre del Servicio</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: Vacunación"
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Ej: Vacunación completa contra principales enfermedades"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '1rem',
                  fontFamily: 'inherit'
                }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Duración (minutos)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  min="15"
                  step="15"
                />
              </div>

              <div className="form-group">
                <label>Precio ($ COP)</label>
                <input
                  type="text"
                  value={priceDisplay}
                  onChange={(e) => {
                    const formatted = formatCOP(parseCOP(e.target.value));
                    setPriceDisplay(formatted);
                    const numericValue = parseInt(parseCOP(formatted)) || 0;
                    handleInputChange('price', numericValue);
                  }}
                  placeholder="Ej: 1.000.000"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleSaveService}
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleCloseModal}
                disabled={loading}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
            </div>
          </div>
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
