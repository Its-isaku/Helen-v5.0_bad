const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { spawn } = require('child_process');
const { initializeIpcHandlers, cleanupIpcHandlers } = require('./electron/ipc/ipcHandlers');
const alarmService = require('./electron/services/alarmService');

// Store to persist configurations
const store = new Store();

let mainWindow;
const isDev = process.env.NODE_ENV !== 'production';

// EC2 Backend Configuration
const EC2_BACKEND_URL = process.env.VITE_API_URL || 'http://13.58.208.156:5000';

console.log('Using EC2 Backend:', EC2_BACKEND_URL);
console.log('Backend will NOT be started locally - connecting to EC2');

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Enable camera and microphone
      enableWebRTC: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Helen - Sign Language Recognition',
    backgroundColor: '#1a1a1a',
    show: false // Don't show until ready
  });

  // Maximize on startup if that preference was saved
  if (store.get('isMaximized')) {
    mainWindow.maximize();
  }

  // Load the application
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Save maximization state
  mainWindow.on('maximize', () => {
    store.set('isMaximized', true);
  });

  mainWindow.on('unmaximize', () => {
    store.set('isMaximized', false);
  });

  // Clear reference when closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Settings',
          click: () => {
            mainWindow.webContents.send('open-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Normal Zoom' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Full Screen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com/tu-repo/helen/docs');
          }
        },
        { type: 'separator' },
        {
          label: 'About Helen',
          click: () => {
            mainWindow.webContents.send('open-about');
          }
        }
      ]
    }
  ];

  // Add development menu
  if (isDev) {
    template.push({
      label: 'Development',
      submenu: [
        { role: 'toggleDevTools', label: 'DevTools' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// When Electron has finished initializing
app.whenReady().then(() => {
  console.log('Electron ready - connecting to EC2 backend');
  console.log(`Backend URL: ${EC2_BACKEND_URL}`);
  
  // Create window immediately (no need to wait for local backend)
  createWindow();
  createMenu();
  
  // Initialize backend IPC handlers
  initializeIpcHandlers(mainWindow);

  // Initialize alarm service with window reference and start scheduler
  alarmService.initializeWithWindow(mainWindow);
  alarmService.startScheduler();
  console.log('Alarm scheduler started');

  app.on('activate', () => {
    // On macOS, recreate window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Exit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  // Stop alarm scheduler
  alarmService.stopScheduler();
  
  // Cleanup backend handlers
  cleanupIpcHandlers();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});
