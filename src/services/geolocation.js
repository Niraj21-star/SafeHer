// Geolocation service with fallback mechanisms

// Get current position using native Geolocation API
export const getCurrentPosition = (options = {}) => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 30000, // 30 seconds for GPS lock
            maximumAge: 60000,
            ...options,
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                resolve({
                    lat: latitude,
                    lng: longitude,
                    accuracy: getAccuracyLevel(accuracy),
                    rawAccuracy: accuracy,
                    source: 'gps',
                });
            },
            (error) => {
                reject(error);
            },
            defaultOptions
        );
    });
};

// Watch position for real-time tracking
export const watchPosition = (callback, errorCallback, options = {}) => {
    if (!navigator.geolocation) {
        errorCallback(new Error('Geolocation is not supported'));
        return null;
    }

    const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 30000, // 30 seconds for watch
        maximumAge: 0,
        ...options,
    };

    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            callback({
                lat: latitude,
                lng: longitude,
                accuracy: getAccuracyLevel(accuracy),
                rawAccuracy: accuracy,
                source: 'gps',
                timestamp: new Date().toISOString(),
            });
        },
        errorCallback,
        defaultOptions
    );

    return watchId;
};

// Clear position watch
export const clearWatch = (watchId) => {
    if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
    }
};

// Get accuracy level from meters
const getAccuracyLevel = (meters) => {
    if (meters <= 10) return 'high';
    if (meters <= 100) return 'medium';
    return 'low';
};

// Fallback to IP-based geolocation with caching
let ipLocationCache = null;
let ipLocationCacheTime = 0;
const IP_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getIPBasedLocation = async () => {
    try {
        // Return cached location if available and recent
        const now = Date.now();
        if (ipLocationCache && (now - ipLocationCacheTime) < IP_CACHE_DURATION) {
            console.log('Using cached IP location');
            return ipLocationCache;
        }

        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('IP geolocation failed');

        const data = await response.json();
        const location = {
            lat: data.latitude,
            lng: data.longitude,
            accuracy: 'low',
            source: 'ip',
            city: data.city,
            region: data.region,
            country: data.country_name,
        };
        
        // Cache the result
        ipLocationCache = location;
        ipLocationCacheTime = now;
        
        return location;
    } catch (error) {
        console.error('IP geolocation error:', error);
        // Return cached location even if expired, rather than failing
        if (ipLocationCache) {
            console.warn('IP geolocation failed, using stale cache');
            return ipLocationCache;
        }
        throw error;
    }
};

// Get location with fallback mechanism
export const getLocationWithFallback = async () => {
    try {
        // Try GPS first
        const gpsLocation = await getCurrentPosition();
        return gpsLocation;
    } catch (gpsError) {
        console.warn('GPS failed, trying IP-based location:', gpsError.message);

        try {
            // Fallback to IP-based location
            const ipLocation = await getIPBasedLocation();
            return ipLocation;
        } catch (ipError) {
            console.error('All location methods failed');
            throw new Error('Unable to determine your location. Please enable location services or try again.');
        }
    }
};

// Reverse geocode coordinates to address
export const reverseGeocode = async (lat, lng) => {
    try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
        const apiBase = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(
            `${apiBase}/geocode/reverse?lat=${lat}&lng=${lng}`
        );

        if (!response.ok) throw new Error('Reverse geocoding failed');

        const data = await response.json();
        return data.address || `${lat}, ${lng}`;
    } catch (error) {
        console.warn('Reverse geocoding error:', error?.message || error);
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
};

// Generate Google Maps link
export const generateMapsLink = (lat, lng) => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
};

// Generate tracking link
export const generateTrackingLink = (incidentId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/track/${incidentId}`;
};
