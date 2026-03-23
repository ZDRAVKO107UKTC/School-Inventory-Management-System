const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const app = require('./app');

const PORT = process.env.USER_SERVICE_PORT || 5002;

const server = app.listen(PORT, () => {
    console.log(`user-service running on port ${PORT}`);
});

server.ref();
