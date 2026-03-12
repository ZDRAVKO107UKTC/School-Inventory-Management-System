require("dotenv").config({ path: __dirname + "/.env" });

const app = require("./src/app.js");
const pool = require("./src/config/db.js");
const { startTokenCleanupJob } = require("./src/jobs/tokenCleanup");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await pool.query("SELECT NOW()");
        console.log("PostgreSQL connected");

        startTokenCleanupJob();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();