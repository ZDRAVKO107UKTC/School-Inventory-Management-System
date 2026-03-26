const { createServiceApp } = require('../../common/createServiceApp');
const equipmentRoutes = require('../../../src/routes/equipmentRoutes');

const app = createServiceApp({
    serviceName: 'equipment-service',
    mountRoutes: (expressApp) => {
        expressApp.use('/', equipmentRoutes);
    }
});

module.exports = app;
