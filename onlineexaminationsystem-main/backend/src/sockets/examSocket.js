const { Server } = require('socket.io');
const AuthService = require('../services/authService');

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  const examMonitor = io.of('/exam-monitor');

  examMonitor.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) throw new Error('Auth error');
      const decoded = await AuthService.verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication Error'));
    }
  });

  examMonitor.on('connection', (socket) => {
    console.log(`[SOCKET] User connected to monitor: ${socket.user.id}`);

    socket.on('join_exam', ({ attemptId }) => {
      socket.join(`exam_${attemptId}`);
      console.log(`[SOCKET] User ${socket.user.id} joined exam attempt ${attemptId}`);
    });

    socket.on('tab_switch', (data) => {
      // Broad cast to proctor/admin rooms
      examMonitor.to('proctors').emit('alert_tab_switch', {
        userId: socket.user.id,
        attemptId: data.attemptId,
        timestamp: new Date()
      });
    });
    
    socket.on('join_proctor', () => {
      if(socket.user.role === 'admin' || socket.user.role === 'faculty') {
        socket.join('proctors');
        console.log(`[SOCKET] Proctor ${socket.user.id} joined alerts room`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] User disconnected: ${socket.user.id}`);
    });
  });

  return io;
};
