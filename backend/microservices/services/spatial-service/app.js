const { createServiceApp } = require('../../common/createServiceApp');
const spatialRoutes = require('../../../src/routes/spatialRoutes');

const app = createServiceApp({
    serviceName: 'spatial-service',
    mountRoutes: (expressApp) => {
        expressApp.use('/', spatialRoutes);
    }
});

module.exports = app;

