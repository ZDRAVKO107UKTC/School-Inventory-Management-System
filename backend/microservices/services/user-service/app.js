const { createServiceApp } = require('../../common/createServiceApp');
const userRoutes = require('../../../src/routes/userRoutes');

const app = createServiceApp({
    serviceName: 'user-service',
    mountRoutes: (expressApp) => {
        expressApp.use('/api/users', userRoutes);
    }
});

module.exports = app;

