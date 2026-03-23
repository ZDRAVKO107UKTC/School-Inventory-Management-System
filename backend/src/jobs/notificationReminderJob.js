'use strict';

const { processNotificationCycle } = require('../services/notificationService');

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000;

const getReminderInterval = () => {
  const parsed = Number.parseInt(process.env.REMINDER_JOB_INTERVAL_MS || `${DEFAULT_INTERVAL_MS}`, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INTERVAL_MS;
};

const startNotificationReminderJob = () => {
  const run = async () => {
    try {
      const result = await processNotificationCycle();
      console.log('[notification-reminder-job] cycle completed', JSON.stringify({
        overdueDetected: result.overdue.detected,
        overdueSent: result.overdue.deliveries.sent,
        lowStockDetected: result.lowStock.detected,
        lowStockSent: result.lowStock.deliveries.sent
      }));
    } catch (error) {
      console.error('[notification-reminder-job] cycle failed:', error.message);
    } finally {
      const timer = setTimeout(run, getReminderInterval());
      timer.unref();
    }
  };

  const initialTimer = setTimeout(run, getReminderInterval());
  initialTimer.unref();
};

module.exports = {
  startNotificationReminderJob
};
