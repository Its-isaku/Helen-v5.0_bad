/**
 * Prediction Service - WEB VERSION with WebSocket
 * BASED ON Electron predictionService.js
 */

import { websocketService } from './websocketService';

class PredictionService {
    constructor() {
        this.isProcessing = false;
        this.lastPrediction = null;
        this.listeners = [];
        this.bufferStatus = {
            framesCollected: 0,
            framesRequired: 40,
            ready: false
        };
        this.initialized = false;
        
        // Debounce: Prevent sending predictions too quickly (same as Electron)
        this.lastPredictionTime = 0;
        this.detectionIntervalMs = parseInt(import.meta.env.VITE_DETECTION_INTERVAL_MS) || 2000; // 2 seconds default
        
        // Frame throttle: Prevent sending too many frames to the server
        this.lastFrameSentTime = 0;
        this.frameThrottleMs = parseInt(import.meta.env.VITE_FRAME_DELAY_MS) || 50; // 50ms = 20 FPS (40 frames in 2 seconds)
        
        // Log PredictionService initialization with debounce and throttle settings
        console.log(`PredictionService initialized (debounce: ${this.detectionIntervalMs}ms, throttle: ${this.frameThrottleMs}ms)`);
    }

    /**
     * Initialize WebSocket (call at app startup)
     */
    initialize() {
        if (this.initialized) {
            // Warn if PredictionService is already initialized
            console.warn('PredictionService already initialized');
            return;
        }
        // Log WebSocket connection initialization
        console.log('Initializing WebSocket connection...');
        
        // Connect to WebSocket
        websocketService.connect();
        
        // Listen for events
        websocketService.on('connect', () => {
            // Log successful connection to prediction server
            console.log('Connected to prediction server');
        });

        websocketService.on('connection_established', (data) => {
            // Log when server is ready
            console.log('Server ready:', data);
        });

        websocketService.on('buffer_status', (data) => {
            // Only save status, do not log
            this.bufferStatus = data;
        });

        websocketService.on('prediction', (data) => {
            this.handlePrediction(data);
        });

        websocketService.on('error', (error) => {
            // Log WebSocket error
            console.error('WebSocket error:', error);
        });

        websocketService.on('disconnect', (reason) => {
            // Warn if WebSocket is disconnected
            console.warn('WebSocket disconnected:', reason);
        });
        
        this.initialized = true;
        // Log successful PredictionService initialization
        console.log('PredictionService initialized');
    }

    /**
     * Add frame to the server
     * Frame must be an array of 126 numbers [left_hand(63), right_hand(63)]
     */
    addFrame(landmarks) {
        // Auto-initialize if not already done
        if (!this.initialized) {
            this.initialize();
        }
        
        if (!Array.isArray(landmarks) || landmarks.length !== 126) {
            return false;
        }

        // Validate that all elements are numbers
        if (!landmarks.every(val => typeof val === 'number' && !isNaN(val))) {
            return false;
        }
        
        // Throttle: Only send frames every frameThrottleMs (like Electron's FRAME_DELAY_MS)
        const now = Date.now();
        const timeSinceLastFrame = now - this.lastFrameSentTime;
        
        if (timeSinceLastFrame < this.frameThrottleMs) {
            // Skip this frame - too soon
            return false;
        }
        
        // Update last frame sent time
        this.lastFrameSentTime = now;
        
        // Send to server via WebSocket
        const sent = websocketService.sendFrame(landmarks);
        
        return sent;
    }

    /**
     * Handle prediction received from the server
     */
    handlePrediction(data) {
        // Debounce check: Prevent processing predictions too quickly (like Electron)
        const now = Date.now();
        const timeSinceLastPrediction = now - this.lastPredictionTime;
        
        if (timeSinceLastPrediction < this.detectionIntervalMs) {
            // Skip - still in cooldown period
            return;
        }
        
        // Update last prediction time
        this.lastPredictionTime = now;
        
        // Log received prediction
        console.log(`Prediction: ${data.gesture} (${(data.confidence * 100).toFixed(1)}%)`);
        
        this.lastPrediction = {
            gesture: data.gesture,
            gesture_id: data.gesture_id,
            confidence: data.confidence,
            timestamp: now
        };

        // Notify all listeners
        this.notifyListeners(this.lastPrediction);
    }

    /**
     * Notify listeners
     */
    notifyListeners(prediction) {
        this.listeners.forEach(callback => {
            try {
                callback(prediction);
            } catch (error) {
                // Log error in prediction callback
                console.error('Error in prediction callback:', error);
            }
        });
    }

    /**
     * Subscribe to predictions
     * Returns a function to unsubscribe
     */
    subscribe(callback) {
        this.listeners.push(callback);
        
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Get last prediction
     */
    getLastPrediction() {
        return this.lastPrediction;
    }

    /**
     * Get buffer status
     */
    getBufferStatus() {
        return this.bufferStatus;
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            ...websocketService.getStatus(),
            bufferStatus: this.bufferStatus,
            lastPrediction: this.lastPrediction
        };
    }

    /**
     * Reconnect to the server
     */
    reconnect() {
        websocketService.reconnect();
    }

    /**
     * Disconnect from the server
     */
    disconnect() {
        websocketService.disconnect();
    }
}

// Singleton instance
export const predictionService = new PredictionService();
export default predictionService;