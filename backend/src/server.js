const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const db = require('../models');
const { startNotificationReminderJob } = require('./jobs/notificationReminderJob');
const { startBackupJob } = require('./jobs/backupJob');
const { startTokenCleanupJob } = require('./jobs/tokenCleanup');

const PORT = Number(process.env.PORT || process.env.SERVICE_PORT || 5000);
const enableBackgroundJobs = process.env.ENABLE_BACKGROUND_JOBS !== 'false';

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('[combined-backend] database connected successfully');

    if (enableBackgroundJobs) {
      startNotificationReminderJob();
      startBackupJob();
      startTokenCleanupJob();
      console.log('[combined-backend] background jobs enabled');
    } else {
      console.log('[combined-backend] background jobs disabled');
    }

    app.listen(PORT, () => {
      console.log(`[combined-backend] listening on port ${PORT}`);
      console.log(`[combined-backend] environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[combined-backend] failed to start:', error);
    process.exit(1);
  }
}

startServer();
