const { createServiceApp } = require('../../common/createServiceApp');
const adminRoutes = require('../../../src/routes/adminRoutes');

const app = createServiceApp({
    serviceName: 'admin-service',
    mountRoutes: (expressApp) => {
        expressApp.use('/api/admin', adminRoutes);
    }
});

module.exports = app;

