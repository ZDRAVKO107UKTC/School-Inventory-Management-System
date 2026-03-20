const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const app = require('./app');

const PORT = process.env.EQUIPMENT_SERVICE_PORT || 5004;

app.listen(PORT, () => {
    console.log(`equipment-service running on port ${PORT}`);
});

