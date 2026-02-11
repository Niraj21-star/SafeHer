import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import EmergencyContacts from './EmergencyContacts';
import GuardianSettings from './GuardianSettings';
import CovertSettingsPanel from './CovertSettingsPanel';
import {
    User,
    Mail,
    Phone,
    LogOut,
    Shield,
    Edit2,
    Check,
    X,
    ChevronRight,
    MapPin,
    Bell,
    HelpCircle,
    FileText,
    Lock,
    Calculator
} from 'lucide-react';
import toast from 'react-hot-toast';
import { guardiansAPI } from '../../services/api';
import { getLocationWithFallback } from '../../services/geolocation';

const UserProfile = () => {
    const { user, userProfile, logout, updateProfile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showContacts, setShowContacts] = useState(false);
    const [guardianLoading, setGuardianLoading] = useState(false);
    const [optIn, setOptIn] = useState(userProfile?.guardianOptIn || false);
    const [nearbyCount, setNearbyCount] = useState(null);
    const [showGuardian, setShowGuardian] = useState(false);
    const [showCovertSettings, setShowCovertSettings] = useState(false);
    const [formData, setFormData] = useState({
        name: userProfile?.name || '',
        phone: userProfile?.phone || '',
    });

    useEffect(() => {
        setOptIn(!!userProfile?.guardianOptIn || !!userProfile?.isGuardian);
    }, [userProfile]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Name is required');
            return;
        }

        setLoading(true);
        const result = await updateProfile(formData);
        setLoading(false);

        if (result.success) {
            toast.success('Profile updated successfully.');
            setEditing(false);
        } else {
            toast.error('Unable to update profile. Please try again.');
        }
    };

    const handleLogout = async () => {
        const confirmed = window.confirm('Are you sure you want to logout?');
        if (!confirmed) return;

        const result = await logout();
        if (!result.success) {
            toast.error('Failed to logout');
        }
    };

    if (showContacts) {
        return <EmergencyContacts onBack={() => setShowContacts(false)} />;
    }

    if (showGuardian) {
        return <GuardianSettings onBack={() => setShowGuardian(false)} />;
    }

    const contactsCount = userProfile?.emergencyContacts?.length || 0;

    return (
        <div className="page-container pt-6">
            <div className="container">
                {/* Header */}
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

                {/* Profile Card */}
                <div className="card mb-4 slide-up">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                {userProfile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </div>
                            <div>
                                {editing ? (
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="input py-1 px-2 text-lg font-semibold"
                                        placeholder="Your name"
                                    />
                                ) : (
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {userProfile?.name || 'User'}
                                    </h2>
                                )}
                                <p className="text-gray-500 text-sm flex items-center gap-1">
                                    <Mail size={14} />
                                    {user?.email}
                                </p>
                            </div>
                        </div>

                        {!editing ? (
                            <button
                                onClick={() => setEditing(true)}
                                className="p-2 rounded-lg hover:bg-gray-100"
                            >
                                <Edit2 size={18} className="text-gray-500" />
                            </button>
                        ) : (
                            <div className="flex gap-1">
                                <button
                                    onClick={() => {
                                        setEditing(false);
                                        setFormData({
                                            name: userProfile?.name || '',
                                            phone: userProfile?.phone || '',
                                        });
                                    }}
                                    className="p-2 rounded-lg hover:bg-gray-100"
                                    disabled={loading}
                                >
                                    <X size={18} className="text-gray-500" />
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="p-2 rounded-lg hover:bg-green-100"
                                    disabled={loading}
                                >
                                    <Check size={18} className="text-green-600" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Phone size={18} className="text-gray-400" />
                                {editing ? (
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="input py-1 px-2"
                                        placeholder="+91-XXXXXXXXXX"
                                    />
                                ) : (
                                    <span className="text-gray-700">
                                        {userProfile?.phone || 'Add phone number'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Emergency Contacts */}
                <button
                    onClick={() => setShowContacts(true)}
                    className="card w-full text-left mb-4 card-hover"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                                <Shield size={20} className="text-pink-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Emergency Contacts</h3>
                                <p className="text-sm text-gray-500">
                                    {contactsCount === 0
                                        ? 'Add contacts for SOS alerts'
                                        : `${contactsCount} contact${contactsCount > 1 ? 's' : ''} configured`
                                    }
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                </button>

                {/* Covert Settings */}
                <button
                    onClick={() => setShowCovertSettings(true)}
                    className="card flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer mb-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Calculator size={20} className="text-purple-600" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-900">Covert Mode</h3>
                            <p className="text-sm text-gray-500">Secret SOS triggers & calculator mode</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                </button>

                <div className="card mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <MapPin size={20} className="text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Guardian Mode</h3>
                                <p className="text-sm text-gray-500">Opt in to act as a nearby guardian for SOS alerts</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={optIn}
                                    onChange={async (e) => {
                                        const newVal = e.target.checked;
                                        setGuardianLoading(true);
                                        try {
                                            let location = null;
                                            try { location = await getLocationWithFallback(); } catch (locErr) { console.warn('Location not available for guardian:', locErr.message); }

                                            await guardiansAPI.register({
                                                name: userProfile?.name,
                                                phone: userProfile?.phone,
                                                email: user?.email,
                                                location,
                                                optIn: newVal,
                                            });

                                            await updateProfile({ guardianOptIn: newVal, isGuardian: newVal });

                                            setOptIn(newVal);
                                            toast.success(newVal ? 'You are now a guardian' : 'Guardian mode disabled');
                                        } catch (err) {
                                            console.error('Guardian toggle error:', err);
                                            toast.error('Failed to update guardian status');
                                        } finally { setGuardianLoading(false); }
                                    }}
                                />
                                <span className="slider" />
                            </label>
                        </div>
                    </div>

                    <div className="mt-3 text-sm text-gray-600">
                        <button
                            onClick={async () => {
                                setGuardianLoading(true);
                                try {
                                    const loc = await getLocationWithFallback();
                                    const resp = await guardiansAPI.nearby({ lat: loc.lat, lng: loc.lng, radius: 2000 });
                                    if (resp?.data?.guardians) {
                                        setNearbyCount(resp.data.guardians.length);
                                        toast.success(`Found ${resp.data.guardians.length} guardians nearby`);
                                    }
                                } catch (e) {
                                    console.error('Nearby guardians error:', e);
                                    toast.error('Failed to find nearby guardians');
                                } finally { setGuardianLoading(false); }
                            }}
                            className="btn btn-secondary text-sm"
                            disabled={guardianLoading}
                        >
                            Find Nearby Guardians
                        </button>
                        {nearbyCount !== null && (
                            <div className="mt-2 text-xs text-gray-500">{nearbyCount} guardians within 2 km</div>
                        )}
                    </div>
                </div>

                {/* Warning if no contacts */}
                {contactsCount < 2 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Bell size={16} className="text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-amber-800">Add Emergency Contacts</h4>
                                <p className="text-sm text-amber-700 mt-1">
                                    Add at least 2 emergency contacts to enable SOS alerts.
                                    These contacts will receive email notifications when you trigger an emergency.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Menu Items */}
                <div className="space-y-2 mb-6">
                    <a href="#" className="card flex items-center gap-3 card-hover">
                        <HelpCircle size={20} className="text-blue-600" />
                        <span className="text-gray-700">Help & Support</span>
                        <ChevronRight size={18} className="text-gray-400 ml-auto" />
                    </a>

                    <a href="#" className="card flex items-center gap-3 card-hover">
                        <FileText size={20} className="text-blue-600" />
                        <span className="text-gray-700">Privacy Policy</span>
                        <ChevronRight size={18} className="text-gray-400 ml-auto" />
                    </a>

                    <a href="#" className="card flex items-center gap-3 card-hover">
                        <Lock size={20} className="text-blue-600" />
                        <span className="text-gray-700">Terms of Service</span>
                        <ChevronRight size={18} className="text-gray-400 ml-auto" />
                    </a>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="btn btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>

                {/* App Version */}
                <p className="text-center text-gray-400 text-sm mt-6">
                    SafeHer MVP v1.0.0
                </p>
            </div>

            {/* Covert Settings Modal */}
            <CovertSettingsPanel 
                isOpen={showCovertSettings}
                onClose={() => setShowCovertSettings(false)}
            />
        </div>
    );
};

export default UserProfile;
