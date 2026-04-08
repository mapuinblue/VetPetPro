import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { petAPI } from '../../services/api';

export default function MyPets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    allergies: '',
    birthDate: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const response = await petAPI.getPets();
      setPets(response.data);
    } catch (err) {
      setError('Error al cargar mascotas');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await petAPI.createPet(formData);
      setSuccess('Mascota registrada exitosamente');
      setFormData({ name: '', breed: '', age: '', weight: '', allergies: '', birthDate: '' });
      setShowForm(false);
      fetchPets();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar mascota');
    }
  };

  if (loading) return <div className="container mt-3">Cargando...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Mis Mascotas</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Mascota'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>Registrar Nueva Mascota</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Raza</label>
                <input type="text" name="breed" value={formData.breed} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Edad (años)</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} step="0.1" />
              </div>
              <div className="form-group">
                <label>Peso (kg)</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleChange} step="0.1" />
              </div>
            </div>
            <div className="form-group">
              <label>Alergias</label>
              <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} placeholder="Ej: Proteína de res" />
            </div>
            <div className="form-group">
              <label>Fecha de Nacimiento</label>
              <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-success">Registrar Mascota</button>
          </form>
        </div>
      )}

      {pets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>No tienes mascotas registradas</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Registra tu primer mascota</button>
        </div>
      ) : (
        <div className="grid-3">
          {pets.map((pet) => (
            <div key={pet.id} className="card">
              <h3>🐕 {pet.name}</h3>
              <p><strong>Raza:</strong> {pet.breed}</p>
              {pet.age && <p><strong>Edad:</strong> {pet.age} años</p>}
              {pet.weight && <p><strong>Peso:</strong> {pet.weight} kg</p>}
              {pet.allergies && <p><strong>Alergias:</strong> {pet.allergies}</p>}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to={`/pet/${pet.id}/medical-history`} className="btn btn-primary btn-sm">Historial</Link>
                <button className="btn btn-secondary btn-sm">Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
