const { createServiceApp } = require('../../common/createServiceApp');
const userRoutes = require('../../../src/routes/userRoutes');

const app = createServiceApp({
    serviceName: 'user-service',
    mountRoutes: (expressApp) => {
        // Change this to '/' to avoid nested prefix issues from gateway forwarding
        expressApp.use('/', userRoutes);
    }
});

module.exports = app;
