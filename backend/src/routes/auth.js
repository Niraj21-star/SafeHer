import express from 'express';

const router = express.Router();

// POST /api/auth/register
// Note: Registration is handled client-side with Firebase Auth
// This endpoint is for any additional server-side registration logic
router.post('/register', async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email || !name) {
            return res.status(400).json({ error: 'Email and name are required' });
        }

        // Registration is primarily handled by Firebase Auth on client
        // This endpoint can be used for additional server-side setup if needed
        res.json({
            success: true,
            message: 'Registration data received'
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
// Note: Login is handled client-side with Firebase Auth
router.post('/login', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Login is primarily handled by Firebase Auth on client
        res.json({
            success: true,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

export default router;
