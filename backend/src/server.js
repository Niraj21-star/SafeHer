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

// ===== CORS Configuration (MUST be first!) =====
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://safe-her-topaz.vercel.app',
            'http://localhost:5173',
            'http://localhost:3000'
        ];
        
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'SafeHer API',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Legacy health check (for backwards compatibility)
app.get('/health', (req, res) => {
    res.redirect(301, '/api/health');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
    
    // CORS error
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            error: 'CORS policy: Origin not allowed',
            origin: req.headers.origin
        });
    }
    
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 ==========================================');
    console.log(`🚀 SafeHer API running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ CORS enabled for: https://safe-her-topaz.vercel.app`);
    console.log('🚀 ==========================================');
    logDemoModeStatus();
});

export default app;
