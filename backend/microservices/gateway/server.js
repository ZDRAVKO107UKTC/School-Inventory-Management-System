const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../../.env')});

const express = require('express');
const {createProxyMiddleware} = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 300 : 5000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !isProduction,
    message: {message: "Too many requests, please try again later."}
});

const loginLimiter = rateLimit({
const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {message: "Too many sign-in attempts. Please wait 10 minutes and try again."}
    message: {message: "Too many login attempts. Please wait 10 minutes."}
});

const services = {
    auth: process.env.AUTH_SERVICE_URL || `http://127.0.0.1:${process.env.AUTH_SERVICE_PORT || 5001}`,
    user: process.env.USER_SERVICE_URL || `http://127.0.0.1:${process.env.USER_SERVICE_PORT || 5002}`,
    admin: process.env.ADMIN_SERVICE_URL || `http://127.0.0.1:${process.env.ADMIN_SERVICE_PORT || 5003}`,
    equipment: process.env.EQUIPMENT_SERVICE_URL || `http://127.0.0.1:${process.env.EQUIPMENT_SERVICE_PORT || 5004}`,
    request: process.env.REQUEST_SERVICE_URL || `http://127.0.0.1:${process.env.REQUEST_SERVICE_PORT || 5005}`,
    report: process.env.REPORT_SERVICE_URL || `http://127.0.0.1:${process.env.REPORT_SERVICE_PORT || 5006}`,
    spatial: process.env.SPATIAL_SERVICE_URL || `http://127.0.0.1:${process.env.SPATIAL_SERVICE_PORT || 5007}`
};

const proxy = (target, forwardedPrefix) => createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => {
        return `${forwardedPrefix}${path}`;
    }
    pathRewrite: {[`^${prefixToRemove}`]: ''}
});

app.get('/health', (_req, res) => {
    res.status(200).json({
        service: 'api-gateway',
        status: 'ok',
        routes: {
            '/api/auth': services.auth,
            '/api/users': services.user,
            '/api/admin': services.admin,
            '/api/equipment': services.equipment,
            '/api/request': services.request,
            '/api/requests': services.request,
            '/api/reports': services.report,
            '/api/spatial': services.spatial
        }
    });
});

app.use('/api/auth/login', loginLimiter, proxy(services.auth, '/api/auth/login'));
app.post('/api/auth/login', authLimiter, proxy(services.auth, '/api/auth'));
app.use('/api/auth', generalLimiter, proxy(services.auth, '/api/auth'));
app.use('/api/users', generalLimiter, proxy(services.user, '/api/users'));
app.use('/api/admin', generalLimiter, proxy(services.admin, '/api/admin'));
app.use('/api/equipment', generalLimiter, proxy(services.equipment, '/api/equipment'));
app.use('/api/request', generalLimiter, proxy(services.request, '/api/request'));
app.use('/api/requests', generalLimiter, proxy(services.request, '/api/requests'));
app.use('/api/reports', generalLimiter, proxy(services.report, '/api/reports'));
app.use('/api/spatial', generalLimiter, proxy(services.spatial, '/api/spatial'));


app.get('/', (_req, res) => {
    res.send('School Inventory API Gateway is running.');
});

const PORT = process.env.API_GATEWAY_PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`api-gateway running on port ${PORT}`);
});

server.ref();
