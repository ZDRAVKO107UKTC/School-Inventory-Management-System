const pool = require("../config/db");

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // every 1 hour

const deleteExpiredBlacklistedTokens = async () => {
    const query = `
    DELETE FROM token_blacklist
    WHERE expires_at <= NOW()
  `;

    const result = await pool.query(query);
    return result.rowCount || 0;
};

const startTokenCleanupJob = () => {
    const run = async () => {
        try {
            const deletedCount = await deleteExpiredBlacklistedTokens();
            console.log(`[token-cleanup] Removed ${deletedCount} expired token(s)`);
        } catch (error) {
            console.error("[token-cleanup] Cleanup failed:", error.message);
        } finally {
            const timer = setTimeout(run, CLEANUP_INTERVAL_MS);
            timer.unref();
        }
    };

    const initialTimer = setTimeout(run, CLEANUP_INTERVAL_MS);
    initialTimer.unref();
};

module.exports = {
    startTokenCleanupJob,
    deleteExpiredBlacklistedTokens,
};