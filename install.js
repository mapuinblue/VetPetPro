#!/usr/bin/env node

/**
 * 🐕 VetPetPro - Quick Installation Script
 * Este script configura e instala el proyecto automáticamente
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
╔════════════════════════════════════════╗
║  🐕 VetPetPro Installation Script      ║
╚════════════════════════════════════════╝
`);

try {
  // Paso 1: Instalar dependencias
  console.log('📦 Instalando dependencias...');
  execSync('npm install', { stdio: 'inherit' });

  // Paso 2: Setup de base de datos
  console.log('\n🗄️  Inicializando base de datos...');
  execSync('npm run setup-db --workspace backend', { stdio: 'inherit' });

  console.log(`
╔════════════════════════════════════════╗
║  ✅ Instalación Completada             ║
╚════════════════════════════════════════╝

📝 Próximos Pasos:

1️⃣  TERMINAL 1 - Iniciar Backend:
   npm run dev:backend

2️⃣  TERMINAL 2 - Iniciar Frontend:
   npm run dev:frontend

3️⃣  Abrir en navegador:
   http://localhost:3001

📚 Documentación:
   Revisa README.md para más información

🔑 Credenciales de Prueba:
   - Crea una nueva cuenta o usa:
   - Email: test@example.com
   - Password: (la que registres)

🎯 Puntos de Acceso:
   Backend:  http://localhost:3000
   Frontend: http://localhost:3001
  `);

} catch (error) {
  console.error('\n❌ Error durante la instalación:', error.message);
  process.exit(1);
}
