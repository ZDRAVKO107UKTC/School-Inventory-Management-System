const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('../../src/middleware/errorHandler');

const createServiceApp = ({ serviceName, mountRoutes }) => {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());

    mountRoutes(app);

    app.get('/health', (_req, res) => {
        res.status(200).json({ service: serviceName, status: 'ok' });
    });

    app.use(errorHandler);

    return app;
};

module.exports = { createServiceApp };

