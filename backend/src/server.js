import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { logDemoModeStatus } from './services/demoService.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import sosRoutes from './routes/sos.js';
import incidentRoutes from './routes/incidents.js';
import legalRoutes from './routes/legal.js';
import guardiansRoutes from './routes/guardians.js';
import geocodeRoutes from './routes/geocode.js';
import dangerZonesRoutes from './routes/dangerZones.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS: allow the configured FRONTEND_URL or allow all dev origins when not in production
const frontendUrl = process.env.FRONTEND_URL;
if (process.env.NODE_ENV === 'production') {
    app.use(cors({ origin: frontendUrl, credentials: true }));
} else {
    // In development, reflect the request origin to allow Vite on different ports
    app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
}
app.use(express.json());

// Rate limiting - relaxed for development
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests in dev, 100 in prod
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// SOS specific rate limiter (stricter in production only)
const sosLimiter = process.env.NODE_ENV === 'production'
    ? rateLimit({
        windowMs: 10 * 1000, // 10 seconds
        max: 1, // 1 request per 10 seconds
        message: { error: 'Please wait before triggering another SOS.' }
    })
    : (req, res, next) => next();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/sos', sosLimiter, sosRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/guardians', guardiansRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/danger-zones', dangerZonesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'SafeHer API'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'SafeHer API'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 SafeHer API running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    logDemoModeStatus();
});

export default app;
