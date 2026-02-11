import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const user = auth.currentUser;
            if (user) {
                const token = await user.getIdToken();
                config.headers.Authorization = `Bearer ${token}`;
                console.debug('[api] Attaching auth token for user:', user.uid);
            } else {
                if (import.meta.env.DEV) {
                    const devUserId = import.meta.env.VITE_DEV_USER_ID || 'dev-user-001';
                    config.headers['x-dev-user-id'] = devUserId;
                    console.debug('[api] Dev auth bypass with x-dev-user-id:', devUserId);
                } else {
                    console.debug('[api] No firebase user present; sending unauthenticated request to', config.url);
                }
            }
        } catch (tokErr) {
            console.error('[api] Failed to get ID token', tokErr);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error
            const status = error.response.status;
            const data = error.response.data || {};
            const message = data?.message || data?.error || 'An error occurred';
            console.error(`API Error [${status}]:`, message);
            if (status === 401) console.warn('[api] Unauthorized - possibly missing/invalid Firebase ID token');
            
            // Attach user-friendly message
            error.userMessage = message;
        } else if (error.request) {
            // Request made but no response
            console.error('Network Error: No response from server', error.message);
            error.userMessage = 'Network error. Please check your connection and try again.';
        } else {
            console.error('Error:', error.message);
            error.userMessage = error.message || 'An unexpected error occurred';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
};

// User API
export const userAPI = {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (data) => api.put('/user/profile', data),
    updateEmergencyContacts: (contacts) => api.post('/user/emergency-contacts', { contacts }),
};

// SOS API
export const sosAPI = {
    trigger: (data) => api.post('/sos/trigger', data),
    getIncidents: (userId) => api.get(`/incidents/${userId}`),
    trackIncident: (incidentId) => api.get(`/incidents/track/${incidentId}`),
    resolveIncident: (incidentId) => api.post(`/incidents/${incidentId}/resolve`),
    updateLocation: (incidentId, location) => api.post(`/incidents/${incidentId}/location`, { location }),
};

// Incidents API
export const incidentsAPI = {
    completeRecovery: (incidentId) => api.post(`/incidents/${incidentId}/recovery`),
    getEvidence: (incidentId) => api.get(`/incidents/${incidentId}/evidence`),
    downloadEvidence: (incidentId) => api.get(`/incidents/${incidentId}/evidence/download`, {
        responseType: 'text'
    }),
};

// Legal API
export const legalAPI = {
    chat: (data) => api.post('/legal/chat', data),
    getChatHistory: (chatId) => api.get(`/legal/chat/${chatId}`),
    generateFIR: (data) => api.post('/legal/generate-fir', data),
};

// Guardians API
export const guardiansAPI = {
    register: (data) => api.post('/guardians/register', data),
    updateLocation: (userId, location) => api.post(`/guardians/${userId}/location`, { location }),
    nearby: (params) => api.get('/guardians/nearby', { params }),
    respond: (userId, body) => api.post(`/guardians/${userId}/respond`, body),
    getAlerts: (userId) => api.get(`/guardians/${userId}/alerts`),
};

// Danger Zones API
export const dangerZonesAPI = {
    reportZone: (data) => api.post('/danger-zones/report', data),
    getZones: (params) => api.get('/danger-zones', { params }),
    getZoneDetails: (zoneId) => api.get(`/danger-zones/${zoneId}`),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
