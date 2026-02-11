import express from 'express';

const router = express.Router();

// GET /api/geocode/reverse?lat=..&lng=..
router.get('/reverse', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);

        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            return res.status(400).json({ error: 'lat and lng are required' });
        }

        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const resp = await fetch(url, {
            headers: {
                'User-Agent': 'SafeHer-MVP/1.0 (demo)'
            }
        });

        if (!resp.ok) {
            return res.status(resp.status).json({ error: 'Reverse geocoding failed' });
        }

        const data = await resp.json();
        res.json({ address: data.display_name || `${lat}, ${lng}` });
    } catch (error) {
        console.error('Reverse geocode error:', error);
        res.status(500).json({ error: 'Reverse geocoding failed' });
    }
});

export default router;
