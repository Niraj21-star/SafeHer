// Covert SOS Service
// Handles secret triggers: PIN codes, gestures, silent activation

const STORAGE_KEY = 'safeher_covert_settings';
const DEFAULT_PIN = '1122';
const GESTURE_TIMEOUT = 2000; // 2 seconds for gesture completion
const CANCELLATION_WINDOW = 2000; // 2 second cancellation window

// Default covert settings
const DEFAULT_SETTINGS = {
    enabled: true,
    secretPIN: DEFAULT_PIN,
    gestureEnabled: true,
    gestureType: 'triple-tap', // 'triple-tap', 'swipe-pattern', 'logo-taps'
    vibrationEnabled: true,
};

/**
 * Get covert settings from localStorage
 */
export const getCovertSettings = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('[CovertService] Error reading settings:', error);
    }
    return DEFAULT_SETTINGS;
};

/**
 * Save covert settings to localStorage
 */
export const saveCovertSettings = (settings) => {
    try {
        const current = getCovertSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch (error) {
        console.error('[CovertService] Error saving settings:', error);
        return getCovertSettings();
    }
};

/**
 * Validate secret PIN
 * @param {string} input - User input string
 * @returns {boolean} - True if PIN matches
 */
export const validateSecretPIN = (input) => {
    const settings = getCovertSettings();
    if (!settings.enabled) return false;
    
    const cleanInput = input.replace(/[^0-9]/g, '');
    const cleanPIN = settings.secretPIN.replace(/[^0-9]/g, '');
    
    return cleanInput === cleanPIN;
};

/**
 * Trigger device vibration (if supported)
 * @param {number} duration - Vibration duration in ms
 */
export const triggerVibration = (duration = 200) => {
    const settings = getCovertSettings();
    if (!settings.vibrationEnabled) return;
    
    try {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    } catch (error) {
        console.warn('[CovertService] Vibration not supported:', error);
    }
};

/**
 * Gesture detector class for triple-tap
 */
export class TripleTapDetector {
    constructor(onTripleTap, timeout = GESTURE_TIMEOUT) {
        this.taps = [];
        this.timeout = timeout;
        this.onTripleTap = onTripleTap;
        this.handleTap = this.handleTap.bind(this);
    }

    handleTap(event) {
        const now = Date.now();
        
        // Remove old taps outside timeout window
        this.taps = this.taps.filter(time => now - time < this.timeout);
        
        // Add new tap
        this.taps.push(now);
        
        // Check if we have 3 taps
        if (this.taps.length >= 3) {
            this.taps = []; // Reset
            if (this.onTripleTap) {
                this.onTripleTap();
            }
        }
    }

    attach() {
        document.addEventListener('click', this.handleTap);
    }

    detach() {
        document.removeEventListener('click', this.handleTap);
        this.taps = [];
    }
}

/**
 * Gesture detector for swipe pattern (left-right-left)
 */
export class SwipePatternDetector {
    constructor(onPattern, timeout = GESTURE_TIMEOUT) {
        this.swipes = [];
        this.timeout = timeout;
        this.onPattern = onPattern;
        this.startX = null;
        this.startY = null;
        
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }

    handleTouchStart(event) {
        const touch = event.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;
    }

    handleTouchEnd(event) {
        if (!this.startX || !this.startY) return;
        
        const touch = event.changedTouches[0];
        const endX = touch.clientX;
        const endY = touch.clientY;
        
        const deltaX = endX - this.startX;
        const deltaY = endY - this.startY;
        
        // Ignore if vertical swipe
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            this.startX = null;
            this.startY = null;
            return;
        }
        
        const now = Date.now();
        const direction = deltaX > 0 ? 'right' : 'left';
        
        // Remove old swipes
        this.swipes = this.swipes.filter(s => now - s.time < this.timeout);
        
        // Add new swipe
        this.swipes.push({ direction, time: now });
        
        // Check for left-right-left pattern
        if (this.swipes.length >= 3) {
            const last3 = this.swipes.slice(-3);
            if (last3[0].direction === 'left' && 
                last3[1].direction === 'right' && 
                last3[2].direction === 'left') {
                this.swipes = [];
                if (this.onPattern) {
                    this.onPattern();
                }
            }
        }
        
        this.startX = null;
        this.startY = null;
    }

    attach() {
        document.addEventListener('touchstart', this.handleTouchStart, { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }

    detach() {
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchend', this.handleTouchEnd);
        this.swipes = [];
    }
}

/**
 * Gesture detector for 5 rapid taps on specific element
 */
export class RapidTapDetector {
    constructor(elementSelector, onRapidTap, requiredTaps = 5, timeout = GESTURE_TIMEOUT) {
        this.elementSelector = elementSelector;
        this.taps = [];
        this.requiredTaps = requiredTaps;
        this.timeout = timeout;
        this.onRapidTap = onRapidTap;
        this.handleTap = this.handleTap.bind(this);
    }

    handleTap(event) {
        const target = event.target.closest(this.elementSelector);
        if (!target) return;
        
        const now = Date.now();
        
        // Remove old taps
        this.taps = this.taps.filter(time => now - time < this.timeout);
        
        // Add new tap
        this.taps.push(now);
        
        // Check if we have enough taps
        if (this.taps.length >= this.requiredTaps) {
            this.taps = [];
            if (this.onRapidTap) {
                this.onRapidTap();
            }
        }
    }

    attach() {
        document.addEventListener('click', this.handleTap);
    }

    detach() {
        document.removeEventListener('click', this.handleTap);
        this.taps = [];
    }
}

/**
 * Show cancellation toast
 * @param {Function} onCancel - Callback if user cancels
 * @returns {Function} - Cleanup function
 */
export const showCancellationToast = (onCancel) => {
    let cancelled = false;
    
    const toast = document.createElement('div');
    toast.className = 'covert-cancel-toast';
    toast.innerHTML = `
        <div style="
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            cursor: pointer;
            animation: slideUp 0.3s ease-out;
        ">
            🔒 Safe mode activated. Tap to cancel.
        </div>
    `;
    
    const handleClick = () => {
        cancelled = true;
        if (onCancel) onCancel();
        cleanup();
    };
    
    const cleanup = () => {
        if (toast && toast.parentNode) {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
        toast.removeEventListener('click', handleClick);
    };
    
    toast.addEventListener('click', handleClick);
    document.body.appendChild(toast);
    
    // Auto-dismiss after cancellation window
    const timer = setTimeout(() => {
        if (!cancelled) {
            cleanup();
        }
    }, CANCELLATION_WINDOW);
    
    return () => {
        clearTimeout(timer);
        cleanup();
    };
};

/**
 * Log covert trigger in demo mode
 */
export const logCovertTrigger = (triggerType) => {
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
    if (isDemoMode) {
        console.log(`[DEMO] Covert SOS Triggered via: ${triggerType}`);
    }
};

/**
 * Silent SOS trigger with cancellation window
 * @param {Function} triggerCallback - The actual SOS trigger function
 * @param {string} triggerType - Type of trigger ('PIN', 'gesture', 'calculator')
 * @returns {Promise} - Resolves when confirmed or cancelled
 */
export const triggerSilentSOS = async (triggerCallback, triggerType = 'unknown') => {
    return new Promise((resolve, reject) => {
        const settings = getCovertSettings();
        
        if (!settings.enabled) {
            reject(new Error('Covert mode disabled'));
            return;
        }
        
        logCovertTrigger(triggerType);
        triggerVibration(200);
        
        let executed = false;
        
        const cleanup = showCancellationToast(() => {
            executed = true;
            console.log('[CovertService] Silent SOS cancelled by user');
            reject(new Error('Cancelled'));
        });
        
        // Wait for cancellation window
        setTimeout(async () => {
            cleanup();
            
            if (!executed) {
                executed = true;
                try {
                    console.log('[CovertService] Executing silent SOS');
                    await triggerCallback();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }
        }, CANCELLATION_WINDOW);
    });
};

export default {
    getCovertSettings,
    saveCovertSettings,
    validateSecretPIN,
    triggerVibration,
    TripleTapDetector,
    SwipePatternDetector,
    RapidTapDetector,
    showCancellationToast,
    logCovertTrigger,
    triggerSilentSOS,
};
