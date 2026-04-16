const http = require('http');
const app = require('./app');
const setupSockets = require('./sockets/examSocket');
const { connectRedis } = require('./config/redis');

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

// Initialize Socket.io
setupSockets(server);

console.log(`[BOOT] Attempting bind on port: ${PORT}`);

connectRedis().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[BOOT] Server listening on 0.0.0.0:${PORT}`);
  });
});
