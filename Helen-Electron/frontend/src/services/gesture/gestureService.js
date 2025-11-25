/**
 * GESTURE SERVICE - Updated for Electron Backend + MediaPipe
 * 
 * Service for gesture detection using MediaPipe + Electron Backend
 * Now uses Electron IPC instead of direct HTTP to EC2
 * Integrates with MediaPipe for hand landmark extraction
 * 
 * @module gestureService
 * @version 3.0.0
 */

import { electronBackend } from '../api/electronBackend';
import { mediaPipeService } from '../camera/mediaPipeService';

class GestureService {
    constructor() {
        // State
        this.videoElement = null;
        this.isActive = false;
        
        // Subscribers for notifications
        this.subscribers = [];
        
        console.log('GestureService initialized (Electron Backend)');
    }

    /**
     * Initialize the service with video element
     * @param {HTMLVideoElement} videoElement - Video element for MediaPipe
     */
    async initialize(videoElement) {
        console.log('Initializing GestureService...');
        
        this.videoElement = videoElement;
        this.isActive = true;
        
        // Initialize MediaPipe with callback for hand detection
        const success = await mediaPipeService.initialize(
            videoElement,
            (handsData) => this.handleHandsDetected(handsData)
        );
        
        if (!success) {
            console.error('Failed to initialize MediaPipe');
            this.isActive = false;
            return false;
        }
        
        // Start MediaPipe processing
        await mediaPipeService.start();
        
        console.log('GestureService ready with MediaPipe');
        return true;
    }

    /**
     * Handle hands detected by MediaPipe
     * Sends landmarks to Electron backend for prediction
     * @param {Object} handsData - Object with landmarks (126 values), numHands, etc.
     */
    async handleHandsDetected(handsData) {
        if (!this.isActive) return;

        // MediaPipe now returns:
        // {
        //   landmarks: [126 values],  // Always 126: left(63) + right(63)
        //   numHands: 0-2,
        //   hasLeftHand: boolean,
        //   hasRightHand: boolean,
        //   bothHands: boolean
        // }
        
        // Only send to backend if BOTH hands are detected
        if (!handsData.bothHands) {
            console.log(`Skipping frame: Only ${handsData.numHands}/2 hands detected`);
            return;
        }
        
        console.log(`Sending to prediction service: 2 hands detected`);
        
        // Send to Electron backend
        // Backend will validate and accumulate frames
        await this.detectGesture(handsData.landmarks);
    }

    /**
     * Send hand landmarks to backend for prediction
     * The Electron backend handles frame accumulation (40 frames)
     * @param {Array} landmarks - MediaPipe hand landmarks (21 points with x, y, z)
     * @returns {Promise<Object>} Prediction result
     */
    async detectGesture(landmarks) {
        if (!this.isActive) {
            console.warn('GestureService not active');
            return { success: false, error: 'Service not active' };
        }

        try {
            // Send landmarks to Electron backend
            // Backend will accumulate 40 frames before predicting
            const result = await electronBackend.prediction.addFrame(landmarks);
            
            if (result.success && result.data && result.data.predicted) {
                console.log(`Gesture detected: ${result.data.gesture} (${(result.data.confidence * 100).toFixed(1)}%)`);
                
                // Notify subscribers
                this.notifySubscribers({
                    gesture: result.data.gesture,
                    confidence: result.data.confidence,
                    probabilities: result.data.probabilities || {},
                    timestamp: Date.now(),
                    detected: true
                });
            }
            
            return result;
            
        } catch (error) {
            console.error('Error in gesture detection:', error);
            
            // Notify error to subscribers
            this.notifySubscribers({
                gesture: null,
                confidence: 0,
                error: error.message,
                timestamp: Date.now(),
                detected: false
            });
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Force a prediction with current buffer
     * @returns {Promise<Object>} Prediction result
     */
    async forcePrediction() {
        try {
            const result = await electronBackend.prediction.forcePrediction();
            
            if (result.success && result.data) {
                console.log(`Forced prediction: ${result.data.gesture}`);
                
                this.notifySubscribers({
                    gesture: result.data.gesture,
                    confidence: result.data.confidence,
                    probabilities: result.data.probabilities || {},
                    timestamp: Date.now(),
                    detected: true,
                    forced: true
                });
            }
            
            return result;
        } catch (error) {
            console.error('Error forcing prediction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get buffer status (how many frames accumulated)
     * @returns {Promise<Object>} Buffer status
     */
    async getBufferStatus() {
        try {
            const result = await electronBackend.prediction.getBufferStatus();
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Error getting buffer status:', error);
            return null;
        }
    }

    /**
     * Clear frame buffer
     * @returns {Promise<boolean>} Success status
     */
    async clearBuffer() {
        try {
            const result = await electronBackend.prediction.clearBuffer();
            return result.success;
        } catch (error) {
            console.error('Error clearing buffer:', error);
            return false;
        }
    }

    /**
     * Subscribe to gesture detection events
     * @param {Function} callback - Function to call when gesture detected
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.subscribers.push(callback);
        console.log(`New subscriber (total: ${this.subscribers.length})`);
        
        // Also subscribe to Electron backend state events
        const unsubscribeBackend = electronBackend.state.onPredictionAdded((prediction) => {
            if (prediction && prediction.gesture) {
                callback({
                    gesture: prediction.gesture,
                    confidence: prediction.confidence,
                    probabilities: prediction.probabilities || {},
                    timestamp: prediction.timestamp || Date.now(),
                    detected: true
                });
            }
        });
        
        // Return combined unsubscribe function
        return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
                this.subscribers.splice(index, 1);
                console.log(`Subscriber removed (total: ${this.subscribers.length})`);
            }
            unsubscribeBackend();
        };
    }

    /**
     * Notify all subscribers of a detection event
     * @param {Object} data - Detection data
     */
    notifySubscribers(data) {
        this.subscribers.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in subscriber:', error);
            }
        });
    }

    /**
     * Get prediction history
     * @param {number} limit - Number of predictions to retrieve
     * @returns {Promise<Array>} Prediction history
     */
    async getHistory(limit = 10) {
        try {
            const result = await electronBackend.prediction.getHistory(limit);
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error getting history:', error);
            return [];
        }
    }

    /**
     * Get prediction statistics
     * @returns {Promise<Object>} Statistics
     */
    async getStats() {
        try {
            const result = await electronBackend.prediction.getStats();
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Error getting stats:', error);
            return null;
        }
    }

    /**
     * Stop the service and cleanup
     */
    async cleanup() {
        console.log('Cleaning up GestureService...');
        
        this.isActive = false;
        this.subscribers = [];
        this.videoElement = null;
        
        // Cleanup MediaPipe
        await mediaPipeService.cleanup();
        
        console.log('GestureService cleaned up');
    }
}

// Export singleton instance
export const gestureService = new GestureService();
export default gestureService;