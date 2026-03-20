const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const app = require('./app');

const PORT = process.env.ADMIN_SERVICE_PORT || 5003;

app.listen(PORT, () => {
    console.log(`admin-service running on port ${PORT}`);
});

