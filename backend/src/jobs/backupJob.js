const cron = require('node-cron');
const requestService = require('../services/requestService');
const equipmentService = require('../services/equipmentService');
const { createBackupSheet } = require('../services/googleSheetsService');

let backupJob = null;

const startBackupJob = () => {
    if (backupJob) return;

    // Run every Sunday at midnight (0 0 * * 0)
    backupJob = cron.schedule('0 0 * * 0', async () => {
        try {
            console.log('[CRON] Starting weekly full system backup to Google Sheets...');
            const adminEmail = process.env.GOOGLE_SHEET_OWNER_EMAIL;
            
            if (!adminEmail) {
                console.warn('[CRON] Skipping backup: GOOGLE_SHEET_OWNER_EMAIL is not set in environment.');
                return;
            }

            const inventoryData = await equipmentService.getAllEquipment({}, false);
            const historyData = await requestService.getHistoryReport({}, false);

            const result = await createBackupSheet(
                adminEmail, 
                Array.isArray(inventoryData) ? inventoryData : (inventoryData.rows || []), 
                Array.isArray(historyData) ? historyData : (historyData.rows || [])
            );

            console.log(`[CRON] Weekly backup created successfully! URL: ${result.url}`);
        } catch (error) {
            console.error('[CRON] Weekly backup failed:', error);
        }
    });

    console.log('[CRON] Backup job scheduled (Every Sunday at 00:00)');
};

const stopBackupJob = () => {
    if (backupJob) {
        backupJob.stop();
        backupJob = null;
    }
};

module.exports = {
    startBackupJob,
    stopBackupJob
};
