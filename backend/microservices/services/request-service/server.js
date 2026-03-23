const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const app = require('./app');

const PORT = process.env.REQUEST_SERVICE_PORT || 5005;

const server = app.listen(PORT, () => {
    console.log(`request-service running on port ${PORT}`);
});

server.ref();
