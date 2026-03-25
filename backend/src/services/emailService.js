'use strict';

const nodemailer = require('nodemailer');

let transporter;

const isEmailEnabled = () => process.env.EMAIL_ENABLED !== 'false';

const getFromAddress = () => process.env.EMAIL_FROM || 'no-reply@school-inventory.local';

const getEmailProvider = () => (isEmailEnabled() ? 'nodemailer' : 'json');

const isEmailConfigured = () => {
  if (!isEmailEnabled()) {
    return true;
  }

  return Boolean(process.env.SMTP_HOST);
};

const createTransporter = () => {
  if (!isEmailEnabled()) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined
    });
  }

  return nodemailer.createTransport({ jsonTransport: true });
};

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const info = await getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html
  });

  if (info.message) {
    console.log('[email-service] message payload:', info.message.toString());
  }

  return info;
};

module.exports = {
  isEmailEnabled,
  isEmailConfigured,
  getFromAddress,
  getEmailProvider,
  sendEmail
};
