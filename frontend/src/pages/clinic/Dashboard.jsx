export default function ClinicDashboard() {
  return (
    <div className="container mt-3">
      <h1>Panel de Control de Clínica</h1>
      <div className="grid-3">
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>📅 Citas Hoy</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>12</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>💰 Ingresos</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>$2,450</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>📊 Servicios</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>28</p>
        </div>
      </div>
    </div>
  );
}
