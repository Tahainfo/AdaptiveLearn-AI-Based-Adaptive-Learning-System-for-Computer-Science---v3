/* Configuration */
const CONFIG = {
    API_BASE: window.location.origin,
    DEBUG: true
};

// Log helper
function log(...args) {
    if (CONFIG.DEBUG) {
        console.log('[AdaptiveLearn]', ...args);
    }
}
