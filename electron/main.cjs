const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let backendProcess = null;

function startBackend() {
  try {
    const appPath = app.getAppPath();
    const serverPath = path.join(appPath, 'server', 'server-node.cjs');
    const isWin = process.platform === 'win32';
    
    console.log(`[Backend] Starting Node.js backend from: ${serverPath}`);
    
    // 使用Node.js启动后端
    backendProcess = spawn(isWin ? 'node.exe' : 'node', [serverPath], {
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        PORT: '3002'
      },
      cwd: appPath,
      stdio: 'inherit',
      windowsHide: true,
    });
    
    // Handle process exit/error
    backendProcess.on('error', (err) => {
      console.error(`[Backend] Process error: ${err.message}`);
      backendProcess = null;
    });
    
    backendProcess.on('exit', (code, signal) => {
      console.log(`[Backend] Process exited with code ${code}, signal ${signal}`);
      backendProcess = null;
    });
    
    console.log('[Backend] Started successfully with Node.js');
  } catch (e) {
    console.error('Failed to start backend:', e.message);
  }
}

function setupApiRedirect() {
  try {
    const filter = { urls: ['file://*/*'] };
    session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
      const url = details.url || '';
      if (url.startsWith('file://') && url.includes('/api/')) {
        const apiIndex = url.indexOf('/api/');
        const tail = url.slice(apiIndex + 1); // remove leading /
        const redirectURL = `http://localhost:3002/${tail}`;
        return callback({ redirectURL });
      }
      return callback({});
    });
  } catch (e) {
    console.error('Failed to setup API redirect:', e);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
    show: false,
    icon: path.join(__dirname, '../public/favicon.ico')
  });

  const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
  win.loadFile(indexPath).catch(err => console.error('Failed to load index.html:', err));
  win.once('ready-to-show', () => win.show());
}

function checkBackendReady(maxAttempts = 50) {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const tryConnect = () => {
      const net = require('net');
      const socket = new net.Socket();
      
      socket.setTimeout(300);
      socket.on('connect', () => {
        socket.destroy();
        console.log(`[Backend Check] Connected successfully on attempt ${attempts + 1}`);
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(tryConnect, 100);
        } else {
          console.warn('[Backend Check] Max attempts reached, continuing anyway...');
          resolve(false);
        }
      });
      
      socket.connect(3002, 'localhost');
    };
    
    tryConnect();
  });
}

app.whenReady().then(async () => {
  console.log('[App] whenReady event triggered');
  console.log('[App] App path:', app.getAppPath());
  console.log('[App] Resources path:', process.resourcesPath);
  
  setupApiRedirect();
  console.log('[App] API redirect setup complete');
  
  startBackend();
  console.log('[App] Backend startup initiated');
  
  // Wait for backend to be ready before showing window
  const backendReady = await checkBackendReady();
  console.log(`[App] Backend ready: ${backendReady}`);
  
  // Add extra delay for safety
  await new Promise(resolve => setTimeout(resolve, 500));
  
  createWindow();
  console.log('[App] Window created');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess && !backendProcess.killed) {
    try {
      backendProcess.kill('SIGTERM');
    } catch {}
  }
});
