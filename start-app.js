#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

console.log('🚀 Iniciando VetPetPro...\n');

// Determinar si es Windows
const isWindows = os.platform() === 'win32';

// Procesos
const processes = [];

// Iniciar Backend
console.log('📦 Iniciando Backend...');
const backend = spawn('npm', ['run', 'dev:backend'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: isWindows,
});
processes.push(backend);

// Iniciar Frontend
console.log('⚛️  Iniciando Frontend...');
const frontend = spawn('npm', ['run', 'dev:frontend'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: isWindows,
});
processes.push(frontend);

// Esperar a que Frontend esté listo
setTimeout(() => {
  console.log('🖥️  Iniciando Aplicación de Escritorio...');
  const electron = spawn('npm', ['run', 'electron'], {
    stdio: 'inherit',
    shell: isWindows,
  });
  processes.push(electron);
}, 5000);

// Manejar ctrl+c
process.on('SIGINT', () => {
  console.log('\n\n🛑 Cerrando VetPetPro...');
  processes.forEach(proc => {
    if (proc && !proc.killed) {
      proc.kill();
    }
  });
  process.exit(0);
});

// Manejar errores
processes.forEach((proc, index) => {
  proc.on('error', (error) => {
    console.error(`Error en proceso ${index}:`, error);
  });
});
