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
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!isEmailEnabled()) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  if (host) {
    return nodemailer.createTransport({
      host: host,
      port: port,
      secure: secure,
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined,
      tls: {
        rejectUnauthorized: false
      }
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
  console.log(`[email-service] Attempting to send email to: ${to}`);
  try {
    const info = await getTransporter().sendMail({
      from: getFromAddress(),
      to,
      subject,
      text,
      html
    });

    if (info.message) {
      console.log('[email-service] JSON message payload captured.');
    } else {
      console.log('[email-service] Email sent successfully via SMTP. Message ID:', info.messageId);
    }

    return info;
  } catch (error) {
    console.error('[email-service] Error sending email:', error);
    throw error;
  }
};

module.exports = {
  isEmailEnabled,
  isEmailConfigured,
  getFromAddress,
  getEmailProvider,
  sendEmail
};
