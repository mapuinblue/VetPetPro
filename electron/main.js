const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

// Crear ventana principal
const createWindow = () => {
  const iconPath = path.join(__dirname, '../assets/icon.png');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  // En desarrollo, Vite corre en puerto 3001 (frontend) con proxy a 3100 (backend)
  // start-app.js ya inicia backend+frontend+electron, así que no rehacemos el backend aquí
  const startUrl = isDev
    ? 'http://localhost:3001'
    : `file://${path.join(__dirname, '../frontend/dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Abrir DevTools en desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Iniciar backend en desarrollo - COMENTADO porque start-app.js ya lo inicia
// const startBackend = () => {
//   if (isDev) {
//     const backendPath = path.join(__dirname, '../backend');
//     backendProcess = spawn('npm', ['run', 'dev:backend'], {
//       cwd: backendPath,
//       stdio: 'inherit',
//     });

//     backendProcess.on('error', (error) => {
//       console.error('Error al iniciar backend:', error);
//     });
//   }
// };

// Limpiar procesos al cerrar app
const cleanupProcesses = () => {
  // start-app.js maneja la limpieza de procesos
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
  }
};

// App events
app.on('ready', () => {
  // Backend ya inició desde start-app.js
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  // Terminar backend
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Crear menú
const createMenu = () => {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Salir',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edición',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'Vista',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de VetPetPro',
          click: () => {
            // Podría abrir un diálogo de info
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// Manejar IPC events si es necesario
ipcMain.handle('get-version', () => {
  return app.getVersion();
});
