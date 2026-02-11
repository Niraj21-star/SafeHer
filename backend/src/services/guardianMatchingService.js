/**
 * Guardian Matching Service - Intelligent guardian selection and ranking
 * Improves response quality through smart prioritization
 */

import { db } from '../config/firebase.js';

// Configuration
const MAX_GUARDIANS_TO_NOTIFY = 10; // Notify top N guardians
const MAX_DISTANCE_KM = 20; // Maximum distance to consider guardians
const PRIORITY_DISTANCE_KM = 5; // High priority if within this distance

/**
 * Calculate Haversine distance between two points (in meters)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => deg * (Math.PI / 180);
    const R = 6371000; // Earth radius in meters
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in meters
}

/**
 * Calculate guardian response score based on history
 * Returns score between 0-100
 */
async function calculateResponseScore(guardianId) {
    try {
        // Get guardian's response history
        const alertsSnapshot = await db
            .collection('guardians')
            .doc(guardianId)
            .collection('alerts')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        if (alertsSnapshot.empty) {
            return 50; // Default score for new guardians
        }

        let totalAlerts = 0;
        let respondedAlerts = 0;
        let totalResponseTime = 0;
        let responseTimeCount = 0;

        alertsSnapshot.docs.forEach(doc => {
            const alert = doc.data();
            totalAlerts++;

            if (alert.status === 'accepted' || alert.status === 'responding') {
                respondedAlerts++;

                // Calculate response time if available
                if (alert.respondedAt && alert.createdAt) {
                    const created = new Date(alert.createdAt);
                    const responded = new Date(alert.respondedAt);
                    const responseTime = (responded - created) / (1000 * 60); // minutes
                    
                    totalResponseTime += responseTime;
                    responseTimeCount++;
                }
            }
        });

        // Calculate response rate (0-50 points)
        const responseRate = (respondedAlerts / totalAlerts) * 50;

        // Calculate speed bonus (0-25 points)
        let speedBonus = 0;
        if (responseTimeCount > 0) {
            const avgResponseTime = totalResponseTime / responseTimeCount;
            // Faster response = higher score (under 5 min = 25 pts, 15+ min = 0 pts)
            speedBonus = Math.max(0, 25 - (avgResponseTime / 15 * 25));
        }

        // Reliability bonus (25 points if consistently responsive)
        const reliabilityBonus = respondedAlerts >= 3 ? 25 : (respondedAlerts * 8);

        return Math.min(100, Math.round(responseRate + speedBonus + reliabilityBonus));
    } catch (error) {
        console.error(`Error calculating response score for ${guardianId}:`, error);
        return 50; // Default score on error
    }
}

/**
 * Rank guardians for incident response
 * Returns sorted array of guardians with scoring details
 */
export async function rankGuardiansForIncident(userLocation, userId) {
    const { lat, lng } = userLocation;
    
    // Fetch all opted-in guardians
    const guardiansSnapshot = await db
        .collection('guardians')
        .where('optIn', '==', true)
        .get();

    if (guardiansSnapshot.empty) {
        return [];
    }

    const guardianPromises = guardiansSnapshot.docs.map(async (doc) => {
        const guardian = doc.data();
        const guardianId = doc.id;

        // Skip if guardian has no location
        if (!guardian.location?.lat || !guardian.location?.lng) {
            return null;
        }

        // Calculate distance
        const distance = calculateDistance(
            lat,
            lng,
            guardian.location.lat,
            guardian.location.lng
        );

        // Skip if too far
        const distanceKm = distance / 1000;
        if (distanceKm > MAX_DISTANCE_KM) {
            return null;
        }

        // Calculate distance score (0-40 points, closer = better)
        const maxDist = MAX_DISTANCE_KM * 1000;
        const distanceScore = Math.round(40 * (1 - (distance / maxDist)));

        // Priority boost for very close guardians
        const priorityBonus = distanceKm <= PRIORITY_DISTANCE_KM ? 10 : 0;

        // Get response history score (0-100 points)
        const responseScore = await calculateResponseScore(guardianId);

        // Availability score (0-10 points)
        const availabilityScore = guardian.status === 'active' ? 10 : 5;

        // Calculate total score
        const totalScore = distanceScore + priorityBonus + (responseScore * 0.4) + availabilityScore;

        return {
            guardianId,
            name: guardian.name || 'Guardian',
            distance: Math.round(distance),
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            location: guardian.location,
            phone: guardian.phone || null,
            email: guardian.email || null,
            status: guardian.status || 'active',
            scoring: {
                distance: distanceScore,
                priority: priorityBonus,
                responseHistory: Math.round(responseScore * 0.4),
                availability: availabilityScore,
                total: Math.round(totalScore)
            },
            totalScore: Math.round(totalScore)
        };
    });

    // Wait for all guardian evaluations
    const evaluatedGuardians = (await Promise.all(guardianPromises))
        .filter(g => g !== null);

    // Sort by total score (highest first)
    evaluatedGuardians.sort((a, b) => b.totalScore - a.totalScore);

    // Return top N guardians
    return evaluatedGuardians.slice(0, MAX_GUARDIANS_TO_NOTIFY);
}

/**
 * Get top guardians for notification
 * Simplified version that returns just the essential data
 */
export async function getTopGuardiansForNotification(userLocation, userId, count = 10) {
    const rankedGuardians = await rankGuardiansForIncident(userLocation, userId);
    
    return rankedGuardians.slice(0, count).map(g => ({
        id: g.guardianId,
        name: g.name,
        distance: g.distance,
        distanceKm: g.distanceKm,
        location: g.location,
        phone: g.phone,
        email: g.email,
        score: g.totalScore
    }));
}

/**
 * Track guardian response to incident
 * Updates guardian stats and incident record
 */
export async function trackGuardianResponse(incidentId, guardianId, action, responseTime = null) {
    try {
        const timestamp = new Date().toISOString();

        // Update incident with response
        const incidentRef = db.collection('incidents').doc(incidentId);
        const incidentDoc = await incidentRef.get();

        if (incidentDoc.exists) {
            const responders = incidentDoc.data().responders || [];
            
            responders.push({
                guardianId,
                action, // 'accepted', 'declined', 'ignored'
                timestamp,
                responseTime: responseTime || null
            });

            const respondingCount = responders.filter(r => r.action === 'accepted').length;

            await incidentRef.update({
                responders,
                respondingCount,
                lastResponseAt: timestamp
            });
        }

        // Update guardian alert status
        const guardiansRef = db.collection('guardians').doc(guardianId);
        const alertsSnapshot = await guardiansRef
            .collection('alerts')
            .where('incidentId', '==', incidentId)
            .limit(1)
            .get();

        if (!alertsSnapshot.empty) {
            const alertDoc = alertsSnapshot.docs[0];
            await alertDoc.ref.update({
                status: action,
                respondedAt: timestamp,
                responseTime
            });
        }

        return { success: true, timestamp };
    } catch (error) {
        console.error('Error tracking guardian response:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get guardian availability status
 */
export async function getGuardianAvailability(guardianId) {
    try {
        const guardianDoc = await db.collection('guardians').doc(guardianId).get();
        
        if (!guardianDoc.exists) {
            return { available: false, status: 'not_found' };
        }

        const guardian = guardianDoc.data();
        return {
            available: guardian.optIn === true && guardian.status === 'active',
            status: guardian.status || 'unknown',
            optIn: guardian.optIn || false
        };
    } catch (error) {
        console.error('Error getting guardian availability:', error);
        return { available: false, status: 'error' };
    }
}

/**
 * Update guardian availability
 */
export async function updateGuardianAvailability(guardianId, available) {
    try {
        await db.collection('guardians').doc(guardianId).update({
            status: available ? 'active' : 'unavailable',
            lastStatusUpdate: new Date().toISOString()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating guardian availability:', error);
        return { success: false, error: error.message };
    }
}

export default {
    rankGuardiansForIncident,
    getTopGuardiansForNotification,
    trackGuardianResponse,
    getGuardianAvailability,
    updateGuardianAvailability
};
