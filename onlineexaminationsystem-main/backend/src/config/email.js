const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'test_user',
    pass: process.env.SMTP_PASS || 'test_pass',
  },
  tls: {
    rejectUnauthorized: false // Helps with self-signed certificates in some institutional environments
  }
});

const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Institutional Identity Engine" <${process.env.SMTP_FROM || 'noreply@exampro.edu'}>`,
      to,
      subject,
      html
    });
    console.log('[IIS-MAIL] Authorization Packet Dispatched: %s', info.messageId);
    if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
      console.log('[IIS-DEBUG] Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return true;
  } catch (error) {
    console.error('[IIS-MAIL] Critical Subsystem Failure:', error);
    return false;
  }
};

module.exports = { sendMail };
