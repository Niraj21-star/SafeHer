// Danger Zones Routes
// Handles API endpoints for community-reported danger zones

import express from 'express';
import rateLimit from 'express-rate-limit';
import {
    createDangerZoneReport,
    getDangerZones,
    getAllDangerZones,
    generateMockDangerZones
} from '../services/dangerZoneService.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting for danger zone reports (1 report per minute per user)
const reportLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === 'production' ? 1 : 10, // Allow more in dev
    message: { error: 'Too many reports. Please wait before submitting another report.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use userId if authenticated, otherwise IP
        return req.user?.userId || req.ip;
    }
});


router.post('/report', verifyToken, reportLimiter, async (req, res) => {
    try {
        const { lat, lng, category, description } = req.body;
        const userId = req.user?.userId;
        
        // Validate required fields
        if (!lat || !lng || !category) {
            return res.status(400).json({
                error: 'Missing required fields: lat, lng, category'
            });
        }
        
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return res.status(400).json({
                error: 'Invalid coordinates. Lat and lng must be numbers.'
            });
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                error: 'Invalid coordinates. Lat must be -90 to 90, lng must be -180 to 180.'
            });
        }
        
        const validCategories = [
            'Harassment',
            'Poor Lighting',
            'Stalking',
            'Suspicious Activity',
            'Unsafe Transport Stop'
        ];
        
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                error: 'Invalid category. Must be one of: ' + validCategories.join(', ')
            });
        }
        
        const report = await createDangerZoneReport({
            lat,
            lng,
            category,
            description,
            userId
        });
        
        console.log(`[DangerZones] New report created:`, {
            id: report.id,
            category: report.category,
            location: { lat: report.lat, lng: report.lng }
        });
        
        res.status(201).json({
            success: true,
            report
        });
    } catch (error) {
        console.error('[DangerZones] Error creating report:', error);
        res.status(500).json({
            error: 'Failed to create danger zone report',
            details: error.message
        });
    }
});


router.get('/', async (req, res) => {
    try {
        const { lat, lng, radius, demo } = req.query;
        
        // Demo mode: return mock data
        if (demo === 'true' || process.env.DEMO_MODE === 'true') {
            const demoLat = parseFloat(lat) || 18.5204;
            const demoLng = parseFloat(lng) || 73.8567;
            const mockZones = generateMockDangerZones(demoLat, demoLng);
            
            console.log(`[DangerZones] Returning ${mockZones.length} demo zones`);
            
            return res.json({
                success: true,
                zones: mockZones,
                demo: true
            });
        }
        
        // If no location provided, return all zones
        if (!lat || !lng) {
            const allZones = await getAllDangerZones();
            
            return res.json({
                success: true,
                zones: allZones,
                count: allZones.length
            });
        }
        
        // Parse coordinates
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = radius ? parseFloat(radius) : 10;
        
        // Validate coordinates
        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                error: 'Invalid coordinates. Lat and lng must be valid numbers.'
            });
        }
        
        // Fetch danger zones within radius
        const zones = await getDangerZones(latitude, longitude, radiusKm);
        
        console.log(`[DangerZones] Returning ${zones.length} zones within ${radiusKm}km`);
        
        res.json({
            success: true,
            zones,
            count: zones.length,
            radius: radiusKm
        });
    } catch (error) {
        console.error('[DangerZones] Error fetching zones:', error);
        res.status(500).json({
            error: 'Failed to fetch danger zones',
            details: error.message
        });
    }
});


router.get('/:zoneId', async (req, res) => {
    try {
        const { zoneId } = req.params;
        
       
        const allZones = await getAllDangerZones();
        const zone = allZones.find(z => z.id === zoneId);
        
        if (!zone) {
            return res.status(404).json({
                error: 'Danger zone not found'
            });
        }
        
        res.json({
            success: true,
            zone
        });
    } catch (error) {
        console.error('[DangerZones] Error fetching zone details:', error);
        res.status(500).json({
            error: 'Failed to fetch zone details',
            details: error.message
        });
    }
});

export default router;
