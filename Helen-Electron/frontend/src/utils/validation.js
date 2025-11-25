/**
 * Validation utility functions: centralized validation logic for consistent error handling
 */

/**
 * Validate alarm data
 * @param {Object} alarmData - Alarm object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAlarmData(alarmData) {
    const errors = [];
    
    if (!alarmData.time) {
        errors.push('Time is required');
    }
    
    if (alarmData.label && alarmData.label.length > 50) {
        errors.push('Label must be 50 characters or less');
    }
    
    if (alarmData.repeatDays && !Array.isArray(alarmData.repeatDays)) {
        errors.push('Repeat days must be an array');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate device data
 * @param {Object} deviceData - Device object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateDeviceData(deviceData) {
    const errors = [];
    
    if (!deviceData.name || deviceData.name.trim().length === 0) {
        errors.push('Device name is required');
    }
    
    if (deviceData.name && deviceData.name.length > 30) {
        errors.push('Device name must be 30 characters or less');
    }
    
    if (!deviceData.type) {
        errors.push('Device type is required');
    }
    
    if (!deviceData.location || deviceData.location.trim().length === 0) {
        errors.push('Location is required');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate landmarks data for gesture detection
 * @param {Array} landmarks - Landmarks array
 * @returns {{ valid: boolean, error: string }}
 */
export function validateLandmarks(landmarks) {
    if (!Array.isArray(landmarks)) {
        return { valid: false, error: 'Landmarks must be an array' };
    }
    
    if (landmarks.length !== 40) {
        return { valid: false, error: `Expected 40 frames, got ${landmarks.length}` };
    }
    
    for (let i = 0; i < landmarks.length; i++) {
        if (!Array.isArray(landmarks[i]) || landmarks[i].length !== 126) {
        return { valid: false, error: `Frame ${i} has invalid length (expected 126, got ${landmarks[i]?.length || 0})` };
        }
        
        if (!landmarks[i].every(val => typeof val === 'number' && !isNaN(val))) {
        return { valid: false, error: `Frame ${i} contains non-numeric values` };
        }
    }
    
    return { valid: true, error: null };
}
