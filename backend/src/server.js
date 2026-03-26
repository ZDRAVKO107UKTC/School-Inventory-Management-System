const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const db = require('../models');
const { startNotificationReminderJob } = require('./jobs/notificationReminderJob');
const { startBackupJob } = require('./jobs/backupJob');
const { startTokenCleanupJob } = require('./jobs/tokenCleanup');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Authenticate database connection
    await db.sequelize.authenticate();
    console.log('Database connected successfully.');

    // Initialize background jobs
    startNotificationReminderJob();
    startBackupJob();
    startTokenCleanupJob();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Monolithic server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Unable to start the server:', error);
    process.exit(1);
  }
}

startServer();
