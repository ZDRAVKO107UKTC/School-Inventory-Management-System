const { createServiceApp } = require('../../common/createServiceApp');
const requestRoutes = require('../../../src/routes/requestRoutes');

const app = createServiceApp({
    serviceName: 'request-service',
    mountRoutes: (expressApp) => {
        expressApp.use('/', requestRoutes);
    }
});

module.exports = app;

