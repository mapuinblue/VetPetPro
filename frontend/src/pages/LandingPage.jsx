import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section style={{ backgroundColor: '#1e3a8a', color: '#fff', padding: '4rem 0', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ color: '#fff', fontSize: '3rem', marginBottom: '1rem' }}>
            🐕 Bienvenido a VetPetPro
          </h1>
          <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
            Tu solución integral para el agendamiento y gestión de servicios veterinarios caninos
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Registrarse Ahora
            </Link>
            <Link to="/login" className="btn" style={{ 
              padding: '1rem 2rem', 
              fontSize: '1.1rem', 
              backgroundColor: '#fff', 
              color: '#1e3a8a' 
            }}>
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Nuestros Servicios</h2>
          <div className="grid-3">
            {[
              {
                icon: '🏥',
                title: 'Salud Veterinaria',
                description: 'Vacunación, desparasitación, radiologías, ecografías y cirugías'
              },
              {
                icon: '✨',
                title: 'Estética Canina',
                description: 'Peluquería, corte de uñas, limpieza bucal y masajes relajantes'
              },
              {
                icon: '🥗',
                title: 'Nutrición',
                description: 'Asesorías nutricionales y talleres especializados'
              },
              {
                icon: '🏠',
                title: 'Guardería',
                description: 'Pasa día y hotel para tu mascota con cuidado profesional'
              },
              {
                icon: '📋',
                title: 'Historial Clínico',
                description: 'Acceso a toda la información médica de tu mascota'
              },
              {
                icon: '📅',
                title: 'Agendamiento Fácil',
                description: 'Reserva citas con disponibilidad actualizada en tiempo real'
              }
            ].map((service, index) => (
              <div key={index} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ backgroundColor: '#f9fafb', padding: '4rem 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>¿Por qué elegir VetPetPro?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h3>✓ Para Dueños de Mascotas</h3>
              <ul style={{ lineHeight: '2' }}>
                <li>✓ Agendamiento online rápido y sencillo</li>
                <li>✓ Acceso 24/7 al historial clínico</li>
                <li>✓ Recordatorios automáticos de citas</li>
                <li>✓ Múltiples clínicas disponibles</li>
                <li>✓ Gestión de varias mascotas</li>
              </ul>
            </div>
            <div>
              <h3>✓ Para Clínicas Veterinarias</h3>
              <ul style={{ lineHeight: '2' }}>
                <li>✓ Panel administrativo centralizado</li>
                <li>✓ Gestión de citas automática</li>
                <li>✓ Reportes y análisis en tiempo real</li>
                <li>✓ Control de disponibilidad por profesional</li>
                <li>✓ Aumento de clientes potenciales</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ backgroundColor: '#1e3a8a', color: '#fff', padding: '3rem 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>¿Listo para simplificar el cuidado de tu mascota?</h2>
          <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
            Únete a miles de dueños de mascotas que ya usan VetPetPro
          </p>
          <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            Comienza Ahora
          </Link>
        </div>
      </section>
    </div>
  );
}
