import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { db } from '../config/firebase.js';

const router = express.Router();

// Helper: Haversine distance in meters
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => deg * Math.PI / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

// POST /api/guardians/register - create or update guardian profile
router.post('/register', verifyToken, async (req, res) => {
    try {
        const { name, phone, email, location, optIn } = req.body;

        const data = {
            userId: req.userId,
            name: name || '',
            phone: phone || '',
            email: email || '',
            location: location || null,
            optIn: !!optIn,
            updatedAt: new Date().toISOString(),
        };

        await db.collection('guardians').doc(req.userId).set(data, { merge: true });

        res.json({ success: true, guardian: data });
    } catch (error) {
        console.error('Guardian register error:', error);
        console.error('Error details:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to register guardian', details: error.message });
    }
});

// POST /api/guardians/:id/location - update guardian location
router.post('/:id/location', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (id !== req.userId) return res.status(403).json({ error: 'Access denied' });

        const { location } = req.body;
        if (!location || !location.lat || !location.lng) return res.status(400).json({ error: 'Location required' });

        await db.collection('guardians').doc(id).set({ location, updatedAt: new Date().toISOString() }, { merge: true });
        res.json({ success: true });
    } catch (error) {
        console.error('Update guardian location error:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

// GET /api/guardians/nearby?lat=..&lng=..&radius=20000
router.get('/nearby', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radius = parseInt(req.query.radius || '20000', 10); // meters (default 20km)

        if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'lat and lng are required' });

        const snapshot = await db.collection('guardians').where('optIn', '==', true).get();
        const guardians = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.location && data.location.lat && data.location.lng) {
                const d = haversineDistance(lat, lng, data.location.lat, data.location.lng);
                if (d <= radius) {
                    guardians.push({ id: doc.id, distance: Math.round(d), ...data });
                }
            }
        });

        // Sort by distance
        guardians.sort((a,b) => a.distance - b.distance);

        res.json({ success: true, guardians });
    } catch (error) {
        console.error('Nearby guardians error:', error);
        res.status(500).json({ error: 'Failed to find nearby guardians' });
    }
});

// GET /api/guardians/:id/alerts - list guardian alerts
router.get('/:id/alerts', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (id !== req.userId) return res.status(403).json({ error: 'Access denied' });

        const alertsSnapshot = await db.collection('guardians')
            .doc(id)
            .collection('alerts')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const alerts = await Promise.all(alertsSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            let incidentData = null;
            if (data.incidentId) {
                const incidentDoc = await db.collection('incidents').doc(data.incidentId).get();
                if (incidentDoc.exists) {
                    const incident = incidentDoc.data();
                    const respondersCount = Array.isArray(incident.responders) ? incident.responders.length : 0;
                    const respondingCount = typeof incident.respondingCount === 'number'
                        ? incident.respondingCount
                        : (Array.isArray(incident.responders)
                            ? incident.responders.filter(r => r.action === 'accepted').length
                            : 0);
                    incidentData = {
                        id: data.incidentId,
                        userName: incident.userName,
                        location: incident.location,
                        status: incident.status,
                        respondingCount,
                        respondersCount
                    };
                }
            }

            return {
                id: doc.id,
                ...data,
                incident: incidentData
            };
        }));

        res.json({ success: true, alerts });
    } catch (error) {
        console.error('Guardian alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch guardian alerts' });
    }
});

// POST /api/guardians/:id/respond - guardian accepts/responds to an incident (body: incidentId, action)
router.post('/:id/respond', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (id !== req.userId) return res.status(403).json({ error: 'Access denied' });

        const { incidentId, action, alertId } = req.body;
        if (!incidentId) return res.status(400).json({ error: 'incidentId required' });

        const incidentRef = db.collection('incidents').doc(incidentId);
        const incidentDoc = await incidentRef.get();
        if (!incidentDoc.exists) return res.status(404).json({ error: 'Incident not found' });

        const incident = incidentDoc.data();

        const responders = incident.responders || [];
        const existing = responders.find(r => r.guardianId === id);

        const entry = { guardianId: id, action: action || 'accepted', at: new Date().toISOString() };

        if (existing) {
            // update existing responder entry
            const updated = responders.map(r => r.guardianId === id ? { ...r, ...entry } : r);
            const respondingCount = updated.filter(r => r.action === 'accepted').length;
            await incidentRef.update({ responders: updated, respondingCount });
        } else {
            // add new responder
            responders.push(entry);
            const respondingCount = responders.filter(r => r.action === 'accepted').length;
            await incidentRef.update({ responders, respondingCount });
        }

        if (alertId) {
            try {
                await db.collection('guardians').doc(id).collection('alerts').doc(alertId).set({
                    status: action || 'accepted',
                    respondedAt: new Date().toISOString()
                }, { merge: true });
            } catch (alertErr) {
                console.warn('Failed to update guardian alert status:', alertErr?.message || alertErr);
            }
        }

        const latest = (await incidentRef.get()).data().responders || [];
        res.json({ success: true, responders: latest });
    } catch (error) {
        console.error('Respond to alert error:', error);
        res.status(500).json({ error: 'Failed to respond to alert' });
    }
});

export default router;
