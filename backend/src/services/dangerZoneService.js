// Danger Zone Service
// Handles community-reported danger zones with risk scoring

import { db } from '../config/firebase.js';

// Risk scoring weights based on recency
const RECENCY_WEIGHTS = {
    VERY_RECENT: { days: 7, weight: 1.5 },    // Last 7 days
    RECENT: { days: 30, weight: 1.0 },         // Last 30 days
    OLD: { weight: 0.5 }                       // Older than 30 days
};

// Risk level thresholds
const RISK_THRESHOLDS = {
    HIGH: 5,      // Risk score >= 5
    MEDIUM: 2,    // Risk score >= 2
    LOW: 0        // Risk score >= 0
};

// Minimum reports to show as high risk (misuse protection)
const MIN_REPORTS_FOR_HIGH_RISK = 2;

// Clustering distance (meters) - reports within this distance are grouped
const CLUSTERING_DISTANCE = 500; // 500 meters

/**
 * Calculate recency weight based on report age
 * @param {Date} timestamp - Report timestamp
 * @returns {number} - Weight multiplier
 */
const calculateRecencyWeight = (timestamp) => {
    const now = new Date();
    const reportDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const daysSince = (now - reportDate) / (1000 * 60 * 60 * 24);

    if (daysSince <= RECENCY_WEIGHTS.VERY_RECENT.days) {
        return RECENCY_WEIGHTS.VERY_RECENT.weight;
    } else if (daysSince <= RECENCY_WEIGHTS.RECENT.days) {
        return RECENCY_WEIGHTS.RECENT.weight;
    } else {
        return RECENCY_WEIGHTS.OLD.weight;
    }
};

/**
 * Calculate Haversine distance between two points
 * @param {number} lat1 
 * @param {number} lng1 
 * @param {number} lat2 
 * @param {number} lng2 
 * @returns {number} - Distance in meters
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const toRad = (deg) => deg * Math.PI / 180;
    
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
};

/**
 * Calculate risk score for a danger zone cluster
 * @param {Array} reports - Array of reports in the cluster
 * @returns {number} - Risk score
 */
const calculateRiskScore = (reports) => {
    let totalScore = 0;
    
    reports.forEach(report => {
        const recencyWeight = calculateRecencyWeight(report.timestamp);
        totalScore += recencyWeight;
    });
    
    return totalScore;
};

/**
 * Determine risk level from score
 * @param {number} score - Risk score
 * @param {number} reportCount - Number of reports
 * @returns {string} - 'high', 'medium', or 'low'
 */
const getRiskLevel = (score, reportCount) => {
    // Misuse protection: require minimum reports for high risk
    if (score >= RISK_THRESHOLDS.HIGH && reportCount >= MIN_REPORTS_FOR_HIGH_RISK) {
        return 'high';
    } else if (score >= RISK_THRESHOLDS.MEDIUM) {
        return 'medium';
    } else {
        return 'low';
    }
};

/**
 * Cluster nearby danger zone reports
 * @param {Array} reports - All danger zone reports
 * @returns {Array} - Clustered zones with risk scores
 */
const clusterDangerZones = (reports) => {
    const clusters = [];
    const processed = new Set();
    
    reports.forEach((report, index) => {
        if (processed.has(index)) return;
        
        // Start new cluster
        const cluster = {
            id: `cluster_${index}`,
            lat: report.lat,
            lng: report.lng,
            reports: [report],
            categories: new Set([report.category]),
            firstReported: report.timestamp,
            lastReported: report.timestamp
        };
        
        processed.add(index);
        
        // Find nearby reports
        reports.forEach((otherReport, otherIndex) => {
            if (processed.has(otherIndex)) return;
            
            const distance = calculateDistance(
                report.lat,
                report.lng,
                otherReport.lat,
                otherReport.lng
            );
            
            if (distance <= CLUSTERING_DISTANCE) {
                cluster.reports.push(otherReport);
                cluster.categories.add(otherReport.category);
                
                // Update timestamps
                const otherDate = otherReport.timestamp.toDate ? 
                    otherReport.timestamp.toDate() : new Date(otherReport.timestamp);
                const firstDate = cluster.firstReported.toDate ? 
                    cluster.firstReported.toDate() : new Date(cluster.firstReported);
                const lastDate = cluster.lastReported.toDate ? 
                    cluster.lastReported.toDate() : new Date(cluster.lastReported);
                
                if (otherDate < firstDate) {
                    cluster.firstReported = otherReport.timestamp;
                }
                if (otherDate > lastDate) {
                    cluster.lastReported = otherReport.timestamp;
                }
                
                processed.add(otherIndex);
            }
        });
        
        // Calculate average position for cluster
        const avgLat = cluster.reports.reduce((sum, r) => sum + r.lat, 0) / cluster.reports.length;
        const avgLng = cluster.reports.reduce((sum, r) => sum + r.lng, 0) / cluster.reports.length;
        
        cluster.lat = avgLat;
        cluster.lng = avgLng;
        cluster.categories = Array.from(cluster.categories);
        cluster.reportCount = cluster.reports.length;
        cluster.riskScore = calculateRiskScore(cluster.reports);
        cluster.riskLevel = getRiskLevel(cluster.riskScore, cluster.reportCount);
        
        clusters.push(cluster);
    });
    
    return clusters;
};

/**
 * Save a new danger zone report
 * @param {Object} reportData - Report data
 * @returns {Promise<Object>} - Created report
 */
export const createDangerZoneReport = async (reportData) => {
    const { lat, lng, category, description, userId } = reportData;
    
    // Validate required fields
    if (!lat || !lng || !category) {
        throw new Error('Missing required fields: lat, lng, category');
    }
    
    const report = {
        lat,
        lng,
        category,
        description: description || '',
        timestamp: new Date(),
        userId: userId || 'anonymous',
        verified: false
    };
    
    const docRef = await db.collection('dangerZones').add(report);
    
    return {
        id: docRef.id,
        ...report
    };
};

/**
 * Get danger zones within a radius
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Promise<Array>} - Clustered danger zones
 */
export const getDangerZones = async (lat, lng, radiusKm = 10) => {
    try {
        // Fetch all danger zones (in production, implement geo-queries)
        const snapshot = await db.collection('dangerZones').get();
        
        const reports = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            reports.push({
                id: doc.id,
                ...data
            });
        });
        
        // Filter by radius
        const radiusMeters = radiusKm * 1000;
        const nearbyReports = reports.filter(report => {
            const distance = calculateDistance(lat, lng, report.lat, report.lng);
            return distance <= radiusMeters;
        });
        
        // Cluster and calculate risk scores
        const clusters = clusterDangerZones(nearbyReports);
        
        return clusters;
    } catch (error) {
        console.error('[DangerZoneService] Error fetching danger zones:', error);
        throw error;
    }
};

/**
 * Get all danger zones (for admin/map view)
 * @returns {Promise<Array>} - All clustered danger zones
 */
export const getAllDangerZones = async () => {
    try {
        const snapshot = await db.collection('dangerZones').get();
        
        const reports = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            reports.push({
                id: doc.id,
                ...data
            });
        });
        
        // Cluster and calculate risk scores
        const clusters = clusterDangerZones(reports);
        
        return clusters;
    } catch (error) {
        console.error('[DangerZoneService] Error fetching all danger zones:', error);
        throw error;
    }
};

/**
 * Generate mock danger zones for demo mode (50-60 zones covering Pune and nearby areas)
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @returns {Array} - Mock danger zones
 */
export const generateMockDangerZones = (lat, lng) => {
    // Pune coordinates: 18.5204° N, 73.8567° E
    const puneCenter = { lat: 18.5204, lng: 73.8567 };
    
    const mockReports = [
        // Koregaon Park Area
        { id: 'demo_1', lat: 18.5362, lng: 73.8958, category: 'Harassment', description: 'Eve teasing near MG Road', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: 'demo_user_1' },
        { id: 'demo_2', lat: 18.5355, lng: 73.8945, category: 'Poor Lighting', description: 'Dark alley near North Main Road', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), userId: 'demo_user_2' },
        { id: 'demo_3', lat: 18.5370, lng: 73.8970, category: 'Suspicious Activity', description: 'Suspicious people loitering', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), userId: 'demo_user_3' },
        
        // Shivajinagar Area
        { id: 'demo_4', lat: 18.5308, lng: 73.8479, category: 'Unsafe Transport Stop', description: 'Isolated bus stop near JM Road', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), userId: 'demo_user_4' },
        { id: 'demo_5', lat: 18.5295, lng: 73.8492, category: 'Poor Lighting', description: 'Street lights broken', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: 'demo_user_5' },
        { id: 'demo_6', lat: 18.5310, lng: 73.8465, category: 'Harassment', description: 'Multiple harassment reports', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), userId: 'demo_user_6' },
        
        // Kothrud Area
        { id: 'demo_7', lat: 18.5074, lng: 73.8077, category: 'Poor Lighting', description: 'Dark street near Paud Road', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), userId: 'demo_user_7' },
        { id: 'demo_8', lat: 18.5082, lng: 73.8095, category: 'Stalking', description: 'Person following women at night', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), userId: 'demo_user_8' },
        { id: 'demo_9', lat: 18.5065, lng: 73.8060, category: 'Harassment', description: 'Catcalling near market', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), userId: 'demo_user_9' },
        
        // Hadapsar Area
        { id: 'demo_10', lat: 18.5089, lng: 73.9260, category: 'Poor Lighting', description: 'No street lights', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), userId: 'demo_user_10' },
        { id: 'demo_11', lat: 18.5095, lng: 73.9275, category: 'Suspicious Activity', description: 'Group of men loitering', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: 'demo_user_11' },
        { id: 'demo_12', lat: 18.5078, lng: 73.9240, category: 'Unsafe Transport Stop', description: 'Isolated auto stand', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), userId: 'demo_user_12' },
        
        // Aundh Area
        { id: 'demo_13', lat: 18.5591, lng: 73.8077, category: 'Harassment', description: 'Harassment near IT Park', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), userId: 'demo_user_13' },
        { id: 'demo_14', lat: 18.5585, lng: 73.8090, category: 'Poor Lighting', description: 'Dark pathway', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), userId: 'demo_user_14' },
        { id: 'demo_15', lat: 18.5600, lng: 73.8065, category: 'Stalking', description: 'Person following near mall', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: 'demo_user_15' },
        
        // Baner Area
        { id: 'demo_16', lat: 18.5593, lng: 73.7755, category: 'Poor Lighting', description: 'Broken street lights near Baner Road', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), userId: 'demo_user_16' },
        { id: 'demo_17', lat: 18.5605, lng: 73.7770, category: 'Suspicious Activity', description: 'Suspicious vehicle parked', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), userId: 'demo_user_17' },
        { id: 'demo_18', lat: 18.5580, lng: 73.7740, category: 'Harassment', description: 'Eve teasing reports', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), userId: 'demo_user_18' },
        
        // Wakad Area
        { id: 'demo_19', lat: 18.6046, lng: 73.7572, category: 'Poor Lighting', description: 'No lights in residential area', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), userId: 'demo_user_19' },
        { id: 'demo_20', lat: 18.6055, lng: 73.7585, category: 'Unsafe Transport Stop', description: 'Isolated bus stop', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), userId: 'demo_user_20' },
        { id: 'demo_21', lat: 18.6040, lng: 73.7560, category: 'Harassment', description: 'Women harassed near market', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: 'demo_user_21' },
        
        // Hinjewadi Area
        { id: 'demo_22', lat: 18.5912, lng: 73.7395, category: 'Poor Lighting', description: 'Dark area near Phase 1', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), userId: 'demo_user_22' },
        { id: 'demo_23', lat: 18.5920, lng: 73.7410, category: 'Stalking', description: 'Person following at night', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), userId: 'demo_user_23' },
        { id: 'demo_24', lat: 18.5905, lng: 73.7380, category: 'Suspicious Activity', description: 'Suspicious men loitering', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), userId: 'demo_user_24' },
        
        // Viman Nagar Area
        { id: 'demo_25', lat: 18.5679, lng: 73.9143, category: 'Harassment', description: 'Catcalling near Phoenix Mall', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: 'demo_user_25' },
        { id: 'demo_26', lat: 18.5685, lng: 73.9155, category: 'Poor Lighting', description: 'Dark alley near airport road', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), userId: 'demo_user_26' },
        { id: 'demo_27', lat: 18.5670, lng: 73.9130, category: 'Unsafe Transport Stop', description: 'Isolated rickshaw stand', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), userId: 'demo_user_27' },
        
        // Kalyani Nagar Area
        { id: 'demo_28', lat: 18.5484, lng: 73.9049, category: 'Stalking', description: 'Stalker reported multiple times', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), userId: 'demo_user_28' },
        { id: 'demo_29', lat: 18.5475, lng: 73.9035, category: 'Harassment', description: 'Harassment near restaurants', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), userId: 'demo_user_29' },
        { id: 'demo_30', lat: 18.5490, lng: 73.9060, category: 'Poor Lighting', description: 'Street lights not working', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), userId: 'demo_user_30' },
        
        // Deccan Gymkhana Area
        { id: 'demo_31', lat: 18.5167, lng: 73.8408, category: 'Poor Lighting', description: 'Dark street near FC Road', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), userId: 'demo_user_31' },
        { id: 'demo_32', lat: 18.5175, lng: 73.8420, category: 'Harassment', description: 'Eve teasing near college', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: 'demo_user_32' },
        { id: 'demo_33', lat: 18.5160, lng: 73.8395, category: 'Suspicious Activity', description: 'Group of men harassing', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), userId: 'demo_user_33' },
        
        // Camp Area
        { id: 'demo_34', lat: 18.5195, lng: 73.8743, category: 'Unsafe Transport Stop', description: 'Isolated bus stop near station', timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), userId: 'demo_user_34' },
        { id: 'demo_35', lat: 18.5205, lng: 73.8755, category: 'Poor Lighting', description: 'No lights near railway station', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), userId: 'demo_user_35' },
        { id: 'demo_36', lat: 18.5185, lng: 73.8730, category: 'Harassment', description: 'Women harassed near market', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), userId: 'demo_user_36' },
        
        // Pimpri-Chinchwad Area
        { id: 'demo_37', lat: 18.6298, lng: 73.7997, category: 'Poor Lighting', description: 'Dark industrial area', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), userId: 'demo_user_37' },
        { id: 'demo_38', lat: 18.6305, lng: 73.8010, category: 'Stalking', description: 'Stalking near factory area', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: 'demo_user_38' },
        { id: 'demo_39', lat: 18.6290, lng: 73.7985, category: 'Harassment', description: 'Multiple harassment cases', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), userId: 'demo_user_39' },
        
        // Warje Area
        { id: 'demo_40', lat: 18.4804, lng: 73.8065, category: 'Poor Lighting', description: 'Broken lights near highway', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), userId: 'demo_user_40' },
        { id: 'demo_41', lat: 18.4815, lng: 73.8075, category: 'Suspicious Activity', description: 'Suspicious vehicle parked', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), userId: 'demo_user_41' },
        { id: 'demo_42', lat: 18.4795, lng: 73.8050, category: 'Unsafe Transport Stop', description: 'Isolated auto stand', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), userId: 'demo_user_42' },
        
        // Kondhwa Area
        { id: 'demo_43', lat: 18.4614, lng: 73.8868, category: 'Harassment', description: 'Eve teasing near market', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), userId: 'demo_user_43' },
        { id: 'demo_44', lat: 18.4625, lng: 73.8880, category: 'Poor Lighting', description: 'Dark residential street', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), userId: 'demo_user_44' },
        { id: 'demo_45', lat: 18.4605, lng: 73.8855, category: 'Stalking', description: 'Woman followed at night', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: 'demo_user_45' },
        
        // Pune Station Area
        { id: 'demo_46', lat: 18.5285, lng: 73.8742, category: 'Unsafe Transport Stop', description: 'Crowded and unsafe at night', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), userId: 'demo_user_46' },
        { id: 'demo_47', lat: 18.5290, lng: 73.8755, category: 'Harassment', description: 'Harassment near station exit', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), userId: 'demo_user_47' },
        { id: 'demo_48', lat: 18.5275, lng: 73.8730, category: 'Poor Lighting', description: 'Dark underpass', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), userId: 'demo_user_48' },
        
        // Swargate Area
        { id: 'demo_49', lat: 18.4987, lng: 73.8560, category: 'Poor Lighting', description: 'No lights near bus depot', timestamp: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), userId: 'demo_user_49' },
        { id: 'demo_50', lat: 18.4995, lng: 73.8575, category: 'Suspicious Activity', description: 'Suspicious people near depot', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), userId: 'demo_user_50' },
        { id: 'demo_51', lat: 18.4980, lng: 73.8545, category: 'Harassment', description: 'Women harassed at bus stop', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: 'demo_user_51' },
        
        // Magarpatta Area
        { id: 'demo_52', lat: 18.5157, lng: 73.9291, category: 'Poor Lighting', description: 'Dark area near IT park', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), userId: 'demo_user_52' },
        { id: 'demo_53', lat: 18.5165, lng: 73.9305, category: 'Stalking', description: 'Stalking reported by IT workers', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), userId: 'demo_user_53' },
        { id: 'demo_54', lat: 18.5150, lng: 73.9280, category: 'Unsafe Transport Stop', description: 'Isolated cab pickup point', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), userId: 'demo_user_54' },
        
        // Kharadi Area
        { id: 'demo_55', lat: 18.5515, lng: 73.9475, category: 'Harassment', description: 'Harassment near EON mall', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), userId: 'demo_user_55' },
        { id: 'demo_56', lat: 18.5525, lng: 73.9490, category: 'Poor Lighting', description: 'Broken street lights', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), userId: 'demo_user_56' },
        { id: 'demo_57', lat: 18.5505, lng: 73.9460, category: 'Suspicious Activity', description: 'Suspicious group loitering', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: 'demo_user_57' },
        
        // Additional hotspots
        { id: 'demo_58', lat: 18.5320, lng: 73.8480, category: 'Harassment', description: 'JM Road harassment hotspot', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), userId: 'demo_user_58' },
        { id: 'demo_59', lat: 18.5098, lng: 73.8250, category: 'Poor Lighting', description: 'Karve Road dark patch', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), userId: 'demo_user_59' },
        { id: 'demo_60', lat: 18.5450, lng: 73.8900, category: 'Unsafe Transport Stop', description: 'Isolated rickshaw stand near Kalyani Nagar', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), userId: 'demo_user_60' }
    ];
    
    // Cluster the mock reports
    const clusters = clusterDangerZones(mockReports);
    
    return clusters;
};

export default {
    createDangerZoneReport,
    getDangerZones,
    getAllDangerZones,
    generateMockDangerZones
};
