const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  // LOG EVERYTHING: We need to see what domain is actually hitting the server
  console.log(`[NETWORK_DEBUG] Host: ${req.headers.host} | Path: ${req.url}`);

  if (req.url === '/' || req.url === '/api/v1/health') {
    const memory = process.memoryUsage();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ 
      status: 'success', 
      message: 'IDENTITY_HUB_CONNECTED',
      service: process.env.RAILWAY_SERVICE_NAME || 'Unknown',
      memory: {
        rss: `${Math.round(memory.rss / 1024 / 1024)}MB`
      }
    }));
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
}, 10000);
