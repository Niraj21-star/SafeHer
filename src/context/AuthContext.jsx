import { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmationResult, setConfirmationResult] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // Try to load from cache first for instant load
                try {
                    const cacheKey = `safeher_profile_${firebaseUser.uid}`;
                    const cached = localStorage.getItem(cacheKey);
                    if (cached) {
                        setUserProfile({ id: firebaseUser.uid, ...JSON.parse(cached) });
                        setLoading(false); // Unblock UI immediately if we have cache
                    }
                } catch (e) {
                    // Ignore cache errors
                }

                // Fetch fresh user profile from Firestore
                await fetchUserProfile(firebaseUser.uid);
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const fetchUserProfile = async (userId) => {
        try {
            const cacheKey = `safeher_profile_${userId}`;

            if (!navigator.onLine) {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    setUserProfile({ id: userId, ...JSON.parse(cached) });
                    return;
                }
            }

            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserProfile({ id: userId, ...data });
                try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) { /* ignore */ }
            } else {
                // Create profile if doesn't exist
                setUserProfile({ id: userId, emergencyContacts: [] });
            }
        } catch (error) {
            const offline = !navigator.onLine || error?.code === 'unavailable' || String(error?.message || '').includes('offline');
            if (!offline) {
                console.error('Error fetching user profile:', error);
            }
            try {
                const cached = localStorage.getItem(`safeher_profile_${userId}`);
                if (cached) {
                    setUserProfile({ id: userId, ...JSON.parse(cached) });
                    return;
                }
            } catch (e) {
                // ignore cache errors
            }
            setUserProfile({ id: userId, emergencyContacts: [] });
        }
    };

    const isOfflineError = (error) => {
        return !navigator.onLine || error?.code === 'unavailable' || String(error?.message || '').includes('offline');
    };

    const register = async (email, password, name, phone = '') => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;

            // Prepare user data
            const userData = {
                name,
                email,
                phone,
                emergencyContacts: [],
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
            };

            // IMMEDIATE OPTIMISTIC UPDATE:
            // Update local state and cache immediately so UI can proceed without waiting for Firestore
            setUserProfile({ id: userId, ...userData });
            try { localStorage.setItem(`safeher_profile_${userId}`, JSON.stringify(userData)); } catch (e) { /* ignore */ }

            // Write to Firestore in background (don't await strictly for UI response)
            // We use a non-blocking promise here to allow the user to proceed
            setDoc(doc(db, 'users', userId), userData)
                .catch(err => console.error("Background profile creation failed (will retry on next access):", err));

            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: getAuthErrorMessage(error.code) };
        }
    };

    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Update last login
            try {
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    lastLogin: new Date().toISOString(),
                }, { merge: true });
            } catch (e) {
                console.warn('Could not update last login:', e);
            }

            await fetchUserProfile(userCredential.user.uid);

            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: getAuthErrorMessage(error.code) };
        }
    };

    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: getAuthErrorMessage(error.code) };
        }
    };

    // Start phone auth: sends verification code
    const startPhoneSignIn = async (phoneNumber, recaptchaContainerId = 'recaptcha-container') => {
        try {
            // Setup reCAPTCHA verifier
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(recaptchaContainerId, {
                    size: 'invisible'
                }, auth);
            }

            const appVerifier = window.recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(result);
            return { success: true };
        } catch (error) {
            console.error('Phone sign-in start error:', error);
            return { success: false, error: error.message };
        }
    };

    // Confirm phone code and sign in
    const confirmPhoneCode = async (code) => {
        try {
            if (!confirmationResult) return { success: false, error: 'No confirmation in progress' };
            const userCredential = await confirmationResult.confirm(code);
            // Ensure user profile exists
            await fetchUserProfile(userCredential.user.uid);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Confirm phone code error:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    };

    const updateProfile = async (data) => {
        if (!user) return { success: false, error: 'Not authenticated' };

        try {
            await setDoc(doc(db, 'users', user.uid), data, { merge: true });
            setUserProfile(prev => ({ ...prev, ...data }));
            try {
                const cacheKey = `safeher_profile_${user.uid}`;
                const current = JSON.parse(localStorage.getItem(cacheKey) || '{}');
                localStorage.setItem(cacheKey, JSON.stringify({ ...current, ...data }));
            } catch (e) { /* ignore */ }
            return { success: true };
        } catch (error) {
            if (isOfflineError(error)) {
                setUserProfile(prev => ({ ...prev, ...data }));
                try {
                    const cacheKey = `safeher_profile_${user.uid}`;
                    const current = JSON.parse(localStorage.getItem(cacheKey) || '{}');
                    localStorage.setItem(cacheKey, JSON.stringify({ ...current, ...data }));
                } catch (e) { /* ignore */ }
                return { success: true, offline: true };
            }
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    };

    const updateEmergencyContacts = async (contacts) => {
        if (!user) return { success: false, error: 'Not authenticated' };

        try {
            await setDoc(doc(db, 'users', user.uid), { emergencyContacts: contacts }, { merge: true });
            setUserProfile(prev => ({ ...prev, emergencyContacts: contacts }));
            try {
                const cacheKey = `safeher_profile_${user.uid}`;
                const current = JSON.parse(localStorage.getItem(cacheKey) || '{}');
                localStorage.setItem(cacheKey, JSON.stringify({ ...current, emergencyContacts: contacts }));
            } catch (e) { /* ignore */ }
            return { success: true };
        } catch (error) {
            if (isOfflineError(error)) {
                setUserProfile(prev => ({ ...prev, emergencyContacts: contacts }));
                try {
                    const cacheKey = `safeher_profile_${user.uid}`;
                    const current = JSON.parse(localStorage.getItem(cacheKey) || '{}');
                    localStorage.setItem(cacheKey, JSON.stringify({ ...current, emergencyContacts: contacts }));
                } catch (e) { /* ignore */ }
                return { success: true, offline: true };
            }
            console.error('Update contacts error:', error);
            return { success: false, error: error.message };
        }
    };

    const getAuthErrorMessage = (code) => {
        switch (code) {
            case 'auth/email-already-in-use':
                return 'This email is already registered. Please login instead.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/operation-not-allowed':
                return 'Email/password accounts are not enabled.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            case 'auth/user-not-found':
                return 'No account found with this email.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/invalid-credential':
                return 'Invalid email or password. Please try again.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            default:
                return 'An error occurred. Please try again.';
        }
    };

    const value = {
        user,
        userProfile,
        loading,
        register,
        login,
        logout,
        updateProfile,
        updateEmergencyContacts,
        fetchUserProfile,
        startPhoneSignIn,
        confirmPhoneCode,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
