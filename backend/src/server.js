const http = require('http');

// THE SMOKING GUN: Match the Railway Dashboard Port (4988)
const PORT = process.env.PORT || 4988;

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/api/v1/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ status: 'success', message: 'IDENTITY_HUB_CONNECTED', port: PORT }));
  }

  // Handle all other traffic through the real app
  if (realApp) return realApp(req, res);
  
  res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ status: 'starting', message: 'Identity Hub waking up on 4988...' }));
});

// Bind port immediately
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[BOOT] SUCCESS! Server listening on GLOBAL PORT ${PORT}`);
});

// Load everything else AFTER the server is 100% up
setTimeout(async () => {
  try {
    console.log(`[BOOT] Loading core system onto port ${PORT}...`);
    const { connectDB } = require('./config/database');
    const app = require('./app');
    const initSocket = require('./sockets/examSocket');
    
    await connectDB();
    initSocket(server);
    realApp = app; 
    console.log('[BOOT] Full Identity Hub ACTIVATED on Port 4988.');
  } catch (err) {
    console.error('[BOOT] Background load failed:', err.message);
  }
}, 3000);
