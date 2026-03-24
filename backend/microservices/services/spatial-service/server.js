const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const app = require('./app');

const PORT = process.env.SPATIAL_SERVICE_PORT || 5007;

const server = app.listen(PORT, () => {
    console.log(`spatial-service running on port ${PORT}`);
});

server.ref();

