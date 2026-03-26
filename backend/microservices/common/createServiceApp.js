const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet'); // New
const errorHandler = require('../../src/middleware/errorHandler');

const createServiceApp = ({serviceName, mountRoutes}) => {
    const app = express();

    app.use(helmet()); // Protects against common web vulnerabilities
    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());
    if (mountRoutes) {
        mountRoutes(app);
    }

    app.get('/health', (_req, res) => {
        res.status(200).json({service: serviceName, status: 'ok'});
    });

    app.use(errorHandler);

    return app;
};

module.exports = {createServiceApp};