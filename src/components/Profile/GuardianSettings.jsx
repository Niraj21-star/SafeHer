import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { guardiansAPI } from '../../services/api';
import { getLocationWithFallback } from '../../services/geolocation';
import toast from 'react-hot-toast';
import { CheckCircle, MapPin, ChevronLeft } from 'lucide-react';

const GuardianSettings = ({ onBack }) => {
    const { user, userProfile, updateProfile } = useAuth();
    const [isGuardian, setIsGuardian] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [lastLocation, setLastLocation] = useState(null);

    useEffect(() => {
        // Check if guardian doc exists by fetching nearby with zero radius (best-effort)
        // We'll rely on profile flag; if not present, default false
        setIsGuardian(!!userProfile?.guardianOptIn || !!userProfile?.isGuardian);
    }, [userProfile]);

    const handleRegister = async () => {
        setRegistering(true);
        try {
            const payload = {
                name: userProfile?.name || '',
                phone: userProfile?.phone || '',
                email: userProfile?.email || ''
            };
            await guardiansAPI.register(payload);
            await updateProfile({ isGuardian: true, guardianOptIn: true });
            setIsGuardian(true);
            toast.success('You are now registered as a guardian');
        } catch (error) {
            console.error('Guardian register error:', error);
            toast.error('Failed to register as guardian');
        } finally {
            setRegistering(false);
        }
    };

    const handleUpdateLocation = async () => {
        try {
            toast.loading('Getting your location...', { id: 'guardian-loc' });
            const loc = await getLocationWithFallback();
            toast.dismiss('guardian-loc');
            setLastLocation(loc);
            if (user?.uid) {
                await guardiansAPI.updateLocation(user.uid, { lat: loc.lat, lng: loc.lng });
            }
            toast.success('Location updated');
        } catch (error) {
            toast.dismiss('guardian-loc');
            console.error('Update guardian location error:', error);
            toast.error('Failed to update location');
        }
    };

    return (
        <div className="page-container pt-6">
            <div className="container">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Guardian Mode</h1>
                        <p className="text-sm text-gray-500">Opt in to receive nearby SOS alerts</p>
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
                            <CheckCircle />
                        </div>
                        <div>
                            <h2 className="font-semibold">Guardian Status</h2>
                            <p className="text-sm text-gray-600">{isGuardian ? 'You are registered as a guardian' : 'Not registered'}</p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {!isGuardian && (
                            <button onClick={handleRegister} className="btn btn-primary w-full" disabled={registering}>
                                {registering ? 'Registering...' : 'Register as Guardian'}
                            </button>
                        )}

                        {isGuardian && (
                            <>
                                <button onClick={handleUpdateLocation} className="btn btn-accent w-full">
                                    <MapPin />
                                    Update My Location
                                </button>
                                {lastLocation && (
                                    <p className="text-sm text-gray-500 mt-2">Last: {lastLocation.lat.toFixed(5)}, {lastLocation.lng.toFixed(5)}</p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <p className="text-xs text-gray-500">As a guardian you may receive SMS/email alerts when nearby users trigger SOS. You can respond to alerts in the app.</p>
            </div>
        </div>
    );
};

export default GuardianSettings;
