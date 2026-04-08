import { db } from './src/config/database.js';

const migrateDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Agregar columna appointmentTime si no existe
      db.run(`
        ALTER TABLE appointments 
        ADD COLUMN appointmentTime TEXT DEFAULT '09:00'
      `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('Note: appointmentTime column might already exist');
        }
      });

      resolve();
    });
  });
};

migrateDatabase()
  .then(() => {
    console.log('✅ Database migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
