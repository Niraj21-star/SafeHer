import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { db } from '../config/firebase.js';

const router = express.Router();

// GET /api/user/profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: req.userId,
                ...userDoc.data()
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// PUT /api/user/profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { name, phone } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        updateData.updatedAt = new Date().toISOString();

        await db.collection('users').doc(req.userId).set(updateData, { merge: true });

        const updatedDoc = await db.collection('users').doc(req.userId).get();

        res.json({
            success: true,
            user: {
                id: req.userId,
                ...updatedDoc.data()
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// POST /api/user/emergency-contacts
router.post('/emergency-contacts', verifyToken, async (req, res) => {
    try {
        const { contacts } = req.body;

        if (!Array.isArray(contacts)) {
            return res.status(400).json({ error: 'Contacts must be an array' });
        }

        if (contacts.length > 5) {
            return res.status(400).json({ error: 'Maximum 5 contacts allowed' });
        }

        // Validate contacts
        for (const contact of contacts) {
            if (!contact.name || !contact.email) {
                return res.status(400).json({ error: 'Each contact must have name and email' });
            }
        }

        await db.collection('users').doc(req.userId).set({
            emergencyContacts: contacts,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        res.json({
            success: true,
            contacts
        });
    } catch (error) {
        console.error('Update contacts error:', error);
        res.status(500).json({ error: 'Failed to update emergency contacts' });
    }
});

export default router;
