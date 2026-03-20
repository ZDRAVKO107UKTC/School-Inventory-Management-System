const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const app = require('./app');

const PORT = process.env.REPORT_SERVICE_PORT || 5006;

app.listen(PORT, () => {
    console.log(`report-service running on port ${PORT}`);
});

