/**
 * Validation Service - Centralized validation logic
 * Implements Single Responsibility Principle
 * Eliminates duplication across services
 */

class ValidationService {
    /**
     * Validate frame structure for predictions
     * @param {Array} landmarks - Landmarks array
     * @returns {{ valid: boolean, error: string }}
     */
    validateFrame(landmarks) {
        if (!Array.isArray(landmarks)) {
        return { valid: false, error: 'Frame must be an array' };
        }
        
        if (landmarks.length !== 126) {
        return { valid: false, error: `Frame has ${landmarks.length} values, expected 126` };
        }
        
        if (!landmarks.every(val => typeof val === 'number' && !isNaN(val))) {
        return { valid: false, error: 'Frame contains non-numeric values' };
        }
        
        return { valid: true, error: null };
    }

    /**
     * Validate landmarks sequence for prediction
     * @param {Array} sequence - Array of frames
     * @param {number} requiredFrames - Required number of frames
     * @returns {{ valid: boolean, error: string }}
     */
    validateLandmarksSequence(sequence, requiredFrames = 40) {
        if (!Array.isArray(sequence)) {
        return { valid: false, error: 'Sequence must be an array' };
        }
        
        if (sequence.length !== requiredFrames) {
        return { valid: false, error: `Expected ${requiredFrames} frames, got ${sequence.length}` };
        }
        
        for (let i = 0; i < sequence.length; i++) {
        const frameValidation = this.validateFrame(sequence[i]);
        if (!frameValidation.valid) {
            return { valid: false, error: `Frame ${i}: ${frameValidation.error}` };
        }
        }
        
        return { valid: true, error: null };
    }

    /**
     * Count hands detected in landmarks
     * @param {Array} landmarks - Array of 126 numbers
     * @returns {number} Number of hands (0, 1, or 2)
     */
    countHands(landmarks) {
        if (!Array.isArray(landmarks) || landmarks.length !== 126) {
        return 0;
        }
        
        // Check if left hand has data (first 63 values)
        const leftHandHasData = landmarks.slice(0, 63).some(val => val !== 0);
        
        // Check if right hand has data (last 63 values)
        const rightHandHasData = landmarks.slice(63, 126).some(val => val !== 0);
        
        let count = 0;
        if (leftHandHasData) count++;
        if (rightHandHasData) count++;
        
        return count;
    }

    /**
     * Validate alarm data
     * @param {Object} alarmData - Alarm object
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateAlarmData(alarmData) {
        const errors = [];
        
        if (!alarmData.time) {
        errors.push('Alarm time is required');
        }
        
        if (alarmData.label && alarmData.label.length > 50) {
        errors.push('Label must be 50 characters or less');
        }
        
        if (alarmData.days && !Array.isArray(alarmData.days)) {
        errors.push('Days must be an array');
        }
        
        return {
        valid: errors.length === 0,
        errors
        };
    }

    /**
     * Validate gesture data
     * @param {Object} gestureData - Gesture object
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateGestureData(gestureData) {
        const errors = [];
        
        if (!gestureData.name || typeof gestureData.name !== 'string') {
        errors.push('Gesture name is required');
        }
        
        if (gestureData.name && gestureData.name.length > 30) {
        errors.push('Gesture name must be 30 characters or less');
        }
        
        return {
        valid: errors.length === 0,
        errors
        };
    }
}

// Export singleton
const validationService = new ValidationService();
module.exports = validationService;