const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Импорт на маршрутите
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const requestRoutes = require('./routes/requestRoutes');
const reportRoutes = require('./routes/reportRoutes'); // ТОВА ЛИПСВАШЕ

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Дефиниране на API маршрутите
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reports', reportRoutes); // Ред 22 - вече работи

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