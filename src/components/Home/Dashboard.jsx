import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import SOSButton from './SOSButton';
import GuardianAlerts from './GuardianAlerts';
import { Shield, MapPin, Clock, Users, AlertCircle, CheckCircle2, Navigation, Calculator } from 'lucide-react';
import { getCurrentPosition } from '../../services/geolocation';
import { 
    getCovertSettings, 
    TripleTapDetector, 
    SwipePatternDetector, 
    RapidTapDetector,
    triggerSilentSOS 
} from '../../services/covertService';

const Dashboard = () => {
    const { userProfile } = useAuth();
    const [recentIncident, setRecentIncident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [nearbyGuardians, setNearbyGuardians] = useState([]);
    const [loadingGuardians, setLoadingGuardians] = useState(false);
    const sosButtonRef = useRef(null);
    const gestureDetectorRef = useRef(null);

    useEffect(() => {
        fetchRecentIncident();
        fetchNearbyGuardians();
        setupGestureDetection();

        return () => {
            cleanupGestureDetection();
        };
    }, [userProfile]);

    const setupGestureDetection = () => {
        const settings = getCovertSettings();
        if (!settings.enabled || !settings.gestureEnabled) return;

        cleanupGestureDetection();

        const handleCovertTrigger = () => {
            if (sosButtonRef.current && sosButtonRef.current.triggerCovert) {
                sosButtonRef.current.triggerCovert();
            }
        };

        switch (settings.gestureType) {
            case 'triple-tap':
                gestureDetectorRef.current = new TripleTapDetector(handleCovertTrigger);
                break;
            case 'swipe-pattern':
                gestureDetectorRef.current = new SwipePatternDetector(handleCovertTrigger);
                break;
            case 'logo-taps':
                gestureDetectorRef.current = new RapidTapDetector('.app-logo', handleCovertTrigger, 5);
                break;
        }

        if (gestureDetectorRef.current) {
            gestureDetectorRef.current.attach();
        }
    };

    const cleanupGestureDetection = () => {
        if (gestureDetectorRef.current) {
            gestureDetectorRef.current.detach();
            gestureDetectorRef.current = null;
        }
    };

    const fetchRecentIncident = async () => {
        if (!userProfile?.id) {
            setLoading(false);
            return;
        }

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setLoading(false);
            return;
        }

        try {
            const incidentsRef = collection(db, 'incidents');
            const q = query(
                incidentsRef,
                where('userId', '==', userProfile.id),
                orderBy('timestamp', 'desc'),
                limit(1)
            );

            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setRecentIncident({ id: doc.id, ...doc.data() });
            }
        } catch (error) {
            console.warn('Error fetching incident:', error?.message || error);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const fetchNearbyGuardians = async () => {
        if (!userProfile?.id) return;
        
        setLoadingGuardians(true);
        try {
            const position = await getCurrentPosition();
            if (!position) {
                setLoadingGuardians(false);
                return;
            }

            const guardiansRef = collection(db, 'guardians');
            const q = query(
                guardiansRef,
                where('optIn', '==', true),
                limit(10)
            );

            const snapshot = await getDocs(q);
            
            const allGuardians = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const guardians = allGuardians
                .filter(g => {
                    if (!g.location?.lat || !g.location?.lng) {
                        return false;
                    }
                    const distance = calculateDistance(
                        position.lat,
                        position.lng,
                        g.location.lat,
                        g.location.lng
                    );
                    return distance <= 20000; // Within 20km
                })
                .map(g => ({
                    ...g,
                    distance: calculateDistance(
                        position.lat,
                        position.lng,
                        g.location.lat,
                        g.location.lng
                    )
                }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 5);

            setNearbyGuardians(guardians);
        } catch (error) {
            console.error('Error fetching nearby guardians:', error);
        } finally {
            setLoadingGuardians(false);
        }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371000; // meters
        const toRad = (deg) => deg * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const formatDistance = (meters) => {
        if (meters < 1000) return `${Math.round(meters)}m`;
        return `${(meters / 1000).toFixed(1)}km`;
    };

    const emergencyContactsCount = userProfile?.emergencyContacts?.length || 0;

    return (
        <div className="page-container pt-6">
            <div className="container">
                {/* Header */}
                <div className="mb-6 fade-in">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full  bg-pink-500 flex items-center justify-center text-white font-bold text-lg">
                            {userProfile?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">{getGreeting()}</p>
                            <h1 className="text-xl font-bold text-gray-900">
                                {userProfile?.name?.split(' ')[0] || 'User'} 👋
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Protection Status Card */}
                <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white mb-6 slide-up">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-black font-semibold text-xl">Protection Active</h2>
                            <p className="text-black text-md">Emergency response ready 24/7</p>
                        </div>
                    </div>
                </div>

               

                

                {/* SOS Button */}
                <SOSButton ref={sosButtonRef} onSOSTriggered={fetchRecentIncident} />

                {/* Guardian Alerts */}
                {(userProfile?.guardianOptIn || userProfile?.isGuardian) && (
                    <GuardianAlerts />
                )}

                {/* Quick Info Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6 mt-6">
                    {/* Emergency Contacts */}
                    <div className="card card-hover">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={18} className="text-pink-500" />
                            <span className="text-sm font-medium text-gray-600">Contacts</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{emergencyContactsCount}</p>
                        <p className="text-xs text-gray-500">
                            {emergencyContactsCount === 0
                                ? 'Add contacts'
                                : emergencyContactsCount < 2
                                    ? 'Add more'
                                    : 'Protected'}
                        </p>
                    </div>

                    {/* Location Status */}
                    <div className="card card-hover">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin size={18} className="text-green-500" />
                            <span className="text-sm font-medium text-gray-600">Location</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">Active</p>
                        <p className="text-xs text-gray-500">GPS enabled</p>
                    </div>
                </div>

                {/* Nearby Guardians */}
                <div className="card mb-6 slide-up">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Navigation size={18} className="text-blue-500" />
                            Nearby Guardians
                        </h3>
                        {nearbyGuardians.length > 0 && (
                            <span className="badge badge-primary">
                                {nearbyGuardians.length} Available
                            </span>
                        )}
                    </div>
                    
                    {loadingGuardians ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            <div className="animate-pulse">Locating nearby guardians...</div>
                        </div>
                    ) : nearbyGuardians.length > 0 ? (
                        <div className="space-y-2">
                            {nearbyGuardians.map((guardian) => (
                                <div
                                    key={guardian.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                                            {guardian.name?.charAt(0) || 'G'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">
                                                {guardian.name || 'Guardian'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Response time: {guardian.responseTime || 'N/A'} min
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-blue-600">
                                            {formatDistance(guardian.distance)}
                                        </p>
                                        <p className="text-xs text-gray-500">away</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-sm mb-2">No guardians in your immediate area</p>
                            <p className="text-gray-400 text-xs">Guardians within 20km will appear here</p>
                        </div>
                    )}
                </div>

                {/* Recent Incident */}
                {!loading && recentIncident && (
                    <div className="card mb-6 slide-up">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Recent Emergency</h3>
                            <span className={`badge ${recentIncident.status === 'resolved' ? 'badge-success' : 'badge-danger'}`}>
                                {recentIncident.status === 'resolved' ? (
                                    <>
                                        <CheckCircle2 size={12} />
                                        Resolved
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={12} />
                                        Active
                                    </>
                                )}
                            </span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Clock size={14} />
                                <span>{formatTimeAgo(recentIncident.timestamp)}</span>
                            </div>
                            {recentIncident.location?.address && (
                                <div className="flex items-start gap-2 text-gray-600">
                                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-2">{recentIncident.location.address}</span>
                                </div>
                            )}
                            {recentIncident.alertsSent && (
                                <p className="text-green-600 font-medium">
                                    ✓ {recentIncident.alertsSent.length} contact(s) notified
                                </p>
                            )}
                            {typeof recentIncident.respondingCount === 'number' && (
                                <p className="text-blue-600 font-medium">
                                    👥 {recentIncident.respondingCount} guardian(s) responding
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Safety Tips */}
                <div className="card bg-gradient-to-br from-pink-50 to-white border-pink-100">
                    <h3 className="font-semibold text-gray-900 mb-3">Safety Tips 💡</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                            <span className="text-pink-500">•</span>
                            Always share your live location when traveling late
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-pink-500">•</span>
                            Keep at least 2-3 emergency contacts updated
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-pink-500">•</span>
                            Trust your instincts - if something feels wrong, trigger SOS
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
