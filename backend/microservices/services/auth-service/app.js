const { createServiceApp } = require('../../common/createServiceApp');
const authRoutes = require('../../../src/routes/authRoutes');

const app = createServiceApp({
    serviceName: 'auth-service',
    mountRoutes: (expressApp) => {
        expressApp.use('/api/auth', authRoutes);
    }
});

module.exports = app;
