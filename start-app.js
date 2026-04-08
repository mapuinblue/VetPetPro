#!/usr/bin/env node
const { spawn } = require('child_process');
const http = require('http');
const os = require('os');

const isWindows = os.platform() === 'win32';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);

// Configuración
const CONFIG = {
  backendPort: 3100,
  frontendPort: 3001,  // Vite intentará este primero
  backendUrl: 'http://localhost:3100/api/health',
  frontendUrl: 'http://localhost:3001',
  maxWaitTime: 60000,   // 60 segundos máximo espera
  checkInterval: 1000   // Revisar cada segundo
};

let processes = [];
let backendReady = false;
let frontendReady = false;

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function checkPort(host, port) {
  return new Promise((resolve) => {
    const req = http.request({ host, port, path: '/', method: 'HEAD', timeout: 2000 }, 
      () => resolve(true)
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

async function waitForService(name, url, port, maxAttempts = 30) {
  log(`⏳ Esperando ${name} en ${url}...`, 'yellow');
  
  for (let i = 0; i < maxAttempts; i++) {
    const isUp = await checkPort('localhost', port);
    if (isUp) {
      log(`✅ ${name} listo en ${url}`, 'green');
      return true;
    }
    await new Promise(r => setTimeout(r, CONFIG.checkInterval));
    process.stdout.write('.');
  }
  
  log(`\n❌ ${name} no respondió después de ${maxAttempts} intentos`, 'red');
  return false;
}

function killAllProcesses() {
  log('\n🛑 Cerrando todos los procesos...', 'yellow');
  processes.forEach(proc => {
    if (proc && !proc.killed) {
      if (isWindows) {
        spawn('taskkill', ['/pid', proc.pid, '/f', '/t'], { detached: true });
      } else {
        proc.kill('SIGTERM');
      }
    }
  });
  setTimeout(() => process.exit(0), 1000);
}

// ============================================
// INICIO DE SERVICIOS
// ============================================

async function startBackend() {
  log('📦 Iniciando Backend...', 'blue');
  
  return new Promise((resolve, reject) => {
    const backend = spawn('npm', ['run', 'dev:backend'], {
      cwd: __dirname,
      stdio: 'pipe',  // Capturar output para detectar errores
      shell: true,
      detached: false,
    });

    let output = '';
    
    backend.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(`${colors.cyan}[BACKEND]${colors.reset} ${data}`);
      
      // Detectar si cambió de puerto automáticamente
      if (output.includes('trying another one') || output.includes('Port')) {
        log('⚠️  Backend cambió de puerto automáticamente', 'yellow');
      }
    });

    backend.stderr.on('data', (data) => {
      const msg = data.toString();
      process.stderr.write(`${colors.red}[BACKEND-ERROR]${colors.reset} ${msg}`);
      
      // Detectar error de puerto ocupado
      if (msg.includes('EADDRINUSE') || msg.includes('address already in use')) {
        log(`\n❌ ERROR: Puerto ${CONFIG.backendPort} ya está ocupado`, 'red');
        log('👉 Solución: Mata el proceso anterior o cambia el puerto en .env', 'yellow');
        reject(new Error('Puerto ocupado'));
      }
    });

    backend.on('error', (err) => reject(err));
    backend.on('exit', (code) => {
      if (code !== 0 && !backendReady) {
        reject(new Error(`Backend salió con código ${code}`));
      }
    });

    processes.push(backend);
    
    // Esperar a que realmente responda
    waitForService('Backend', CONFIG.backendUrl, CONFIG.backendPort, 30)
      .then(resolve)
      .catch(reject);
  });
}

async function startFrontend() {
  log('⚛️  Iniciando Frontend...', 'cyan');
  
  return new Promise((resolve, reject) => {
    const frontend = spawn('npm', ['run', 'dev:frontend'], {
      cwd: __dirname,
      stdio: 'pipe',
      shell: true,
      detached: false,
    });

    let detectedPort = CONFIG.frontendPort;
    
    frontend.stdout.on('data', (data) => {
      const msg = data.toString();
      process.stdout.write(`${colors.cyan}[FRONTEND]${colors.reset} ${msg}`);
      
      // Detectar puerto real donde Vite arrancó
      const portMatch = msg.match(/Local:\s+http:\/\/localhost:(\d+)/);
      if (portMatch) {
        detectedPort = parseInt(portMatch[1]);
        log(`🌐 Vite corriendo en puerto ${detectedPort}`, 'green');
      }
    });

    frontend.stderr.on('data', (data) => {
      process.stderr.write(`${colors.yellow}[FRONTEND-WARN]${colors.reset} ${data}`);
    });

    frontend.on('error', (err) => reject(err));
    frontend.on('exit', (code) => {
      if (code !== 0 && !frontendReady) {
        reject(new Error(`Frontend salió con código ${code}`));
      }
    });

    processes.push(frontend);
    
    // Esperar al puerto detectado o el default
    waitForService('Frontend', `http://localhost:${detectedPort}`, detectedPort, 30)
      .then(() => { frontendReady = true; resolve(detectedPort); })
      .catch(reject);
  });
}

function startElectron(frontendPort) {
  log('🖥️  Iniciando Aplicación de Escritorio...', 'blue');
  
  // Verificar una última vez que todo funciona
  if (!backendReady || !frontendReady) {
    log('❌ No se puede iniciar Electron: servicios no listos', 'red');
    killAllProcesses();
    return;
  }

  const electron = spawn('npm', ['run', 'electron'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, FRONTEND_URL: `http://localhost:${frontendPort}` }
  });

  processes.push(electron);
  
  electron.on('exit', (code) => {
    log(`\n👋 Electron cerrado (código ${code})`, 'yellow');
    killAllProcesses();
  });
}

// ============================================
// EJECUCIÓN PRINCIPAL
// ============================================

async function main() {
  log('🚀 Iniciando VetPetPro...\n', 'green');

  try {
    // 1. Iniciar backend y esperar a que esté listo
    await startBackend();
    backendReady = true;
    
    // 2. Iniciar frontend y esperar a que esté listo
    const actualFrontendPort = await startFrontend();
    
    // 3. Solo entonces iniciar Electron
    startElectron(actualFrontendPort);
    
  } catch (error) {
    log(`\n💥 Error fatal: ${error.message}`, 'red');
    killAllProcesses();
    process.exit(1);
  }
}

// Manejar señales de terminación
process.on('SIGINT', killAllProcesses);
process.on('SIGTERM', killAllProcesses);
process.on('uncaughtException', (err) => {
  log(`\n💥 Error no capturado: ${err.message}`, 'red');
  killAllProcesses();
});

main();