const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const { mountServiceBoundaries } = require('./serviceBoundaries');

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

mountServiceBoundaries(app);

app.get('/', (req, res) => {
    res.send('School Inventory Management System API is running...');
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
