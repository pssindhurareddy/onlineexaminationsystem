const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' }
});

module.exports = { apiLimiter, loginLimiter };
