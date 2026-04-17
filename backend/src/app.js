require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const app = express();

// NUCLEAR CORS: Manual header injection (Bypasses all library limitations)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Security & Diagnostics
app.use(helmet({
  crossOriginResourcePolicy: false, // Essential for cross-domain images/assets
}));
app.use((req, res, next) => {
  console.log(`[NETWORK DEBUG] ${req.method} ${req.path} from ${req.headers.origin}`);
  next();
});
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Performance
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'ExamPro API is healthy' });
});

// Import Routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));
app.use('/api/v1/exams', require('./routes/exam.routes'));
app.use('/api/v1/student', require('./routes/student.routes'));
app.use('/api/v1/org', require('./routes/org.routes'));

// Global Error Handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
