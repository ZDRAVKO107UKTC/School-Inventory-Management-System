const { createServiceApp } = require('../../common/createServiceApp');
const reportRoutes = require('../../../src/routes/reportRoutes');

const app = createServiceApp({
    serviceName: 'report-service',
    mountRoutes: (expressApp) => {
        expressApp.use('/api/reports', reportRoutes);
    }
});

module.exports = app;

