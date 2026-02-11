import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
    watchPosition,
    clearWatch,
    getCurrentPosition,
    reverseGeocode,
    generateMapsLink
} from '../../services/geolocation';
import { sosAPI } from '../../services/api';
import { dangerZonesAPI } from '../../services/api';
import { fixLeafletIcons, createCustomIcon, createDangerZoneIcon } from '../../utils/leafletIcons';
import {
    MapPin,
    RefreshCw,
    Share2,
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Navigation,
    Clock,
    ExternalLink,
    Signal,
    SignalHigh,
    SignalLow,
    FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../Common/LoadingSpinner';
import RecoveryPanel from '../Common/RecoveryPanel';
import EvidenceTimeline from '../Common/EvidenceTimeline';
import ReportDangerZone from '../Safety/ReportDangerZone';

const LiveMap = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState('');
    const [accuracy, setAccuracy] = useState('');
    const [loading, setLoading] = useState(true);
    const [incidents, setIncidents] = useState([]);
    const [activeIncident, setActiveIncident] = useState(null);
    const [watchId, setWatchId] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [publicIncident, setPublicIncident] = useState(null);
    const [isPublicView, setIsPublicView] = useState(false);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const pathRef = useRef(null);
    const polylineLatLngs = useRef([]);
    const [lastSentAt, setLastSentAt] = useState(null);
    const [showRecovery, setShowRecovery] = useState(false);
    const [showEvidence, setShowEvidence] = useState(false);
    const [selectedIncidentId, setSelectedIncidentId] = useState(null);
    const [showReportDangerZone, setShowReportDangerZone] = useState(false);
    const [dangerZones, setDangerZones] = useState([]);
    const dangerZoneMarkers = useRef([]);

    // Get incident ID from URL if present
    const incidentId = searchParams.get('incident');

    useEffect(() => {
        if (incidentId && !user) {
            setIsPublicView(true);
        }
    }, [incidentId, user]);

    useEffect(() => {
        if (!isPublicView) {
            initializeTracking();
        }

        if (user) {
            fetchIncidents();
        }

        return () => {
            if (watchId) {
                clearWatch(watchId);
            }
            // remove map
            if (mapRef.current && mapRef.current.remove) mapRef.current.remove();
        };
    }, [isPublicView, user]);

    useEffect(() => {
        if (isPublicView && watchId) {
            clearWatch(watchId);
            setWatchId(null);
        }
    }, [isPublicView, watchId]);

    const initializeTracking = async () => {
        try {
            // Get initial position
            const pos = await getCurrentPosition();
            updateLocation(pos);

            // Start watching position
            const id = watchPosition(
                (newPos) => updateLocation(newPos),
                (error) => {
                    const message = error?.userMessage || 'Location tracking interrupted';
                    toast.error(message);
                }
            );
            setWatchId(id);
        } catch (error) {
            const message = error?.userMessage || 'Unable to get location. Please enable GPS.';
            toast.error(message);
            console.error('Location error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateMapFromCoords = async (lat, lng) => {
        // Initialize map if not present and Leaflet available
        try {
            if (!mapRef.current) {
                // Fix Leaflet marker icons for Vite production
                const L = await fixLeafletIcons();
                await import('leaflet/dist/leaflet.css');

                // Check if map container exists and is empty
                const mapContainer = document.getElementById('live-map');
                if (!mapContainer) {
                    console.error('Map container not found');
                    return;
                }
                
                // Clear any existing map instance
                if (mapContainer._leaflet_id) {
                    mapContainer._leaflet_id = null;
                }

                const map = L.map('live-map', { zoomControl: false }).setView([lat, lng], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                // Create custom marker with fixed icons
                const customIcon = createCustomIcon(L, { color: '#ef4444', icon: '📍' });
                const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
                
                mapRef.current = map;
                markerRef.current = marker;
                pathRef.current = L.polyline([[lat, lng]], { color: '#ef4444', weight: 3 }).addTo(map);
                polylineLatLngs.current = [[lat, lng]];
                
                // Fetch danger zones for this location
                fetchDangerZones(lat, lng);
            } else {
                // Check if map is still valid (not destroyed)
                const map = mapRef.current;
                const marker = markerRef.current;
                
                // Verify map container still exists in DOM
                const mapContainer = document.getElementById('live-map');
                if (!mapContainer || !mapContainer._leaflet_id) {
                    console.warn('Map container lost, reinitializing...');
                    mapRef.current = null;
                    markerRef.current = null;
                    pathRef.current = null;
                    // Recursively call to reinitialize
                    return updateMapFromCoords(lat, lng);
                }
                
                // Update marker and map position
                if (marker) {
                    marker.setLatLng([lat, lng]);
                }
                
                if (map && map.getContainer()) {
                    try {
                        map.panTo([lat, lng]);
                    } catch (panError) {
                        console.warn('panTo failed, using setView:', panError);
                        map.setView([lat, lng], map.getZoom());
                    }
                }
                
                // Update path
                polylineLatLngs.current.push([lat, lng]);
                if (pathRef.current) {
                    pathRef.current.setLatLngs(polylineLatLngs.current);
                }
            }
        } catch (mapErr) {
            console.error('Map initialization error:', mapErr);
            // Leaflet not installed or failed — fallback to placeholder
        }
    };

    // Fetch danger zones from API
    const fetchDangerZones = async (lat, lng) => {
        try {
            const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
            const response = await dangerZonesAPI.getZones({
                lat,
                lng,
                radius: 10, // 10km radius
                demo: isDemoMode
            });
            
            if (response.data?.zones) {
                setDangerZones(response.data.zones);
                renderDangerZones(response.data.zones);
            }
        } catch (error) {
            // Silent error - danger zones not critical for core functionality
        }
    };

    // Render danger zone markers on map
    const renderDangerZones = async (zones) => {
        if (!mapRef.current) return;
        
        try {
            const L = await fixLeafletIcons();
            
            // Clear existing danger zone markers
            dangerZoneMarkers.current.forEach(marker => marker.remove());
            dangerZoneMarkers.current = [];
            
            // Create markers for each danger zone
            zones.forEach(zone => {
                // Define risk level colors
                const riskColors = {
                    high: '#dc2626',    // red-600
                    medium: '#f59e0b',  // amber-500
                    low: '#10b981'      // green-500
                };
                const color = riskColors[zone.riskLevel] || riskColors.medium;
                
                // Use the custom danger zone icon utility
                const icon = createDangerZoneIcon(L, zone.riskLevel);
                
                // Create marker
                const marker = L.marker([zone.lat, zone.lng], { icon })
                    .addTo(mapRef.current);
                
                // Create popup content
                const popupContent = `
                    <div style="font-family: system-ui; max-width: 200px;">
                        <div style="font-weight: 600; margin-bottom: 8px; color: ${color};">
                            ${zone.riskLevel.toUpperCase()} RISK AREA
                        </div>
                        <div style="font-size: 13px; color: #374151; margin-bottom: 8px;">
                            <strong>${zone.reportCount}</strong> report${zone.reportCount > 1 ? 's' : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                            ${zone.categories.join(', ')}
                        </div>
                        <div style="font-size: 11px; color: #9ca3af;">
                            Risk Score: ${zone.riskScore.toFixed(1)}
                        </div>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                dangerZoneMarkers.current.push(marker);
            });
            
        } catch (error) {
            // Silent error - non-critical feature
        }
    };

    const handleReportSuccess = (report) => {
        toast.success('Location reported. Thank you for helping others stay safe.');
        // Refresh danger zones
        if (location) {
            fetchDangerZones(location.lat, location.lng);
        }
    };

    const updateLocation = async (pos) => {
        setLocation({ lat: pos.lat, lng: pos.lng });
        setAccuracy(pos.accuracy);
        setLastUpdate(new Date());

        // Get address for display
        const addr = await reverseGeocode(pos.lat, pos.lng);
        setAddress(addr);

        // If there's an active incident owned by the user, post live location to backend (debounced)
        try {
            if (activeIncident && activeIncident.userId === user?.uid) {
                const now = Date.now();
                if (!lastSentAt || now - lastSentAt > 5000) { // 5s throttle
                    sosAPI.updateLocation(activeIncident.id, {
                        lat: pos.lat,
                        lng: pos.lng,
                        address: addr,
                        accuracy: pos.accuracy,
                    }).catch((e) => console.warn('Failed to send live location:', e));
                    setLastSentAt(now);
                }
            }
        } catch (error) {
            // Silent error - location updates will retry
        }

        await updateMapFromCoords(pos.lat, pos.lng);
    };

    const fetchIncidents = async () => {
        if (!user?.uid) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;

        try {
            const incidentsRef = collection(db, 'incidents');
            const q = query(
                incidentsRef,
                where('userId', '==', user.uid),
                orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(q);
            const incidentsList = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Convert Firestore Timestamp to JavaScript Date
                    timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null),
                    triggeredAt: data.triggeredAt?.toDate ? data.triggeredAt.toDate() : (data.triggeredAt ? new Date(data.triggeredAt) : null),
                };
            });

            setIncidents(incidentsList);

            // Set active incident
            if (incidentId) {
                const incident = incidentsList.find(i => i.id === incidentId);
                if (incident) {
                    setActiveIncident(incident);
                    setIsPublicView(false);
                } else {
                    setIsPublicView(true);
                }
            } else {
                const active = incidentsList.find(i => i.status === 'active');
                if (active) setActiveIncident(active);
            }
        } catch (error) {
            console.warn('Error fetching incidents:', error?.message || error);
        }
    };

    const fetchPublicIncident = async () => {
        if (!incidentId) return;
        try {
            const resp = await sosAPI.trackIncident(incidentId);
            const data = resp?.data;
            if (!data) return;
            setPublicIncident(data);
            if (data.location?.lat && data.location?.lng) {
                setLocation({ lat: data.location.lat, lng: data.location.lng });
                setAddress(data.location.address || `${data.location.lat}, ${data.location.lng}`);
                setAccuracy(data.location.accuracy || 'low');
                setLastUpdate(new Date());
                await updateMapFromCoords(data.location.lat, data.location.lng);
            }
        } catch (error) {
            // Silent error - UI will show appropriate state
        }
    };

    useEffect(() => {
        if (!isPublicView || !incidentId) return;
        fetchPublicIncident();
        const interval = setInterval(fetchPublicIncident, 5000);
        return () => clearInterval(interval);
    }, [isPublicView, incidentId]);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const pos = await getCurrentPosition();
            updateLocation(pos);
            toast.success('Location refreshed successfully.');
        } catch (error) {
            toast.error('Unable to refresh location. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!location) {
            toast.error('Location not available.');
            return;
        }

        const mapsLink = generateMapsLink(location.lat, location.lng);
        const shareText = `🚨 SafeHer Live Location\n\n📍 ${address}\n\n🔗 ${mapsLink}\n\nThis is my current location. Please check on me!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Location - SafeHer',
                    text: shareText,
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    copyToClipboard(mapsLink);
                }
            }
        } else {
            copyToClipboard(mapsLink);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success('Location link copied successfully.');
        }).catch(() => {
            toast.error('Unable to copy link.');
        });
    };

    const resolveIncident = async (incidentIdToResolve) => {
        try {
            await sosAPI.resolveIncident(incidentIdToResolve);
            toast.success('Incident marked as resolved successfully.');
            
            // Show recovery panel
            setSelectedIncidentId(incidentIdToResolve);
            setShowRecovery(true);
            
            fetchIncidents();
        } catch (error) {
            console.error('Error resolving incident:', error);
            toast.error('Unable to resolve incident. Please try again.');
        }
    };

    const handleRecoveryComplete = () => {
        setShowRecovery(false);
        setSelectedIncidentId(null);
        toast.success('Recovery process completed.');
    };

    const handleViewEvidence = (incidentId) => {
        setSelectedIncidentId(incidentId);
        setShowEvidence(true);
    };

    const getAccuracyIcon = () => {
        switch (accuracy) {
            case 'high':
                return <SignalHigh size={16} className="text-green-500" />;
            case 'medium':
                return <Signal size={16} className="text-yellow-500" />;
            default:
                return <SignalLow size={16} className="text-red-500" />;
        }
    };

    const formatTime = (date) => {
        if (!date) return 'N/A';
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            if (isNaN(dateObj.getTime())) return 'N/A';
            return dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            return 'N/A';
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            if (isNaN(dateObj.getTime())) return 'N/A';
            return dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'N/A';
        }
    };

    const activeViewIncident = isPublicView ? publicIncident : activeIncident;
    const respondingCount = typeof activeViewIncident?.respondingCount === 'number'
        ? activeViewIncident.respondingCount
        : (Array.isArray(activeViewIncident?.responders)
            ? activeViewIncident.responders.filter(r => r.action === 'accepted').length
            : 0);
    const trackingLink = activeViewIncident?.trackingUrl || (isPublicView ? window.location.href : null);

    const handleShareTrackingLink = async () => {
        if (!trackingLink) return;
        try {
            await navigator.clipboard.writeText(trackingLink);
            toast.success('Tracking link copied successfully.');
        } catch (e) {
            toast.error('Unable to copy tracking link.');
        }
    };

    if (!user && !incidentId) {
        return (
            <div className="page-container pt-6">
                <div className="container">
                    <div className="card text-center">
                        <h1 className="text-xl font-semibold text-gray-900 mb-2">Sign in to start live tracking</h1>
                        <p className="text-sm text-gray-600 mb-4">
                            You need an account to view your own live tracking dashboard.
                        </p>
                        <Link to="/login" className="btn btn-primary">Go to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container pt-6">
            <div className="container">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Active Incident Banner */}
                {activeViewIncident && activeViewIncident.status === 'active' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 slide-up">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={18} className="text-red-600" />
                            <span className="font-semibold text-red-800">
                                {isPublicView ? 'Emergency Response Active' : 'Emergency Alert Active'}
                            </span>
                        </div>
                        {activeViewIncident.id && (
                            <p className="text-xs text-gray-600 mb-2 font-mono">
                                Incident ID: SH-{activeViewIncident.id.slice(0, 8).toUpperCase()}
                            </p>
                        )}
                        <p className="text-sm text-red-600 mb-3">
                            {isPublicView ? 'Live location tracking in progress' : 'Emergency contacts have been notified'}
                        </p>
                        {respondingCount > 0 && (
                            <p className="text-sm text-blue-700 mb-3">Responding guardians: {respondingCount}</p>
                        )}
                        <button
                            onClick={() => resolveIncident(activeViewIncident.id)}
                            className="btn btn-secondary text-sm py-2"
                            disabled={isPublicView}
                        >
                            <CheckCircle size={16} />
                            I'm Safe - Mark Resolved
                        </button>
                    </div>
                )}

                {/* Map Container */}
                <div className="map-container bg-gradient-to-br from-blue-100 to-blue-50 relative mb-4">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                            <LoadingSpinner size="large" text="Determining your location..." />
                        </div>
                    ) : location ? (
                        <>
                            {/* Leaflet Map */}
                            <div id="live-map" className="absolute inset-0 rounded-2xl" />

                            {/* Report Danger Zone Button */}
                            <button
                                onClick={() => setShowReportDangerZone(true)}
                                className="absolute top-4 right-4 btn btn-danger text-sm py-2 px-3 z-[1000] shadow-lg"
                                title="Report unsafe location"
                            >
                                <AlertTriangle size={16} />
                                Report Danger
                            </button>

                            {/* Risk Legend */}
                            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000] text-xs">
                                <div className="font-semibold mb-2 text-gray-900">Risk Levels</div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <span className="text-gray-700">Low Risk</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <span className="text-gray-700">Moderate</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                        <span className="text-gray-700">High Risk</span>
                                    </div>
                                </div>
                            </div>

                            {/* Open in Google Maps Link */}
                            <a
                                href={generateMapsLink(location.lat, location.lng)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-4 right-4 btn btn-primary text-sm py-2 px-3 z-[1000] shadow-lg"
                            >
                                <ExternalLink size={16} />
                                Open in Google Maps
                            </a>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <Navigation size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Unable to get location</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Location Details Card */}
                {location && (
                    <div className="card mb-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <MapPin size={18} className="text-blue-600" />
                                <span className="font-semibold text-gray-900">Current Location</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {getAccuracyIcon()}
                                <span className="text-xs text-gray-500 capitalize">{accuracy}</span>
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{address}</p>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                            <Clock size={12} />
                            <span>Last updated: {formatTime(lastUpdate)}</span>
                        </div>

                        <button
                            onClick={handleShare}
                            className="btn btn-accent w-full"
                        >
                            <Share2 size={18} />
                            Share My Location
                        </button>
                        {trackingLink && (
                            <button
                                onClick={handleShareTrackingLink}
                                className="btn btn-secondary w-full mt-2"
                            >
                                <Share2 size={18} />
                                Share Tracking Link
                            </button>
                        )}
                    </div>
                )}

                {/* Past Incidents */}
                {incidents.length > 0 && (
                    <div className="mb-6">
                        <h2 className="font-semibold text-gray-900 mb-3">Past Incidents</h2>
                        <div className="space-y-3">
                            {incidents.slice(0, 5).map((incident) => (
                                <div key={incident.id} className="card py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`badge ${incident.status === 'resolved'
                                                        ? 'badge-success'
                                                        : 'badge-danger'
                                                    }`}>
                                                    {incident.status === 'resolved' ? 'Resolved' : 'Active'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatDate(incident.timestamp || incident.triggeredAt || incident.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-1">
                                                {incident.location?.address || 
                                                 (incident.location?.lat && incident.location?.lng 
                                                     ? `${incident.location.lat.toFixed(6)}, ${incident.location.lng.toFixed(6)}`
                                                     : 'Location unavailable')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {incident.status === 'resolved' && (
                                                <button
                                                    onClick={() => handleViewEvidence(incident.id)}
                                                    className="text-purple-600 text-sm font-medium hover:underline flex items-center gap-1"
                                                >
                                                    <FileText size={14} />
                                                    Evidence
                                                </button>
                                            )}
                                            {incident.status === 'active' && (
                                                <button
                                                    onClick={() => resolveIncident(incident.id)}
                                                    className="text-green-600 text-sm font-medium hover:underline"
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Recovery Panel Modal */}
            {showRecovery && selectedIncidentId && (
                <RecoveryPanel 
                    incidentId={selectedIncidentId}
                    onComplete={handleRecoveryComplete}
                />
            )}

            {/* Evidence Timeline Modal */}
            {showEvidence && selectedIncidentId && (
                <EvidenceTimeline 
                    incidentId={selectedIncidentId}
                    onClose={() => {
                        setShowEvidence(false);
                        setSelectedIncidentId(null);
                    }}
                />
            )}

            {/* Report Danger Zone Modal */}
            <ReportDangerZone 
                isOpen={showReportDangerZone}
                onClose={() => setShowReportDangerZone(false)}
                onReportSuccess={handleReportSuccess}
            />
        </div>
    );
};

export default LiveMap;
