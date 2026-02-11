import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { guardiansAPI } from '../../services/api';
import { generateMapsLink } from '../../services/geolocation';
import { AlertCircle, MapPin, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const GuardianAlerts = () => {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchAlerts = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const resp = await guardiansAPI.getAlerts(user.uid);
            setAlerts(resp?.data?.alerts || []);
        } catch (error) {
            console.error('Fetch guardian alerts error:', error);
            toast.error('Failed to load guardian alerts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 10000);
        return () => clearInterval(interval);
    }, [user?.uid]);

    const handleRespond = async (alert, action) => {
        try {
            await guardiansAPI.respond(user.uid, {
                incidentId: alert.incidentId,
                action,
                alertId: alert.id,
            });
            toast.success(action === 'accepted' ? 'Response confirmed. User will be notified.' : 'Response recorded.');
            setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: action } : a));
        } catch (error) {
            console.error('Guardian respond error:', error);
            toast.error('Unable to process response. Please try again.');
        }
    };

    if (!user?.uid) return null;

    return (
        <div className="card mb-6 slide-up">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <AlertCircle size={18} className="text-red-600" />
                    <h3 className="font-semibold text-gray-900">Guardian Alerts</h3>
                </div>
                <button
                    onClick={fetchAlerts}
                    disabled={loading}
                    className="p-2 rounded-lg hover:bg-gray-100"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {alerts.length === 0 && !loading && (
                <p className="text-sm text-gray-500">No active emergency alerts at this time.</p>
            )}

            <div className="space-y-3">
                {alerts.map((alert) => {
                    const incident = alert.incident || {};
                    const location = alert.location || incident.location;
                    const mapsLink = location?.lat && location?.lng
                        ? generateMapsLink(location.lat, location.lng)
                        : null;
                    const respondingCount = incident.respondingCount ?? 0;

                    return (
                        <div key={alert.id} className="border border-gray-100 rounded-xl p-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {incident.userName ? `${incident.userName} needs help` : 'Nearby SOS Alert'}
                                    </p>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Status: {incident.status || 'active'}
                                    </div>
                                </div>
                                <span className={`badge ${alert.status === 'accepted' ? 'badge-success' : alert.status === 'declined' ? 'badge-warning' : 'badge-danger'}`}>
                                    {alert.status || 'notified'}
                                </span>
                            </div>

                            {location && (
                                <div className="flex items-start gap-2 text-sm text-gray-600 mt-2">
                                    <MapPin size={14} className="mt-0.5" />
                                    <span className="line-clamp-2">{location.address || `${location.lat}, ${location.lng}`}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                                <span>Responding guardians: {respondingCount}</span>
                                {mapsLink && (
                                    <a
                                        href={mapsLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        Open Map
                                    </a>
                                )}
                            </div>

                            {alert.status !== 'accepted' && alert.status !== 'declined' && (
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleRespond(alert, 'accepted')}
                                        className="btn btn-primary text-sm py-2"
                                    >
                                        <CheckCircle2 size={16} />
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleRespond(alert, 'declined')}
                                        className="btn btn-secondary text-sm py-2"
                                    >
                                        <XCircle size={16} />
                                        Decline
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GuardianAlerts;
