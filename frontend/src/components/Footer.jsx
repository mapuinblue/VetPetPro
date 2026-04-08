export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ 
      backgroundColor: '#1e3a8a', 
      color: '#fff', 
      padding: '2rem', 
      marginTop: '3rem',
      textAlign: 'center'
    }}>
      <div className="container">
        <p>&copy; {currentYear} VetPetPro - Sistema de Agendamiento Veterinario. Todos los derechos reservados.</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Contacto: info@vetpetpro.com | Teléfono: +57 (1) 555-0123
        </p>
      </div>
    </footer>
  );
}
