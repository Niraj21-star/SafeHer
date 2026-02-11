import express from 'express';
import { verifyToken, optionalAuth } from '../middleware/auth.js';
import { db } from '../config/firebase.js';
import { buildEvidenceRecord, generateIncidentTimeline, generateIncidentSummaryText } from '../services/evidenceService.js';

const router = express.Router();

// GET /api/incidents/:userId
router.get('/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Verify user is accessing their own incidents
        if (userId !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const snapshot = await db.collection('incidents')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();

        const incidents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
        }));

        res.json({ incidents });
    } catch (error) {
        console.error('Get incidents error:', error);
        res.status(500).json({ error: 'Failed to get incidents' });
    }
});

// GET /api/incidents/track/:incidentId - Public tracking endpoint
router.get('/track/:incidentId', optionalAuth, async (req, res) => {
    try {
        const { incidentId } = req.params;

        const incidentDoc = await db.collection('incidents').doc(incidentId).get();

        if (!incidentDoc.exists) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        const incident = incidentDoc.data();

        const respondersCount = Array.isArray(incident.responders) ? incident.responders.length : 0;
        const respondingCount = typeof incident.respondingCount === 'number'
            ? incident.respondingCount
            : (Array.isArray(incident.responders)
                ? incident.responders.filter(r => r.action === 'accepted').length
                : 0);

        // Return limited data for public tracking
        res.json({
            id: incidentId,
            userName: incident.userName,
            location: incident.location,
            status: incident.status,
            timestamp: incident.timestamp?.toDate?.() || incident.timestamp,
            resolvedAt: incident.resolvedAt,
            trackingUrl: incident.trackingUrl,
            respondingCount,
            respondersCount,
            guardiansNotifiedCount: Array.isArray(incident.guardiansNotified) ? incident.guardiansNotified.length : 0
        });
    } catch (error) {
        console.error('Track incident error:', error);
        res.status(500).json({ error: 'Failed to track incident' });
    }
});

// POST /api/incidents/:incidentId/resolve
router.post('/:incidentId/resolve', verifyToken, async (req, res) => {
    try {
        const { incidentId } = req.params;

        const incidentRef = db.collection('incidents').doc(incidentId);
        const incidentDoc = await incidentRef.get();

        if (!incidentDoc.exists) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        const incident = incidentDoc.data();

        // Verify user owns this incident
        if (incident.userId !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const resolvedAt = new Date().toISOString();

        await incidentRef.update({
            status: 'resolved',
            resolvedAt,
            shouldShowRecovery: true // Flag to trigger recovery mode UI
        });

        res.json({
            success: true,
            resolvedAt,
            showRecovery: true,
            message: 'Incident marked as resolved'
        });
    } catch (error) {
        console.error('Resolve incident error:', error);
        res.status(500).json({ error: 'Failed to resolve incident' });
    }
});

// POST /api/incidents/:incidentId/recovery - Complete recovery mode
router.post('/:incidentId/recovery', verifyToken, async (req, res) => {
    try {
        const { incidentId } = req.params;

        const incidentRef = db.collection('incidents').doc(incidentId);
        const incidentDoc = await incidentRef.get();

        if (!incidentDoc.exists) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        const incident = incidentDoc.data();

        if (incident.userId !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await incidentRef.update({
            recoveryCompleted: true,
            recoveryCompletedAt: new Date().toISOString(),
            shouldShowRecovery: false
        });

        res.json({
            success: true,
            message: 'Recovery mode completed'
        });
    } catch (error) {
        console.error('Complete recovery error:', error);
        res.status(500).json({ error: 'Failed to complete recovery' });
    }
});

// GET /api/incidents/:incidentId/evidence - Get evidence record
router.get('/:incidentId/evidence', verifyToken, async (req, res) => {
    try {
        const { incidentId } = req.params;

        const incidentDoc = await db.collection('incidents').doc(incidentId).get();

        if (!incidentDoc.exists) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        const incident = incidentDoc.data();

        if (incident.userId !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Build evidence record
        const evidenceRecord = buildEvidenceRecord(incident, incidentId);
        const timeline = generateIncidentTimeline(incident, incidentId);

        res.json({
            evidence: evidenceRecord,
            timeline
        });
    } catch (error) {
        console.error('Get evidence error:', error);
        res.status(500).json({ error: 'Failed to get evidence' });
    }
});

// GET /api/incidents/:incidentId/evidence/download - Download evidence report
router.get('/:incidentId/evidence/download', verifyToken, async (req, res) => {
    try {
        const { incidentId } = req.params;

        const incidentDoc = await db.collection('incidents').doc(incidentId).get();

        if (!incidentDoc.exists) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        const incident = incidentDoc.data();

        if (incident.userId !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Generate evidence report
        const evidenceRecord = buildEvidenceRecord(incident, incidentId);
        const timeline = generateIncidentTimeline(incident, incidentId);
        const reportText = generateIncidentSummaryText(evidenceRecord, timeline);

        // Send as downloadable text file
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="SafeHer_Incident_${incidentId}.txt"`);
        res.send(reportText);
    } catch (error) {
        console.error('Download evidence error:', error);
        res.status(500).json({ error: 'Failed to download evidence' });
    }
});

// POST /api/incidents/:incidentId/location - Update live location
router.post('/:incidentId/location', verifyToken, async (req, res) => {
    try {
        const { incidentId } = req.params;
        const { location } = req.body;

        if (!location || !location.lat || !location.lng) {
            return res.status(400).json({ error: 'Location is required' });
        }

        const incidentRef = db.collection('incidents').doc(incidentId);
        const incidentDoc = await incidentRef.get();

        if (!incidentDoc.exists) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        const incident = incidentDoc.data();

        if (incident.userId !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (incident.status !== 'active') {
            return res.status(400).json({ error: 'Incident is not active' });
        }

        await incidentRef.update({
            location: {
                ...incident.location,
                lat: location.lat,
                lng: location.lng,
                address: location.address || incident.location.address,
                accuracy: location.accuracy || incident.location.accuracy,
                mapsLink: `https://www.google.com/maps?q=${location.lat},${location.lng}`,
                lastUpdate: new Date().toISOString()
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

export default router;
