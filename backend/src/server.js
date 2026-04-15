const http = require('http');

// THE ABSOLUTE TRUTH: Use the specific port from your Railway Screenshot
const PORT = 4988; 

const server = http.createServer((req, res) => {
  // LOG EVERY SINGLE HIT: This will show up in your Railway 'Logs' tab
  console.log(`[TRAFFIC] Received ${req.method} for ${req.url}`);

  if (req.url === '/' || req.url === '/api/v1/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ status: 'success', message: 'IDENTITY_HUB_ONLINE', target_port: PORT }));
  }

  if (realApp) return realApp(req, res);
  
  res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ status: 'starting', message: 'System warming up...' }));
});

// Bind port UNCONDITIONALLY
server.listen(PORT, () => {
  console.log(`[BOOT] IDENTITY_HUB SUCCESS! Listening on Port ${PORT}`);
});

server.on('error', (err) => {
  console.error('[CRITICAL] Port Binding Failed:', err);
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
