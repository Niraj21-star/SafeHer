/**
 * Police Service - Responsible escalation to law enforcement
 * 
 * Features:
 * - Fetch nearby police stations (Google Places API)
 * - Demo mode with mock data
 * - Safe, user-confirmed calling
 * - No auto-trigger behavior
 */

const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

/**
 * Mock police stations for demo mode (Pune area)
 */
const MOCK_POLICE_STATIONS = [
    {
        id: 'demo_ps_1',
        name: 'Shivajinagar Police Station',
        address: 'Shivajinagar, Pune, Maharashtra',
        phone: '+912026053838',
        lat: 18.5304,
        lng: 73.8567,
        distance: 1.2,
        placeId: 'demo_place_1'
    },
    {
        id: 'demo_ps_2',
        name: 'Kothrud Police Station',
        address: 'Kothrud, Pune, Maharashtra',
        phone: '+912025434065',
        lat: 18.5074,
        lng: 73.8077,
        distance: 2.5,
        placeId: 'demo_place_2'
    },
    {
        id: 'demo_ps_3',
        name: 'Deccan Gymkhana Police Station',
        address: 'Deccan Gymkhana, Pune, Maharashtra',
        phone: '+912025675641',
        lat: 18.5203,
        lng: 73.8430,
        distance: 3.1,
        placeId: 'demo_place_3'
    },
    {
        id: 'demo_ps_4',
        name: 'Koregaon Park Police Station',
        address: 'Koregaon Park, Pune, Maharashtra',
        phone: '+912026162206',
        lat: 18.5362,
        lng: 73.8797,
        distance: 3.8,
        placeId: 'demo_place_4'
    },
    {
        id: 'demo_ps_5',
        name: 'Aundh Police Station',
        address: 'Aundh, Pune, Maharashtra',
        phone: '+912025880055',
        lat: 18.5584,
        lng: 73.8080,
        distance: 4.5,
        placeId: 'demo_place_5'
    }
];

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const toRad = (deg) => deg * (Math.PI / 180);
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

/**
 * Fetch nearby police stations using Google Places API
 */
async function fetchNearbyStationsFromAPI(latitude, longitude, radiusKm = 5) {
    if (!GOOGLE_PLACES_API_KEY) {
        throw new Error('Google Places API key not configured');
    }

    const radiusMeters = radiusKm * 1000;
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusMeters}&type=police&key=${GOOGLE_PLACES_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Places API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            throw new Error(`Places API status: ${data.status}`);
        }

        return data.results.map(place => {
            const distance = calculateDistance(
                latitude,
                longitude,
                place.geometry.location.lat,
                place.geometry.location.lng
            );

            return {
                id: place.place_id,
                name: place.name,
                address: place.vicinity || place.formatted_address || 'Address unavailable',
                phone: null, // Requires Place Details API call
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
                distance: parseFloat(distance.toFixed(1)),
                placeId: place.place_id,
                isOpen: place.opening_hours?.open_now,
                rating: place.rating
            };
        }).sort((a, b) => a.distance - b.distance);
    } catch (error) {
        console.error('Error fetching police stations from API:', error);
        throw error;
    }
}

/**
 * Get mock police stations for demo mode
 */
function getMockStations(latitude, longitude) {
    console.log('🎭 [DEMO MODE] Using mock police station data');
    
    // Calculate actual distances based on user location
    const stations = MOCK_POLICE_STATIONS.map(station => {
        const distance = calculateDistance(latitude, longitude, station.lat, station.lng);
        return {
            ...station,
            distance: parseFloat(distance.toFixed(1))
        };
    });

    // Sort by distance and return top 5
    return stations.sort((a, b) => a.distance - b.distance).slice(0, 5);
}

/**
 * Main function: Get nearby police stations
 * 
 * @param {number} latitude - User's current latitude
 * @param {number} longitude - User's current longitude
 * @param {number} radiusKm - Search radius in kilometers (default: 5)
 * @returns {Promise<Array>} Array of nearby police stations
 */
export async function getNearbyPoliceStations(latitude, longitude, radiusKm = 5) {
    if (!latitude || !longitude) {
        throw new Error('Valid coordinates required');
    }

    // Use mock data in demo mode or if API key is missing
    if (DEMO_MODE || !GOOGLE_PLACES_API_KEY) {
        return new Promise((resolve) => {
            // Simulate API delay
            setTimeout(() => {
                resolve(getMockStations(latitude, longitude));
            }, 800);
        });
    }

    // Try real API, fallback to mock on failure
    try {
        return await fetchNearbyStationsFromAPI(latitude, longitude, radiusKm);
    } catch (error) {
        console.warn('Failed to fetch from API, using mock data:', error.message);
        return getMockStations(latitude, longitude);
    }
}

/**
 * Initiate call to emergency number (112)
 * Must be called in response to user interaction
 * 
 * @returns {boolean} True if call initiated
 */
export function callEmergencyNumber() {
    try {
        window.location.href = 'tel:112';
        return true;
    } catch (error) {
        console.error('Failed to initiate emergency call:', error);
        return false;
    }
}

/**
 * Call a specific police station
 * 
 * @param {string} phoneNumber - Phone number to call
 * @returns {boolean} True if call initiated
 */
export function callPoliceStation(phoneNumber) {
    if (!phoneNumber) {
        console.error('No phone number provided');
        return false;
    }

    try {
        window.location.href = `tel:${phoneNumber}`;
        return true;
    } catch (error) {
        console.error('Failed to initiate station call:', error);
        return false;
    }
}

/**
 * Get directions to police station
 * 
 * @param {number} lat - Station latitude
 * @param {number} lng - Station longitude
 * @param {string} name - Station name
 */
export function getDirectionsToStation(lat, lng, name) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}`;
    window.open(url, '_blank');
}

/**
 * Log escalation event (for analytics/records)
 * 
 * @param {string} incidentId - Related incident ID
 * @param {string} action - Action taken (view_stations, call_112, call_station)
 * @param {object} metadata - Additional metadata
 */
export async function logEscalationEvent(incidentId, action, metadata = {}) {
    try {
        const event = {
            incidentId,
            action,
            timestamp: new Date().toISOString(),
            ...metadata
        };
        
        console.log('📋 Police escalation event:', event);
        
        // Could store in Firestore if needed
        // await db.collection('escalation_logs').add(event);
        
        return event;
    } catch (error) {
        console.error('Failed to log escalation event:', error);
    }
}

export default {
    getNearbyPoliceStations,
    callEmergencyNumber,
    callPoliceStation,
    getDirectionsToStation,
    logEscalationEvent
};
