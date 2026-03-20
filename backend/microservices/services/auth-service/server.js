const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const app = require('./app');

const PORT = process.env.AUTH_SERVICE_PORT || 5001;

app.listen(PORT, () => {
    console.log(`auth-service running on port ${PORT}`);
});

