require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
// const errorHandler = require('./middleware/errorHandler');

const app = express();

// ABSOLUTE TOP: CORS must handle pre-flights before any other logic
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security & Diagnostics
app.use(helmet());
app.use((req, res, next) => {
  console.log(`[CORS DEBUG] Request from Origin: ${req.headers.origin} Path: ${req.path}`);
  next();
});
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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
