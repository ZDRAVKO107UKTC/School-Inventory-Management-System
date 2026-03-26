require("dotenv").config({ path: __dirname + "/.env" });

const app = require("./src/app.js");
const db = require("./models");
const { startTokenCleanupJob } = require("./src/jobs/tokenCleanup");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Test database connection using Sequelize
        await db.sequelize.authenticate();
        console.log("PostgreSQL connected via Sequelize");

        // Sync models (in development only - use migrations in production)
        if (process.env.NODE_ENV !== 'production') {
            await db.sequelize.sync({ alter: false });
            console.log("Database models synchronized");
        }

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