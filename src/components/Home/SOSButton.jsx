import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sosAPI } from '../../services/api';
import { getLocationWithFallback, reverseGeocode, generateMapsLink } from '../../services/geolocation';
import { AlertTriangle, ShieldAlert, Phone, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PoliceEscalationPanel from './PoliceEscalationPanel';
import { triggerSilentSOS } from '../../services/covertService';

const SOSButton = forwardRef(({ onSOSTriggered }, ref) => {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const [triggering, setTriggering] = useState(false);
    const [triggered, setTriggered] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [showEscalation, setShowEscalation] = useState(false);
    const [currentIncidentId, setCurrentIncidentId] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);

    const pendingKey = 'safeher_pending_sos';

    const savePendingSOS = (payload) => {
        try {
            localStorage.setItem(pendingKey, JSON.stringify({ payload, createdAt: new Date().toISOString() }));
        } catch (err) {
            console.warn('Failed to save pending SOS:', err);
        }
    };

    const clearPendingSOS = () => {
        try {
            localStorage.removeItem(pendingKey);
        } catch (err) {
            console.warn('Failed to clear pending SOS:', err);
        }
    };

    const sendPendingSOS = async () => {
        if (!navigator.onLine) return;
        if (!userProfile?.id) return;
        let pending;
        try {
            pending = JSON.parse(localStorage.getItem(pendingKey) || 'null');
        } catch (e) {
            pending = null;
        }
        if (!pending?.payload) return;

        try {
            const resp = await sosAPI.trigger(pending.payload);
            if (resp?.data?.success) {
                clearPendingSOS();
                const incidentId = resp.data.incidentId;
                toast.success('Emergency alerts delivered successfully.');
                if (onSOSTriggered) onSOSTriggered();
                navigate(`/track?incident=${incidentId}`);
            }
        } catch (err) {
            if (err?.response?.status === 409 && err?.response?.data?.incidentId) {
                clearPendingSOS();
                const existingIncidentId = err.response.data.incidentId;
                toast('An SOS is already active. Opening tracking…', { icon: 'ℹ️' });
                navigate(`/track?incident=${existingIncidentId}`);
            }
        }
    };

    useEffect(() => {
        sendPendingSOS();
        const onOnline = () => sendPendingSOS();
        window.addEventListener('online', onOnline);
        return () => window.removeEventListener('online', onOnline);
    }, [userProfile?.id]);

    const handleSOSPress = () => {
        if (triggering || triggered) return;

        // Start 3-second countdown for accidental press prevention
        let count = 3;
        setCountdown(count);

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdown(count);
            } else {
                clearInterval(interval);
                setCountdown(null);
                triggerSOS();
            }
        }, 1000);

        // Allow cancel within countdown
        const handleCancel = () => {
            clearInterval(interval);
            setCountdown(null);
            toast('Emergency alert cancelled.', { icon: 'ℹ️' });
        };

        // Store cancel handler
        window.sosCancel = handleCancel;
    };

    const cancelSOS = () => {
        if (window.sosCancel) {
            window.sosCancel();
            window.sosCancel = null;
        }
    };

    const triggerSOS = async () => {
        setTriggering(true);
        let payload = null;

        try {
            // Get location
            toast.loading('Determining your current location...', { id: 'sos-location' });
            const location = await getLocationWithFallback();

            // Reverse geocode
            const address = await reverseGeocode(location.lat, location.lng);
            toast.dismiss('sos-location');

            // Check for emergency contacts
            const contacts = userProfile?.emergencyContacts || [];
            if (contacts.length === 0) {
                toast.error('Please add emergency contacts first!');
                setTriggering(false);
                navigate('/profile');
                return;
            }

            // Trigger SOS via backend API (sends emails / SMS server-side)
            toast.loading('Notifying emergency contacts...', { id: 'sos-alerts' });

            payload = {
                location: {
                    lat: location.lat,
                    lng: location.lng,
                    address,
                    accuracy: location.accuracy,
                },
                deviceInfo: navigator.userAgent,
            };

            const resp = await sosAPI.trigger(payload);
            toast.dismiss('sos-alerts');

            if (resp?.data?.success) {
                const incidentId = resp.data.incidentId;
                setCurrentIncidentId(incidentId);
                setCurrentLocation(payload.location);
                setTriggered(true);
                setTriggering(false);
                toast.success('Emergency response activated. Your contacts have been notified.');

                if (onSOSTriggered) onSOSTriggered();

                // Show escalation panel after brief delay
                setTimeout(() => {
                    setShowEscalation(true);
                }, 1500);
            } else {
                throw new Error('SOS API failed');
            }

        } catch (error) {
            console.error('SOS trigger error:', error);
            toast.dismiss();

            if (error?.response?.status === 409 && error?.response?.data?.incidentId) {
                const existingIncidentId = error.response.data.incidentId;
                toast('An SOS is already active. Opening tracking…', { icon: 'ℹ️' });
                setTriggering(false);
                navigate(`/track?incident=${existingIncidentId}`);
                return;
            }

            if (!navigator.onLine || error?.request) {
                savePendingSOS(payload);
                toast('You are offline. SOS will be sent when online.', { icon: '📶' });
                setTriggering(false);
                return;
            }

            toast.error('Failed to trigger SOS. Please try again.');
            setTriggering(false);
        }
    };

    // Expose covert trigger method via ref
    useImperativeHandle(ref, () => ({
        triggerCovert: async () => {
            try {
                await triggerSilentSOS(triggerSOS, 'gesture');
            } catch (error) {
                // Silently handle cancellation
                if (error.message !== 'Cancelled') {
                    console.error('[SOSButton] Covert trigger failed:', error);
                }
            }
        }
    }));

    if (triggered) {
        return (
            <>
                <div className="w-full sos-wrapper">
                    <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-8 text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <CheckCircle size={48} className="text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-green-800 mb-2">Emergency Response Activated</h2>
                        <p className="text-green-600 mb-4">
                            Your emergency contacts have been notified and guardians are being alerted
                        </p>
                        <button
                            onClick={() => {
                                if (currentIncidentId) {
                                    navigate(`/track?incident=${currentIncidentId}`);
                                } else {
                                    navigate('/track');
                                }
                            }}
                            className="btn btn-primary"
                        >
                            View Live Tracking
                        </button>
                    </div>
                </div>

                {/* Police Escalation Panel */}
                {showEscalation && (
                    <PoliceEscalationPanel
                        incidentId={currentIncidentId}
                        userLocation={currentLocation}
                        onClose={() => {
                            setShowEscalation(false);
                            if (currentIncidentId) {
                                navigate(`/track?incident=${currentIncidentId}`);
                            }
                        }}
                    />
                )}
            </>
        );
    }

    if (countdown !== null) {
        return (
            <div className="w-full sos-wrapper">
                <div className="relative">
                    <button
                        onClick={cancelSOS}
                        className="sos-button mx-auto bg-gradient-to-br from-red-500 to-red-700 text-white flex flex-col items-center justify-center shadow-2xl"
                        style={{ maxHeight: '180px', maxWidth: '320px' }}
                    >
                        <span className="text-7xl font-bold mb-2">{countdown}</span>
                        <span className="text-lg font-medium opacity-90">TAP TO CANCEL</span>
                    </button>
                    <div className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-30"
                        style={{ animationDuration: '1s' }} />
                </div>
                <p className="text-center text-gray-500 mt-4">
                    Preparing emergency response...
                </p>
            </div>
        );
    }

    return (
        <div className="w-full sos-wrapper">
            <button
                onClick={handleSOSPress}
                disabled={triggering}
                className="sos-button mx-auto bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white flex flex-col items-center justify-center shadow-2xl hover:shadow-red-500/50 transition-all duration-300 disabled:opacity-70"
                style={{ maxHeight: '180px', maxWidth: '320px' }}
            >
                {triggering ? (
                    <>
                        <div className="spinner !w-12 !h-12 !border-white !border-t-transparent mb-3" />
                        <span className="text-lg font-semibold">Activating...</span>
                    </>
                ) : (
                    <>
                        <ShieldAlert size={64} className="mb-2" />
                        <span className="text-3xl font-bold">EMERGENCY</span>
                        <span className="text-sm opacity-90 mt-1">Hold to Activate</span>
                    </>
                )}
            </button>

            {/* Warning text */}
            <div className="flex items-center justify-center gap-2 mt-4 text-gray-500 text-sm">
                <AlertTriangle size={16} />
                <span>Hold for 3 seconds to activate</span>
            </div>

            {/* Quick call option */}
            <div className="text-center mt-4">
                <a
                    href="tel:112"
                    className="inline-flex items-center gap-2 text-blue-600 font-medium text-sm hover:underline"
                >
                    <Phone size={16} />
                    Direct Call: Emergency Services (112)
                </a>
            </div>
        </div>
    );
});

SOSButton.displayName = 'SOSButton';

export default SOSButton;
