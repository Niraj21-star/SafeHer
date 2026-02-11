import { useState, useEffect } from 'react';
import { Shield, Phone, MapPin, Navigation, AlertCircle, X, ExternalLink } from 'lucide-react';
import { 
    getNearbyPoliceStations, 
    callEmergencyNumber, 
    callPoliceStation,
    getDirectionsToStation,
    logEscalationEvent
} from '../../services/policeService';
import toast from 'react-hot-toast';

const PoliceEscalationPanel = ({ incidentId, userLocation, onClose }) => {
    const [showConfirmCall, setShowConfirmCall] = useState(false);
    const [showStations, setShowStations] = useState(false);
    const [stations, setStations] = useState([]);
    const [loadingStations, setLoadingStations] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (showStations && stations.length === 0) {
            fetchNearbyStations();
        }
    }, [showStations]);

    const fetchNearbyStations = async () => {
        if (!userLocation?.lat || !userLocation?.lng) {
            setError('Location unavailable');
            return;
        }

        setLoadingStations(true);
        setError(null);

        try {
            const nearbyStations = await getNearbyPoliceStations(
                userLocation.lat,
                userLocation.lng,
                5 // 5 km radius
            );
            
            setStations(nearbyStations);
            
            if (nearbyStations.length === 0) {
                setError('No police stations found within 5 km');
            }

            logEscalationEvent(incidentId, 'view_stations', {
                stationsFound: nearbyStations.length,
                location: userLocation
            });
        } catch (err) {
            console.error('Error fetching police stations:', err);
            setError('Unable to fetch nearby stations. Please try again.');
        } finally {
            setLoadingStations(false);
        }
    };

    const handleCall112 = () => {
        setShowConfirmCall(true);
    };

    const confirmCall112 = () => {
        const success = callEmergencyNumber();
        if (success) {
            logEscalationEvent(incidentId, 'call_112', {
                timestamp: new Date().toISOString()
            });
            toast.success('Connecting to emergency services...');
        } else {
            toast.error('Unable to initiate call');
        }
        setShowConfirmCall(false);
    };

    const cancelCall112 = () => {
        setShowConfirmCall(false);
        toast('Escalation cancelled.', { icon: 'ℹ️' });
    };

    const handleCallStation = (station) => {
        if (!station.phone) {
            toast.error('Phone number not available for this station');
            return;
        }

        const success = callPoliceStation(station.phone);
        if (success) {
            logEscalationEvent(incidentId, 'call_station', {
                stationName: station.name,
                phone: station.phone,
                distance: station.distance
            });
            toast.success(`Calling ${station.name}...`);
        } else {
            toast.error('Unable to initiate call');
        }
    };

    const handleGetDirections = (station) => {
        getDirectionsToStation(station.lat, station.lng, station.name);
        logEscalationEvent(incidentId, 'get_directions', {
            stationName: station.name,
            distance: station.distance
        });
        toast.success('Opening directions...');
    };

    const handleNotNow = () => {
        logEscalationEvent(incidentId, 'dismissed', {
            viewed: showStations,
            stationsViewed: stations.length
        });
        onClose();
    };

    if (showConfirmCall) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Phone size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Escalate to Emergency Services?
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                This will connect you to 112 - National Emergency Response
                            </p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Use this only in genuine emergencies. 
                            Misuse may have legal consequences.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={cancelCall112}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmCall112}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Phone size={18} />
                            Call 112
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showStations) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Shield size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Nearby Police Stations</h3>
                                <p className="text-xs text-gray-500">Within 5 km radius</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowStations(false)}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loadingStations ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                                <p className="text-gray-600">Locating nearby police stations...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <AlertCircle size={48} className="text-gray-400 mb-3" />
                                <p className="text-gray-600 text-center">{error}</p>
                                <button
                                    onClick={fetchNearbyStations}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : stations.length > 0 ? (
                            <div className="space-y-3">
                                {stations.map((station) => (
                                    <div
                                        key={station.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 mb-1">
                                                    {station.name}
                                                </h4>
                                                <p className="text-sm text-gray-600 flex items-start gap-1">
                                                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                                                    {station.address}
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-2">
                                                {station.distance} km
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {station.phone && (
                                                <button
                                                    onClick={() => handleCallStation(station)}
                                                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Phone size={16} />
                                                    Contact Station
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleGetDirections(station)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Navigation size={16} />
                                                Directions
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <AlertCircle size={48} className="mx-auto mb-3 text-gray-300" />
                                <p>No police stations found nearby</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={handleNotNow}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main escalation options panel
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Shield size={32} className="text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Additional Assistance Available
                    </h2>
                    <p className="text-sm text-gray-600">
                        Your guardians have been alerted. You may escalate to emergency services if needed.
                    </p>
                </div>

                <div className="space-y-3 mb-6">
                    {/* Call 112 Button */}
                    <button
                        onClick={handleCall112}
                        className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <Phone size={20} />
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-semibold">Escalate to Emergency Services</div>
                                <div className="text-xs text-blue-100">Connect to 112 immediately</div>
                            </div>
                            <ExternalLink size={18} className="opacity-75 group-hover:opacity-100" />
                        </div>
                    </button>

                    {/* View Nearby Stations Button */}
                    <button
                        onClick={() => setShowStations(true)}
                        className="w-full p-4 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <MapPin size={20} className="text-blue-600" />
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-semibold text-gray-900">View Nearby Stations</div>
                                <div className="text-xs text-gray-600">Find closest police stations</div>
                            </div>
                            <Navigation size={18} className="text-blue-600 opacity-75 group-hover:opacity-100" />
                        </div>
                    </button>
                </div>

                {/* Not Now Button */}
                <button
                    onClick={handleNotNow}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                    Not Now
                </button>

                {/* Disclaimer */}
                <p className="text-xs text-gray-500 text-center mt-4">
                    Emergency services should only be contacted in genuine situations. 
                    Misuse may have legal consequences.
                </p>
            </div>
        </div>
    );
};

export default PoliceEscalationPanel;
