const http = require('http');

// UNCONDITIONAL BOOT: No functions, no delays, just bind and listen.
const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  console.log(`[NETWORK_DEBUG] Host: ${req.headers.host} | Path: ${req.url}`);

  if (req.url === '/' || req.url === '/api/v1/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ 
      status: 'success', 
      message: 'IDENTITY_HUB_CONNECTED',
      memory: process.memoryUsage().rss
    }));
  }

  res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
  res.end('IDENTITY_GATEWAY_ACTIVE');
});

// Force bind immediately at top-level
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[BOOT] Server is now globally reachable on port ${PORT}`);
});
