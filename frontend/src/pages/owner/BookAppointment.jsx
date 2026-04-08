import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { petAPI, serviceAPI, appointmentAPI, availabilityAPI, clinicAPI } from '../../services/api';

export default function BookAppointment() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: select pet, 2: select clinic & service, 3: select date & time
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [slots, setSlots] = useState([]);

  const [formData, setFormData] = useState({
    petId: '',
    clinicId: '',
    serviceId: '',
    appointmentDate: '',
    appointmentTime: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar mascotas y clínicas al montar
  useEffect(() => {
    if (!user?.id) return;
    fetchInitialData();
  }, [user?.id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [petsRes, clinicsRes] = await Promise.all([
        petAPI.getPets(),
        clinicAPI.getClinics()
      ]);
      setPets(petsRes.data || []);
      setClinics(clinicsRes.data || []);
    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar servicios disponibles cuando se selecciona clínica
  const handleClinicSelect = async (clinicId) => {
    try {
      const response = await serviceAPI.getServicesbyClinic(clinicId);
      setServices(response.data || []);
    } catch (err) {
      console.error('Error loading services:', err);
      setServices([]);
    }
  };

  // Cargar slots disponibles cuando se selecciona fecha
  const handleDateSelect = async (date) => {
    if (!formData.clinicId || !formData.serviceId) {
      setError('Selecciona clínica y servicio primero');
      return;
    }

    try {
      const response = await availabilityAPI.getAvailableSlots({
        clinicId: formData.clinicId,
        serviceId: formData.serviceId,
        date
      });
      setSlots(response.data?.slots || []);
    } catch (err) {
      console.error('Error loading slots:', err);
      setSlots([]);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.petId || !formData.clinicId || !formData.serviceId || 
          !formData.appointmentDate || !formData.appointmentTime) {
        setError('Completa todos los campos');
        return;
      }

      setLoading(true);
      await appointmentAPI.createAppointment({
        petId: formData.petId,
        clinicId: formData.clinicId,
        serviceId: formData.serviceId,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime
      });

      setSuccess('✅ Cita agendada exitosamente');
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agendar cita');
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 1) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <div className="container" style={{ maxWidth: '600px', padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '2rem' }}>📅 Agendar Cita</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* STEP 1: Select Pet */}
      {step === 1 && (
        <div>
          <div className="form-group">
            <label>Selecciona tu Mascota</label>
            <select
              value={formData.petId}
              onChange={(e) => setFormData({ ...formData, petId: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            >
              <option value="">-- Elige una mascota --</option>
              {pets.map(pet => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.breed})
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setStep(2)}
            disabled={!formData.petId}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* STEP 2: Select Clinic & Service */}
      {step === 2 && (
        <div>
          <div className="form-group">
            <label>Selecciona la Clínica</label>
            <select
              value={formData.clinicId}
              onChange={(e) => {
                const clinicId = e.target.value;
                setFormData({ ...formData, clinicId, serviceId: '' });
                setError('');
                if (clinicId) handleClinicSelect(clinicId);
              }}
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            >
              <option value="">-- Elige una clínica --</option>
              {clinics.map(clinic => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name} - {clinic.city}
                </option>
              ))}
            </select>
          </div>

          {services.length > 0 && (
            <div className="form-group">
              <label>Selecciona el Servicio</label>
              <select
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
              >
                <option value="">-- Elige un servicio --</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} - ${service.price} ({service.duration}min)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setStep(1)}
              style={{ flex: 1 }}
            >
              ← Atrás
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setStep(3)}
              disabled={!formData.serviceId}
              style={{ flex: 1 }}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Select Date & Time */}
      {step === 3 && (
        <div>
          <div className="form-group">
            <label>Selecciona la Fecha</label>
            <input
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => {
                setFormData({ ...formData, appointmentDate: e.target.value });
                handleDateSelect(e.target.value);
              }}
              min={new Date().toISOString().split('T')[0]}
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            />
          </div>

          {slots.length > 0 && (
            <div className="form-group">
              <label>Horarios Disponibles</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '0.5rem'
              }}>
                {slots.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => setFormData({ ...formData, appointmentTime: slot.time })}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '4px',
                      border: '2px solid #e5e7eb',
                      backgroundColor: formData.appointmentTime === slot.time ? '#3b82f6' : '#fff',
                      color: formData.appointmentTime === slot.time ? '#fff' : '#000',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {slots.length === 0 && formData.appointmentDate && (
            <div className="alert alert-warning">
              ⚠️ No hay horarios disponibles para esta fecha
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setStep(2)}
              style={{ flex: 1 }}
            >
              ← Atrás
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!formData.appointmentTime || loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Agendando...' : 'Agendar Cita ✓'}
            </button>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      <div style={{
        marginTop: '2rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        {[1, 2, 3].map(s => (
          <div
            key={s}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: step >= s ? '#3b82f6' : '#e5e7eb'
            }}
          />
        ))}
      </div>
    </div>
  );
}
