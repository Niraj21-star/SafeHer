import { auth } from '../config/firebase.js';

// Verify Firebase ID token middleware
export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const isDemoMode = process.env.DEMO_MODE === 'true';
        const isDevMode = process.env.NODE_ENV !== 'production';
        
        // Demo mode or development bypass: allow developer to set `x-dev-user-id` header to simulate auth
        if (isDemoMode || isDevMode) {
            const devUser = req.headers['x-dev-user-id'] || req.headers['x-dev-user'];
            if (devUser) {
                console.debug('[auth] Demo/Dev bypass active. Setting userId to', devUser);
                req.userId = String(devUser);
                req.user = { uid: String(devUser) };
                return next();
            }
            // If no auth header in demo/dev, fall back to a default user
            if (!authHeader) {
                const fallbackDevUser = process.env.DEV_USER_ID || 'demo-user-001';
                console.debug('[auth] Demo/Dev fallback active. Setting userId to', fallbackDevUser);
                req.userId = String(fallbackDevUser);
                req.user = { uid: String(fallbackDevUser) };
                return next();
            }
        }

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn('[auth] No Authorization header provided');
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        console.debug('[auth] Received token of length', token ? token.length : 0);

        try {
            const decodedToken = await auth.verifyIdToken(token);
            console.debug('[auth] Token verified for uid', decodedToken.uid);
            req.user = decodedToken;
            req.userId = decodedToken.uid;
            next();
        } catch (verifyError) {
            // In demo mode or dev, fall back to a demo user even if token fails
            if (isDemoMode || isDevMode) {
                const fallbackDevUser = process.env.DEV_USER_ID || req.headers['x-dev-user-id'] || 'demo-user-001';
                console.warn('[auth] Token verify failed in demo/dev mode. Falling back to', fallbackDevUser);
                req.userId = String(fallbackDevUser);
                req.user = { uid: String(fallbackDevUser) };
                return next();
            }
            console.error('[auth] Token verification failed:', verifyError && verifyError.message ? verifyError.message : verifyError);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

// Optional auth - doesn't fail if no token, but adds user if present
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];
            try {
                const decodedToken = await auth.verifyIdToken(token);
                req.user = decodedToken;
                req.userId = decodedToken.uid;
            } catch (error) {
                // Token invalid, continue without user
            }
        }
        next();
    } catch (error) {
        next();
    }
};
