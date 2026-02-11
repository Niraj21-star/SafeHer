import { useState, useEffect } from 'react';
import { 
    Clock, 
    MapPin, 
    AlertCircle, 
    CheckCircle, 
    Shield, 
    Phone, 
    Download, 
    FileText,
    Copy,
    X
} from 'lucide-react';
import { incidentsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EvidenceTimeline = ({ incidentId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [evidence, setEvidence] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [copiedHash, setCopiedHash] = useState(false);

    useEffect(() => {
        fetchEvidence();
    }, [incidentId]);

    const fetchEvidence = async () => {
        try {
            const response = await incidentsAPI.getEvidence(incidentId);
            setEvidence(response.data.evidence);
            setTimeline(response.data.timeline);
        } catch (error) {
            console.error('Error fetching evidence:', error);
            toast.error('Failed to load evidence data');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadEvidence = async () => {
        try {
            const response = await incidentsAPI.downloadEvidence(incidentId);
            const blob = new Blob([response.data], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `SafeHer_Evidence_${incidentId}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Evidence report downloaded');
        } catch (error) {
            console.error('Error downloading evidence:', error);
            toast.error('Failed to download evidence');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedHash(true);
        toast.success('Evidence hash copied');
        setTimeout(() => setCopiedHash(false), 2000);
    };

    const getEventIcon = (type) => {
        switch (type) {
            case 'incident_triggered':
                return <AlertCircle className="text-red-600" size={20} />;
            case 'guardian_notified':
                return <Shield className="text-blue-600" size={20} />;
            case 'guardian_responded':
                return <CheckCircle className="text-green-600" size={20} />;
            case 'police_called':
                return <Phone className="text-orange-600" size={20} />;
            case 'incident_resolved':
                return <CheckCircle className="text-green-600" size={20} />;
            default:
                return <Clock className="text-gray-600" size={20} />;
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        
        try {
            let date;
            
            // Handle Firestore Timestamp
            if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                date = timestamp.toDate();
            } 
            // Handle Firebase Timestamp object
            else if (timestamp._seconds) {
                date = new Date(timestamp._seconds * 1000);
            }
            // Handle ISO string or number
            else {
                date = new Date(timestamp);
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            
            return date.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return 'Invalid Date';
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
                        <p className="text-gray-600">Loading evidence...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!evidence) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Evidence Timeline</h2>
                                <p className="text-purple-100 text-sm">Complete incident documentation</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Evidence Hash Section */}
                <div className="p-6 border-b border-gray-200 bg-purple-50">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                <Shield size={18} />
                                Evidence Integrity Hash
                            </h3>
                            <div className="bg-white border border-purple-200 rounded-lg p-3 font-mono text-xs break-all text-purple-800">
                                {evidence.evidenceHash}
                            </div>
                            <p className="text-xs text-purple-600 mt-2">
                                This cryptographic hash verifies the authenticity and integrity of the evidence record.
                            </p>
                        </div>
                        <button
                            onClick={() => copyToClipboard(evidence.evidenceHash)}
                            className="flex-shrink-0 mt-6 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
                        >
                            {copiedHash ? <CheckCircle size={16} /> : <Copy size={16} />}
                            {copiedHash ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Incident Summary */}
                <div className="p-6 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Incident Summary</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <Clock size={20} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">Triggered At</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {formatTimestamp(evidence.incident?.timestamp || evidence.timestamp)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin size={20} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">Location</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {evidence.incident?.location?.address || 
                                     evidence.location?.address || 
                                     evidence.incident?.location?.coordinates ||
                                     (evidence.location?.lat && evidence.location?.lng
                                         ? `${evidence.location.lat.toFixed(6)}, ${evidence.location.lng.toFixed(6)}`
                                         : 'Location not available')}
                                </p>
                                {(evidence.incident?.location?.accuracy || evidence.location?.accuracy) && (
                                    <p className="text-xs text-gray-500">
                                        Accuracy: {evidence.incident?.location?.accuracy || evidence.location?.accuracy}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Shield size={20} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">Guardians Notified</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {evidence.guardians?.notified || evidence.guardiansNotified || 0} guardian{((evidence.guardians?.notified || evidence.guardiansNotified || 0) !== 1) ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle size={20} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">Status</p>
                                <p className="text-sm font-medium text-gray-900 capitalize">
                                    {evidence.incident?.status || evidence.status}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="p-6 max-h-[50vh] overflow-y-auto">
                    <h3 className="font-semibold text-gray-900 mb-4">Event Timeline</h3>
                    <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gray-200"></div>

                        {/* Timeline Events */}
                        <div className="space-y-6">
                            {timeline.map((event, index) => (
                                <div key={index} className="relative pl-12">
                                    {/* Icon Circle */}
                                    <div className="absolute left-0 top-1 w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
                                        {getEventIcon(event.type)}
                                    </div>

                                    {/* Event Content */}
                                    <div className="card border border-gray-200">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h4 className="font-medium text-gray-900">{event.description}</h4>
                                            <span className="text-xs text-gray-500 flex-shrink-0">
                                                {formatTimestamp(event.timestamp)}
                                            </span>
                                        </div>
                                        {event.details && typeof event.details === 'string' && (
                                            <p className="text-sm text-gray-600">{event.details}</p>
                                        )}
                                        {event.details && typeof event.details === 'object' && (
                                            <p className="text-sm text-gray-600">
                                                {JSON.stringify(event.details)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Guardian Responses Section */}
                {evidence.guardianResponses && evidence.guardianResponses.length > 0 && (
                    <div className="p-6 border-t border-gray-200 bg-blue-50">
                        <h3 className="font-semibold text-blue-900 mb-3">Guardian Responses</h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {evidence.guardianResponses.map((response, index) => (
                                <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-900">{response.guardianName}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            response.action === 'accepted' 
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {response.action}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {formatTimestamp(response.timestamp)}
                                    </p>
                                    {response.eta && (
                                        <p className="text-xs text-blue-600 mt-1">
                                            ETA: {response.eta} minutes
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl flex gap-3">
                    <button
                        onClick={handleDownloadEvidence}
                        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Download size={20} />
                        Download Complete Report
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EvidenceTimeline;
