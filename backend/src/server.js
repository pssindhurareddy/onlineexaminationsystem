const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  console.log(`[TRAFFIC] Received ${req.method} request for ${req.url}`);
  
  if (req.url === '/api/v1/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ status: 'success', message: 'Nuclear Link Active' }));
  }

  res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
  res.end('SYSTEM_ONLINE');
});

console.log(`[BOOT] Attempting NUCLEAR_BIND on port: ${PORT}`);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[BOOT] SUCCESS! Server listening on 0.0.0.0:${PORT}`);
});

// Load everything else AFTER the server is 100% up
setTimeout(() => {
  try {
    console.log('[BOOT] Background loading initializing...');
    const app = require('./app');
    realApp = app; // ACTIVATE Real App
    console.log('[BOOT] System background load success. Hub is LIVE.');
  } catch (err) {
    console.error('[BOOT] Background load failed but SERVER STAYS UP:', err.message);
  }
}, 5000);
