import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { db } from '../config/firebase.js';
import { sendEmergencyEmail } from '../services/emailService.js';
import { sendEmergencySMS } from '../services/smsService.js';
import { isDemoMode, generateDemoGuardians } from '../services/demoService.js';
import { getTopGuardiansForNotification } from '../services/guardianMatchingService.js';
import { generateEvidenceHash } from '../services/evidenceService.js';

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

const router = express.Router();

// POST /api/sos/trigger
router.post('/trigger', verifyToken, async (req, res) => {
    try {
        const { location, deviceInfo } = req.body;

        if (!location || !location.lat || !location.lng) {
            return res.status(400).json({ error: 'Location is required' });
        }

        // Get user data
        const userDoc = await db.collection('users').doc(req.userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const emergencyContacts = userData.emergencyContacts || [];

        if (emergencyContacts.length === 0) {
            return res.status(400).json({
                error: 'No emergency contacts configured. Please add contacts first.'
            });
        }

        // Prevent duplicate SOS if an active incident already exists
        const activeSnapshot = await db.collection('incidents')
            .where('userId', '==', req.userId)
            .where('status', '==', 'active')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

        if (!activeSnapshot.empty) {
            const activeDoc = activeSnapshot.docs[0];
            const activeIncident = activeDoc.data();
            return res.status(409).json({
                error: 'An active SOS is already in progress.',
                incidentId: activeDoc.id,
                trackingUrl: activeIncident.trackingUrl
            });
        }

        // Create incident record with evidence tracking
        const timestamp = new Date();
        const incidentData = {
            userId: req.userId,
            userName: userData.name || 'User',
            userPhone: userData.phone || '',
            timestamp,
            location: {
                lat: location.lat,
                lng: location.lng,
                address: location.address || '',
                accuracy: location.accuracy || 'unknown',
                mapsLink: `https://www.google.com/maps?q=${location.lat},${location.lng}`
            },
            status: 'active',
            alertsSent: [],
            deviceInfo: deviceInfo || 'Unknown device',
            publicTracking: true,
            responders: [],
            respondingCount: 0,
            escalationActions: [],
            policeEscalated: false,
            recoveryCompleted: false
        };

        const incidentRef = await db.collection('incidents').add(incidentData);
        const incidentId = incidentRef.id;

        // Generate evidence hash for integrity verification
        const evidenceHash = generateEvidenceHash(incidentId, timestamp.toISOString(), location);
        await incidentRef.update({ evidenceHash });

        // Send email alerts to all emergency contacts
        const alertResults = [];

        for (const contact of emergencyContacts) {
            // Send email if email available
            if (contact.email) {
                try {
                    await sendEmergencyEmail({
                        to: contact.email,
                        recipientName: contact.name,
                        userName: userData.name,
                        userPhone: userData.phone,
                        location: incidentData.location,
                        timestamp: new Date().toISOString(),
                    });

                    alertResults.push({
                        type: 'email',
                        recipient: contact.email,
                        recipientName: contact.name,
                        status: 'sent',
                        timestamp: new Date().toISOString()
                    });
                } catch (emailError) {
                    console.error(`Failed to send email to ${contact.email}:`, emailError);
                    alertResults.push({
                        type: 'email',
                        recipient: contact.email,
                        recipientName: contact.name,
                        status: 'failed',
                        error: emailError.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // Send SMS if phone available
            if (contact.phone) {
                try {
                    const smsBody = `EMERGENCY: ${userData.name} triggered an SOS. Location: ${incidentData.location.mapsLink}`;
                    await sendEmergencySMS({ to: contact.phone, body: smsBody });
                    alertResults.push({
                        type: 'sms',
                        recipient: contact.phone,
                        recipientName: contact.name,
                        status: 'sent',
                        timestamp: new Date().toISOString()
                    });
                } catch (smsError) {
                    console.error(`Failed to send SMS to ${contact.phone}:`, smsError);
                    alertResults.push({
                        type: 'sms',
                        recipient: contact.phone,
                        recipientName: contact.name,
                        status: 'failed',
                        error: smsError.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }

        // Intelligent Guardian Matching - Notify nearby guardians
        let guardiansNotified = [];
        try {
            // In demo mode, generate mock guardian responses
            if (isDemoMode()) {
                guardiansNotified = generateDemoGuardians(2);
                await incidentRef.update({ 
                    guardiansNotified, 
                    respondingCount: 1 // One guardian responding in demo
                });
            } else {
                // Use intelligent guardian matching
                const topGuardians = await getTopGuardiansForNotification(location, req.userId, 10);

                console.log(`🎯 Intelligent matching found ${topGuardians.length} suitable guardians`);

                for (const guardian of topGuardians) {
                    // Create guardian alert document
                    const guardianAlertsRef = db.collection('guardians').doc(guardian.id).collection('alerts');
                    const alertDocRef = await guardianAlertsRef.add({
                        incidentId,
                        incidentUserId: req.userId,
                        location: incidentData.location,
                        status: 'notified',
                        createdAt: new Date().toISOString(),
                        matchScore: guardian.score,
                        distance: guardian.distance
                    });

                    try {
                        // Send email notification
                        if (guardian.email) {
                            await sendEmergencyEmail({
                                to: guardian.email,
                                recipientName: guardian.name,
                                userName: userData.name,
                                userPhone: userData.phone,
                                location: incidentData.location,
                                timestamp: new Date().toISOString(),
                            });
                        }

                        // Send SMS notification
                        if (guardian.phone) {
                            const smsBody = `Nearby SOS: ${userData.name} needs help. Location: ${incidentData.location.mapsLink}`;
                            await sendEmergencySMS({ to: guardian.phone, body: smsBody });
                        }

                        guardiansNotified.push({ 
                            id: guardian.id, 
                            name: guardian.name, 
                            distance: guardian.distance,
                            distanceKm: guardian.distanceKm,
                            matchScore: guardian.score,
                            alertId: alertDocRef.id,
                            status: 'notified',
                            timestamp: new Date().toISOString()
                        });
                    } catch (e) {
                        console.warn(`Failed to notify guardian ${guardian.id}:`, e.message);
                    }
                }

                if (guardiansNotified.length > 0) {
                    await incidentRef.update({ 
                        guardiansNotified, 
                        respondingCount: 0,
                        guardianMatchingUsed: true
                    });
                }
            }
        } catch (e) {
            console.error('Guardian notify error:', e);
        }

        // Generate tracking URL
        const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/track?incident=${incidentId}`;
        await incidentRef.update({ trackingUrl });

        res.json({
            success: true,
            incidentId,
            alertsSent: alertResults,
            guardiansNotified,
            trackingUrl,
            evidenceHash,
            message: `SOS triggered! Alerts sent to ${alertResults.filter(a => a.status === 'sent').length} contacts.${guardiansNotified.length > 0 ? ` ${guardiansNotified.length} nearby guardians notified.` : ''}`
        });

    } catch (error) {
        console.error('SOS trigger error:', error);
        res.status(500).json({ error: 'Failed to trigger SOS' });
    }
});

export default router;
