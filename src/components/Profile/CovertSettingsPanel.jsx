import { useState, useEffect } from 'react';
import { Shield, Lock, Smartphone, Zap, X } from 'lucide-react';
import { getCovertSettings, saveCovertSettings } from '../../services/covertService';
import toast from 'react-hot-toast';

const CovertSettingsPanel = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState(getCovertSettings());
    const [showPIN, setShowPIN] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSettings(getCovertSettings());
        }
    }, [isOpen]);

    const handleToggle = (key) => {
        const updated = { ...settings, [key]: !settings[key] };
        setSettings(updated);
        saveCovertSettings(updated);
        toast.success('Settings updated');
    };

    const handlePINChange = (e) => {
        const newPIN = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
        const updated = { ...settings, secretPIN: newPIN };
        setSettings(updated);
    };

    const handlePINSave = () => {
        if (settings.secretPIN.length < 4) {
            toast.error('PIN must be at least 4 digits');
            return;
        }
        saveCovertSettings(settings);
        toast.success('PIN updated successfully');
        setShowPIN(false);
    };

    const handleGestureTypeChange = (type) => {
        const updated = { ...settings, gestureType: type };
        setSettings(updated);
        saveCovertSettings(updated);
        toast.success('Gesture type updated');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Covert Mode Settings</h2>
                            <p className="text-purple-100 text-sm">Discreet SOS triggers</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Master Toggle */}
                    <div className="card border-2 border-purple-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Shield size={20} className="text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Enable Covert Mode</h3>
                                    <p className="text-xs text-gray-600">Allow secret SOS triggers</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.enabled}
                                    onChange={() => handleToggle('enabled')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">
                            When enabled, you can trigger SOS silently using calculator PIN or gestures
                        </p>
                    </div>

                    {/* Calculator PIN */}
                    <div className="card border border-gray-200">
                        <div className="flex items-start gap-3 mb-3">
                            <Lock size={20} className="text-blue-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">Calculator Secret PIN</h3>
                                <p className="text-xs text-gray-600 mb-3">
                                    Enter this PIN in calculator followed by "=" to trigger silent SOS
                                </p>
                                
                                {!showPIN ? (
                                    <button
                                        onClick={() => setShowPIN(true)}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        Change PIN (Current: {settings.secretPIN.replace(/./g, '•')})
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={settings.secretPIN}
                                            onChange={handlePINChange}
                                            placeholder="Enter 4-6 digit PIN"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg text-center tracking-widest"
                                            maxLength={6}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handlePINSave}
                                                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                            >
                                                Save PIN
                                            </button>
                                            <button
                                                onClick={() => setShowPIN(false)}
                                                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Gesture Trigger */}
                    <div className="card border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Smartphone size={20} className="text-green-600" />
                                <div>
                                    <h3 className="font-semibold text-gray-900">Gesture Trigger</h3>
                                    <p className="text-xs text-gray-600">Activate SOS with secret gesture</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.gestureEnabled}
                                    onChange={() => handleToggle('gestureEnabled')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>

                        {settings.gestureEnabled && (
                            <div className="mt-3 space-y-2">
                                <p className="text-xs text-gray-600 mb-2">Select gesture type:</p>
                                
                                <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="gestureType"
                                        checked={settings.gestureType === 'triple-tap'}
                                        onChange={() => handleGestureTypeChange('triple-tap')}
                                        className="text-green-600"
                                    />
                                    <span className="text-sm">Triple-tap anywhere (within 2 sec)</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="gestureType"
                                        checked={settings.gestureType === 'swipe-pattern'}
                                        onChange={() => handleGestureTypeChange('swipe-pattern')}
                                        className="text-green-600"
                                    />
                                    <span className="text-sm">Swipe left-right-left pattern</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="gestureType"
                                        checked={settings.gestureType === 'logo-taps'}
                                        onChange={() => handleGestureTypeChange('logo-taps')}
                                        className="text-green-600"
                                    />
                                    <span className="text-sm">5 rapid taps on logo</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Vibration Feedback */}
                    <div className="card border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Zap size={20} className="text-yellow-600" />
                                <div>
                                    <h3 className="font-semibold text-gray-900">Vibration Feedback</h3>
                                    <p className="text-xs text-gray-600">Subtle vibration on covert trigger</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.vibrationEnabled}
                                    onChange={() => handleToggle('vibrationEnabled')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                            </label>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2 text-sm">How it works:</h4>
                        <ul className="space-y-1 text-xs text-blue-800">
                            <li>• Open calculator mode and enter your secret PIN followed by "="</li>
                            <li>• Or use the enabled gesture anywhere in the app</li>
                            <li>• You'll see a 2-second cancellation window</li>
                            <li>• If not cancelled, SOS triggers silently</li>
                            <li>• All alerts sent discreetly without panic UI</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CovertSettingsPanel;
