const http = require('http');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 5000;

// Survivor Startup: Create the server with a lazy-loading logic
let realApp = null;

const server = http.createServer((req, res) => {
  // FAST LOG: Log every single request to see if traffic is even reaching the app
  console.log(`[TRAFFIC] ${req.method} ${req.url} - Current Status: ${realApp ? 'READY' : 'STARTING'}`);
  
  if (req.url === '/api/v1/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ status: 'success', message: 'Survivor node active' }));
  }
  
  if (realApp) {
    return realApp(req, res);
  }
  
  res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ status: 'starting', message: 'Identity Hub linking in progress...' }));
});

const startServer = async () => {
  // 1. Bind port INSTANTLY and GLOBALLY (0.0.0.0 is critical for Railway)
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[BOOT] Global responder active on 0.0.0.0:${PORT}`);
  });

  process.on('uncaughtException', (err) => {
    console.error('[STABILITY] Caught unhandled exception:', err);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[STABILITY] Unhandled Rejection at:', promise, 'reason:', reason);
  });

  try {
    // 2. Load heavy models/app in background
    console.log('[BOOT] Initializing models...');
    const app = require('./app');
    const initSocket = require('./sockets/examSocket');
    
    // 3. Connect Database
    await connectDB();
    
    // 4. Link Socket.io
    initSocket(server);
    
    // 5. Activate real app
    realApp = app;
    console.log('[BOOT] Full Identity Hub linked successfully');
  } catch (error) {
    console.error('[CRITICAL] Identity Hub failed to initialize:', error);
  }
};

startServer();
