import { useState, useEffect } from 'react';
import { clinicAPI, serviceAPI } from '../../services/api';

export default function ServicesCatalog() {
  const [clinics, setClinics] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClinics = async () => {
      try {
        const response = await clinicAPI.getClinics();
        setClinics(response.data);
        if (response.data.length > 0) {
          setSelectedClinic(response.data[0].id);
        }
      } catch (err) {
        console.error('Error loading clinics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadClinics();
  }, []);

  useEffect(() => {
    if (selectedClinic) {
      loadServices();
    }
  }, [selectedClinic, selectedCategory]);

  const loadServices = async () => {
    try {
      const response = await serviceAPI.getServicesByCategory(selectedClinic, selectedCategory);
      setServices(response.data);
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  if (loading) return <div className="container mt-3">Cargando...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1>Catálogo de Servicios</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div className="form-group">
          <label>Selecciona una Clínica</label>
          <select value={selectedClinic} onChange={(e) => setSelectedClinic(e.target.value)}>
            <option value="">-- Seleccionar --</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Categoría de Servicio</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">Todas las categorías</option>
            <option value="salud">Salud Preventiva/Correctiva</option>
            <option value="estética">Estética</option>
            <option value="nutrición">Nutrición</option>
            <option value="guardería">Guardería</option>
            <option value="funeraria">Funeraria</option>
          </select>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>No hay servicios disponibles en esta clínica</p>
        </div>
      ) : (
        <div className="grid-3">
          {services.map((service) => (
            <div key={service.id} className="card">
              <h3>{service.name}</h3>
              <p><strong>Categoría:</strong> {service.category}</p>
              <p>{service.description || 'Sin descripción'}</p>
              <p><strong>Duración:</strong> {service.duration} minutos</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#16a34a' }}>
                ${service.price.toFixed(2)}
              </p>
              <button className="btn btn-primary" style={{ width: '100%' }}>
                Agendar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
