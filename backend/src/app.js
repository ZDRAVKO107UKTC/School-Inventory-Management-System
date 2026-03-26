const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const { validateEnvironment } = require('./utils/validateEnvironment');
const { mountServiceBoundaries } = require('./serviceBoundaries');

// ============= VALIDATE ENVIRONMENT =============
validateEnvironment();

const app = express();

// ============= CORS CONFIGURATION =============
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ============= HEALTH CHECK =============
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'School Inventory Management System API',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ============= SERVICE BOUNDARIES =============
mountServiceBoundaries(app);

// ============= ERROR HANDLING =============
// Centralized error handling (must be last middleware)
app.use(errorHandler);

module.exports = app;
