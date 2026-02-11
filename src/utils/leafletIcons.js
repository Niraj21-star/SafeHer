// Fix for Leaflet marker icons in Vite production build
// This resolves the 404 error for marker-icon.png

export const fixLeafletIcons = async () => {
    try {
        const L = await import('leaflet');
        
        // Delete the default icon to force re-initialization
        delete L.Icon.Default.prototype._getIconUrl;
        
        // Set default icon using data URLs or CDN as fallback
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
        
        return L;
    } catch (error) {
        console.error('Failed to fix Leaflet icons:', error);
        // Fallback: try to load Leaflet without icon fix
        return await import('leaflet');
    }
};

// Create custom marker icon using divIcon (no createIcon needed)
export const createCustomIcon = (L, options = {}) => {
    const {
        color = '#ef4444',
        size = 32,
        icon = '📍',
    } = options;
    
    return L.divIcon({
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border: 3px solid white;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <span style="
                    transform: rotate(45deg);
                    font-size: ${size * 0.6}px;
                ">${icon}</span>
            </div>
        `,
        className: 'custom-marker-icon',
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
    });
};

// Create danger zone icon
export const createDangerZoneIcon = (L, riskLevel = 'medium') => {
    const riskColors = {
        high: '#dc2626',    // red-600
        medium: '#f59e0b',  // amber-500
        low: '#10b981'      // green-500
    };
    
    const color = riskColors[riskLevel] || riskColors.medium;
    
    return L.divIcon({
        html: `
            <div style="
                width: 32px;
                height: 32px;
                background-color: ${color};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <span style="font-size: 16px;">⚠️</span>
            </div>
        `,
        className: 'danger-zone-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    });
};
