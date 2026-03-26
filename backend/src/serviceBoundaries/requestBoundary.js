const requestRoutes = require('../routes/requestRoutes');

module.exports = {
  name: 'request-service',
  description: 'Borrowing workflow, approvals, returns, and request history.',
  owns: ['requests'],
  dependsOn: ['auth-service', 'equipment-service'],
  routes: [
    {
      mounts: ['/request', '/requests', '/api/request', '/api/requests', '/manager'],
      router: requestRoutes
    }
  ]
};
