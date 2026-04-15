const http = require('http');
const app = require('./app');
const initSocket = require('./sockets/examSocket');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Boot sequence
const startServer = async () => {
  // Start listening IMMEDIATELY to satisfy Railway health checks
  server.listen(PORT, () => {
    console.log(`[SERVER] ExamPro API binds to port ${PORT} - initializing services...`);
  });

  try {
    // Then connect services in background
    await connectDB();
    console.log('[DB] Core connected');
    await connectRedis();
    console.log('[REDIS] Cache connected');
  } catch (error) {
    console.error('[SERVER] Service initialization failed:', error);
    // Note: We don't exit(1) anymore, to allow Railway to keep the container up so we can check logs
  }
};

startServer();
