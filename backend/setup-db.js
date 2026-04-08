import { db } from './src/config/database.js';

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabla de usuarios
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'owner',
          clinicId TEXT,
          isActive BOOLEAN DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabla de clínicas
      db.run(`
        CREATE TABLE IF NOT EXISTS clinics (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT NOT NULL,
          address TEXT NOT NULL,
          city TEXT NOT NULL,
          state TEXT NOT NULL,
          zipCode TEXT,
          website TEXT,
          logo TEXT,
          description TEXT,
          isActive BOOLEAN DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabla de mascotas
      db.run(`
        CREATE TABLE IF NOT EXISTS pets (
          id TEXT PRIMARY KEY,
          ownerId TEXT NOT NULL,
          name TEXT NOT NULL,
          species TEXT NOT NULL DEFAULT 'perro',
          breed TEXT NOT NULL,
          age REAL,
          weight REAL,
          allergies TEXT,
          photo TEXT,
          microchipNumber TEXT,
          birthDate DATE,
          isActive BOOLEAN DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ownerId) REFERENCES users(id)
        )
      `);

      // Tabla de servicios
      db.run(`
        CREATE TABLE IF NOT EXISTS services (
          id TEXT PRIMARY KEY,
          clinicId TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          duration INTEGER NOT NULL,
          price REAL NOT NULL,
          isActive BOOLEAN DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (clinicId) REFERENCES clinics(id)
        )
      `);

      // Tabla de profesionales
      db.run(`
        CREATE TABLE IF NOT EXISTS professionals (
          id TEXT PRIMARY KEY,
          clinicId TEXT NOT NULL,
          userId TEXT NOT NULL,
          specialization TEXT,
          licenseNumber TEXT,
          isActive BOOLEAN DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (clinicId) REFERENCES clinics(id),
          FOREIGN KEY (userId) REFERENCES users(id)
        )
      `);

      // Tabla de disponibilidad
      db.run(`
        CREATE TABLE IF NOT EXISTS availability (
          id TEXT PRIMARY KEY,
          clinicId TEXT NOT NULL,
          dayOfWeek INTEGER NOT NULL,
          startTime TEXT NOT NULL,
          endTime TEXT NOT NULL,
          isActive BOOLEAN DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (clinicId) REFERENCES clinics(id)
        )
      `);

      // Tabla de citas
      db.run(`
        CREATE TABLE IF NOT EXISTS appointments (
          id TEXT PRIMARY KEY,
          clinicId TEXT NOT NULL,
          petId TEXT NOT NULL,
          serviceId TEXT NOT NULL,
          professionalId TEXT,
          ownerId TEXT NOT NULL,
          appointmentDate DATE NOT NULL,
          appointmentTime TEXT DEFAULT '09:00',
          status TEXT DEFAULT 'programada',
          notes TEXT,
          cancelReason TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (clinicId) REFERENCES clinics(id),
          FOREIGN KEY (petId) REFERENCES pets(id),
          FOREIGN KEY (serviceId) REFERENCES services(id),
          FOREIGN KEY (professionalId) REFERENCES professionals(id),
          FOREIGN KEY (ownerId) REFERENCES users(id)
        )
      `);

      // Tabla de historial clínico
      db.run(`
        CREATE TABLE IF NOT EXISTS medical_history (
          id TEXT PRIMARY KEY,
          petId TEXT NOT NULL,
          appointmentId TEXT,
          description TEXT NOT NULL,
          observations TEXT,
          diagnosis TEXT,
          treatment TEXT,
          nextVisitDate DATE,
          recordedBy TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (petId) REFERENCES pets(id),
          FOREIGN KEY (appointmentId) REFERENCES appointments(id)
        )
      `);

      // Tabla de notificaciones
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          appointmentId TEXT,
          isRead BOOLEAN DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id),
          FOREIGN KEY (appointmentId) REFERENCES appointments(id)
        )
      `);

      // Tabla de email logs
      db.run(`
        CREATE TABLE IF NOT EXISTS email_logs (
          id TEXT PRIMARY KEY,
          to_email TEXT NOT NULL,
          subject TEXT NOT NULL,
          type TEXT,
          status TEXT DEFAULT 'PENDING',
          sentAt DATETIME,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

initializeDatabase()
  .then(() => {
    console.log('✓ Database initialized successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('✗ Database initialization error:', err);
    process.exit(1);
  });
