const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Импорт на маршрутите
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const requestRoutes = require('./routes/requestRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const spatialRoutes = require('./routes/spatialRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Дефиниране на API маршрутите
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/equipment', equipmentRoutes);
app.use('/request', requestRoutes);
app.use('/reports', reportRoutes);
app.use('/users', userRoutes);
app.use('/spatial', spatialRoutes);

// Базов маршрут за проверка
app.get('/', (req, res) => {
    res.send('School Inventory Management System API is running...');
});

// Error handling middleware (по избор, но силно препоръчително)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;