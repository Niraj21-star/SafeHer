// Report Danger Zone Component
// Form for users to report unsafe locations

import { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, X, Loader } from 'lucide-react';
import { dangerZonesAPI } from '../../services/api';
import { getCurrentPosition } from '../../services/geolocation';

const CATEGORIES = [
    { value: 'Harassment', label: 'Harassment', icon: '🚨' },
    { value: 'Poor Lighting', label: 'Poor Lighting', icon: '💡' },
    { value: 'Stalking', label: 'Stalking', icon: '👁️' },
    { value: 'Suspicious Activity', label: 'Suspicious Activity', icon: '⚠️' },
    { value: 'Unsafe Transport Stop', label: 'Unsafe Transport Stop', icon: '🚏' }
];

const ReportDangerZone = ({ isOpen, onClose, onReportSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        lat: null,
        lng: null,
        category: '',
        description: ''
    });

    // Auto-detect location when component opens
    useEffect(() => {
        if (isOpen && !formData.lat && !formData.lng) {
            autoDetectLocation();
        }
    }, [isOpen]);

    const autoDetectLocation = async () => {
        setGettingLocation(true);
        setError('');
        
        try {
            const position = await getCurrentPosition();
            setFormData(prev => ({
                ...prev,
                lat: position.latitude,
                lng: position.longitude
            }));
            console.log('[ReportDangerZone] Location detected:', {
                lat: position.latitude,
                lng: position.longitude
            });
        } catch (err) {
            console.error('[ReportDangerZone] Location error:', err);
            setError('Failed to get your location. Please enable location services.');
        } finally {
            setGettingLocation(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.lat || !formData.lng) {
            setError('Location is required. Please enable location services.');
            return;
        }
        
        if (!formData.category) {
            setError('Please select a category.');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const response = await dangerZonesAPI.reportZone({
                lat: formData.lat,
                lng: formData.lng,
                category: formData.category,
                description: formData.description
            });
            
            console.log('[ReportDangerZone] Report submitted:', response.data);
            
            setSuccess(true);
            
            // Reset form after 2 seconds
            setTimeout(() => {
                setSuccess(false);
                setFormData({
                    lat: null,
                    lng: null,
                    category: '',
                    description: ''
                });
                
                if (onReportSuccess) {
                    onReportSuccess(response.data.report);
                }
                
                onClose();
            }, 2000);
            
        } catch (err) {
            console.error('[ReportDangerZone] Submit error:', err);
            const message = err.response?.data?.error || 'Failed to submit report. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = (category) => {
        setFormData(prev => ({ ...prev, category }));
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-t-2xl relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition"
                        disabled={loading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-8 h-8" />
                        <div>
                            <h2 className="text-2xl font-bold">Report Danger Zone</h2>
                            <p className="text-white/90 text-sm mt-1">
                                Help keep the community safe
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-green-800 font-medium">
                                ✓ Report submitted successfully!
                            </p>
                            <p className="text-green-600 text-sm mt-1">
                                Thank you for helping keep our community safe.
                            </p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Location Section */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Location
                        </label>
                        
                        {gettingLocation ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                                <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                                <span className="text-blue-700 text-sm">
                                    Detecting your location...
                                </span>
                            </div>
                        ) : formData.lat && formData.lng ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-800 text-sm font-medium">
                                    ✓ Location detected
                                </p>
                                <p className="text-green-600 text-xs mt-1">
                                    {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                                </p>
                                <button
                                    type="button"
                                    onClick={autoDetectLocation}
                                    className="text-green-600 text-xs underline mt-2 hover:text-green-700"
                                >
                                    Update location
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={autoDetectLocation}
                                className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition"
                            >
                                Detect My Location
                            </button>
                        )}
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Category *
                        </label>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => handleCategorySelect(cat.value)}
                                    className={`
                                        p-4 rounded-lg border-2 transition-all
                                        ${formData.category === cat.value
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-gray-200 hover:border-red-300'
                                        }
                                    `}
                                >
                                    <div className="text-2xl mb-1">{cat.icon}</div>
                                    <div className="text-xs font-medium text-gray-700">
                                        {cat.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description (Optional)
                        </label>
                        
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                description: e.target.value
                            }))}
                            placeholder="Provide additional details about this location..."
                            rows={4}
                            maxLength={500}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        />
                        
                        <div className="text-xs text-gray-500 mt-1 text-right">
                            {formData.description.length}/500 characters
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !formData.lat || !formData.category}
                        className={`
                            w-full py-4 rounded-lg font-bold text-white transition-all
                            ${loading || !formData.lat || !formData.category
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                            }
                        `}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader className="w-5 h-5 animate-spin" />
                                Submitting...
                            </span>
                        ) : (
                            'Submit Report'
                        )}
                    </button>

                    {/* Privacy Notice */}
                    <p className="text-xs text-gray-500 text-center">
                        Reports are anonymous and used to keep the community safe.
                        Your exact identity is not shared.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ReportDangerZone;
