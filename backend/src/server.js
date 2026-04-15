const http = require('http');

// SURVIVOR ZERO: No dependencies allowed at the top level
const PORT = process.env.PORT || 5000;
let realApp = null;

const server = http.createServer((req, res) => {
  if (req.url === '/api/v1/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ status: 'success', message: 'Survivor Zero Active' }));
  }
  
  if (realApp) return realApp(req, res);
  
  res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ status: 'booting', message: 'Identity Hub reaching critical mass...' }));
});

const startServer = async () => {
  console.log(`[SURVIVOR] Attempting to bind port ${PORT}...`);
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SURVIVOR] Port ${PORT} bound successfully at 0.0.0.0. Status: ONLINE.`);
  });

  try {
    // ONLY AFTER BINDING: Load the rest of the system
    console.log('[SURVIVOR] Loading system dependencies...');
    const { connectDB } = require('./config/database');
    const app = require('./app');
    const initSocket = require('./sockets/examSocket');
    
    await connectDB();
    initSocket(server);
    realApp = app;
    console.log('[SURVIVOR] Identity Hub fully operational.');
  } catch (error) {
    console.error('[SURVIVOR] Background load failed, but port stays open:', error.message);
  }
};

startServer();
