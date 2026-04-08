import { db, run, get, all } from './src/config/database.js';
import { hashPassword } from './src/utils/password.js';
import { v4 as uuidv4 } from 'uuid';

const seedDatabase = async () => {
  try {
    console.log('🌱 Iniciando seed de datos...\n');

    // Limpiar datos existentes
    console.log('🧹 Limpiando datos anteriores...');
    await run('DELETE FROM appointments');
    await run('DELETE FROM medical_history');
    await run('DELETE FROM notifications');
    await run('DELETE FROM availability');
    await run('DELETE FROM services');
    await run('DELETE FROM pets');
    await run('DELETE FROM professionals');
    await run('DELETE FROM users');
    await run('DELETE FROM clinics');
    console.log('✓ Datos anteriores eliminados\n');

    // 1. Crear clínicas
    console.log('📋 Creando clínicas...');
    const clinic1Id = uuidv4();
    const clinic2Id = uuidv4();

    await run(
      `INSERT INTO clinics (id, name, email, phone, address, city, state, zipCode, website, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clinic1Id,
        'Clínica Veterinaria Central',
        'info@clinicacentral.com',
        '+57 (1) 555-0001',
        'Carrera 5 #10-50',
        'Bogotá',
        'Cundinamarca',
        '110111',
        'https://clinicacentral.com',
        'Clínica de referencia con 20 años de experiencia'
      ]
    );

    await run(
      `INSERT INTO clinics (id, name, email, phone, address, city, state, zipCode, website, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clinic2Id,
        'Veterinaria Pets Paradise',
        'hello@petsparadise.com',
        '+57 (1) 555-0002',
        'Avenida Caracas #45-30',
        'Bogotá',
        'Cundinamarca',
        '110221',
        'https://petsparadise.com',
        'Especializada en estética y bienestar canino'
      ]
    );

    console.log('✓ 2 clínicas creadas\n');

    // 2. Crear servicios para Clínica 1
    console.log('🏥 Creando servicios de Salud...');
    const salud_servicios = [
      { name: 'Vacunación', duration: 30, price: 50000 },
      { name: 'Desparasitación', duration: 30, price: 40000 },
      { name: 'Radiografía', duration: 45, price: 150000 },
      { name: 'Ecografía', duration: 60, price: 180000 },
      { name: 'Laboratorio Clínico', duration: 30, price: 120000 },
      { name: 'Esterilización', duration: 120, price: 800000 }
    ];

    for (const service of salud_servicios) {
      await run(
        `INSERT INTO services (id, clinicId, name, description, category, duration, price) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), clinic1Id, service.name, `${service.name} profesional`, 'salud', service.duration, service.price]
      );
    }

    console.log(`✓ ${salud_servicios.length} servicios de salud creados\n`);

    // 3. Crear servicios de Estética
    console.log('✨ Creando servicios de Estética...');
    const estetica_servicios = [
      { name: 'Peluquería Completa', duration: 90, price: 120000 },
      { name: 'Baño y Secado', duration: 60, price: 80000 },
      { name: 'Corte de Uñas', duration: 30, price: 30000 },
      { name: 'Limpieza Bucal', duration: 45, price: 150000 },
      { name: 'Masaje Relajante', duration: 60, price: 100000 }
    ];

    for (const service of estetica_servicios) {
      await run(
        `INSERT INTO services (id, clinicId, name, description, category, duration, price) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), clinic2Id, service.name, `${service.name} profesional`, 'estética', service.duration, service.price]
      );
    }

    console.log(`✓ ${estetica_servicios.length} servicios de estética creados\n`);

    // 4. Crear servicios de Nutrición
    console.log('🥗 Creando servicios de Nutrición...');
    const nutricion_servicios = [
      { name: 'Consulta Nutricional', duration: 45, price: 80000 },
      { name: 'Plan Dietético Personalizado', duration: 60, price: 150000 },
      { name: 'Taller de Nutrición', duration: 120, price: 100000 }
    ];

    for (const service of nutricion_servicios) {
      await run(
        `INSERT INTO services (id, clinicId, name, description, category, duration, price) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), clinic1Id, service.name, `${service.name} con especialista`, 'nutrición', service.duration, service.price]
      );
    }

    console.log(`✓ ${nutricion_servicios.length} servicios de nutrición creados\n`);

    // 5. Crear servicios de Guardería
    console.log('🏠 Creando servicios de Guardería...');
    const guardiania_servicios = [
      { name: 'Pasa Día', duration: 480, price: 50000 },
      { name: 'Hotel - Noche', duration: 1440, price: 80000 },
      { name: 'Hotel - Fin de Semana', duration: 2880, price: 200000 }
    ];

    for (const service of guardiania_servicios) {
      await run(
        `INSERT INTO services (id, clinicId, name, description, category, duration, price) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), clinic2Id, service.name, `${service.name} con cuidado profesional`, 'guardería', service.duration, service.price]
      );
    }

    console.log(`✓ ${guardiania_servicios.length} servicios de guardería creados\n`);

    // 6. Crear usuarios de prueba
    console.log('👤 Creando usuarios de prueba...');
    
    const testOwnerId = uuidv4();
    const testOwnerPassword = await hashPassword('password123');
    
    await run(
      `INSERT INTO users (id, email, password, firstName, lastName, phone, role, isActive) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [testOwnerId, 'dueño@example.com', testOwnerPassword, 'Juan', 'Pérez', '+57 3001234567', 'owner', 1]
    );

    const testClinicUserId = uuidv4();
    const testClinicPassword = await hashPassword('password123');
    
    await run(
      `INSERT INTO users (id, email, password, firstName, lastName, phone, role, clinicId, isActive) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [testClinicUserId, 'clinic@example.com', testClinicPassword, 'Dr.', 'García', '+57 3009876543', 'clinic', clinic1Id, 1]
    );

    console.log(`✓ 2 usuarios de prueba creados\n`);

    // 7. Crear mascotas de prueba
    console.log('🐕 Creando mascotas de prueba...');
    
    const pet1Id = uuidv4();
    const pet2Id = uuidv4();

    await run(
      `INSERT INTO pets (id, ownerId, name, species, breed, age, weight, allergies, birthDate) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pet1Id, testOwnerId, 'Max', 'perro', 'Golden Retriever', 3, 32, null, '2023-04-08']
    );

    await run(
      `INSERT INTO pets (id, ownerId, name, species, breed, age, weight, allergies, birthDate) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pet2Id, testOwnerId, 'Luna', 'perro', 'Labrador', 5, 28, 'Proteína de res', '2021-03-15']
    );

    console.log(`✓ 2 mascotas de prueba creadas\n`);

    console.log(`
╔════════════════════════════════════════╗
║  ✅ Seed Completado Exitosamente       ║
╚════════════════════════════════════════╝

📊 Datos Creados:
  • 2 Clínicas
  • 15 Servicios
  • 2 Usuarios de Prueba
  • 2 Mascotas de Prueba

🔑 Credenciales de Prueba:

Dueño de Mascota:
  Email: dueño@example.com
  Password: password123
  Rol: owner

Clínica:
  Email: clinic@example.com
  Password: password123
  Rol: clinic

🚀 El sistema está listo para usar.
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  }
};

seedDatabase();
