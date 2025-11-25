/**
 * MediaPipe Service: Hand landmark detection using MediaPipe Hands
 * Detects up to 2 hands and extracts 21 landmarks per hand with x, y, z coordinates
 */

import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

class MediaPipeService {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.isInitialized = false;
        this.onResultsCallback = null;
        
        // Log MediaPipeService initialization
        console.log('MediaPipeService initialized');
    }

    /**
     * Initialize MediaPipe Hands with video element
     * @param {HTMLVideoElement} videoElement - Video element to process
     * @param {Function} onResults - Callback for detection results
     */
    async initialize(videoElement, onResults) {
        if (this.isInitialized) {
        // Warn if MediaPipe is already initialized
        console.warn('MediaPipe already initialized');
        return true;
        }

        try {
        // Log MediaPipe Hands initialization
        console.log('Initializing MediaPipe Hands...');
        
        this.videoElement = videoElement;
        this.onResultsCallback = onResults;

        // Initialize MediaPipe Hands
        this.hands = new Hands({
            locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        // Configure for 2-hand detection - OPTIMIZED FOR ACCURACY
        this.hands.setOptions({
            maxNumHands: 2,              // Detect up to 2 hands
            modelComplexity: 1,          // 1=Full model (best balance: accurate & stable)
            minDetectionConfidence: 0.75, // High threshold = only detect when very confident
            minTrackingConfidence: 0.75,  // High threshold = smooth, stable tracking between frames
            selfieMode: false,           // ❌ NO selfie mode - match training setup
        });

        // Set results callback
        this.hands.onResults((results) => this.handleResults(results));

        // Initialize camera
        this.camera = new Camera(videoElement, {
            onFrame: async () => {
            if (this.hands && videoElement.readyState >= 2) {
                await this.hands.send({ image: videoElement });
            }
            },
            width: 640,
            height: 480,
        });

        this.isInitialized = true;
        // Log successful MediaPipe Hands initialization
        console.log('MediaPipe Hands initialized');
        
        return true;
        } catch (error) {
        // Log error if MediaPipe initialization fails
        console.error('Error initializing MediaPipe:', error);
        this.isInitialized = false;
        return false;
        }
    }

    /**
     * Start processing video frames
     */
    async start() {
        if (!this.isInitialized) {
        // Log error if MediaPipe is not initialized
        console.error('MediaPipe not initialized');
        return false;
        }

        try {
        await this.camera.start();
        // Log successful MediaPipe camera start
        console.log('MediaPipe camera started');
        return true;
        } catch (error) {
        // Log error if MediaPipe camera fails to start
        console.error('Error starting MediaPipe camera:', error);
        return false;
        }
    }

    /**
     * Stop processing video frames
     */
    async stop() {
        try {
        if (this.camera) {
            this.camera.stop();
        }
        // Log MediaPipe camera stop
        console.log('MediaPipe camera stopped');
        return true;
        } catch (error) {
        // Log error if MediaPipe camera fails to stop
        console.error('Error stopping MediaPipe camera:', error);
        return false;
        }
    }

    /**
     * Handle MediaPipe results
     * @param {Object} results - MediaPipe detection results
     */
    handleResults(results) {
        if (!this.onResultsCallback) return;

        // CRITICAL: Match training format EXACTLY (data_prep.py logic)
        // Training uses 126 features: [left_hand(63), right_hand(63)]
        // SelfieMode: FALSE (same as training)
        
        // Initialize with zeros (no hands detected)
        let leftHand = Array(63).fill(0);
        let rightHand = Array(63).fill(0);
        let numHands = 0;
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            numHands = results.multiHandLandmarks.length;
            
            // Process detected hands and assign to left/right
            // EXACTLY like data_prep.py:
            for (let i = 0; i < results.multiHandLandmarks.length && i < 2; i++) {
                const landmarks = results.multiHandLandmarks[i];
                
                // Validate landmarks exist
                if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
                    // Warn if invalid landmarks are detected
                    console.warn(`Invalid landmarks at index ${i}`);
                    continue;
                }
                
                // Flatten landmarks to [x1, y1, z1, x2, y2, z2, ...] (63 values)
                const flatLandmarks = [];
                for (const lm of landmarks) {
                    if (lm && typeof lm.x === 'number' && typeof lm.y === 'number' && typeof lm.z === 'number') {
                        flatLandmarks.push(lm.x, lm.y, lm.z);
                    } else {
                        // Warn if invalid landmark point is detected
                        console.warn('Invalid landmark point:', lm);
                        flatLandmarks.push(0, 0, 0); // Pad with zeros
                    }
                }
                
                //  Validate we have enough data
                if (flatLandmarks.length === 0) {
                    // Warn if no valid landmarks are extracted
                    console.warn(`No valid landmarks extracted at index ${i}`);
                    continue;
                }
                
                let assigned = false;
                
                // Method 1: Try handedness first (like data_prep.py)
                if (results.multiHandedness && 
                    results.multiHandedness[i] && 
                    results.multiHandedness[i].classification && 
                    results.multiHandedness[i].classification[0] &&
                    results.multiHandedness[i].classification[0].label) {
                    
                    const label = results.multiHandedness[i].classification[0].label.toLowerCase();
                    
                    if (label.includes('left')) {
                        leftHand = flatLandmarks;
                        assigned = true;
                    } else if (label.includes('right')) {
                        rightHand = flatLandmarks;
                        assigned = true;
                    }
                }
                
                // Method 2: If not assigned by handedness, use wrist X position
                // EXACTLY like data_prep.py: wrist_x < 0.5 → left, >= 0.5 → right
                if (!assigned && flatLandmarks.length > 0) {
                    const wristX = flatLandmarks[0]; // First value is wrist x
                    
                    if (wristX < 0.5) {
                        leftHand = flatLandmarks;
                    } else {
                        rightHand = flatLandmarks;
                    }
                }
            }
        }

        // Combine in same order as training: [left, right]
        const combinedLandmarks = [...leftHand, ...rightHand];
        
        // Validate length
        if (combinedLandmarks.length !== 126) {
            // Log error if landmarks length is invalid
            console.error(`Invalid landmarks length: ${combinedLandmarks.length}, expected 126`);
            return;
        }
        
        // Log detection results with hand positions
        const hasLeft = leftHand.some(v => v !== 0);
        const hasRight = rightHand.some(v => v !== 0);
        const bothHands = hasLeft && hasRight;
        
        // Different log based on hand count
        if (numHands === 2) {
            // Log when two hands are detected and ready for prediction
            console.log('2 hands detected - ready for prediction');
        }

        // Call callback with combined landmarks (always 126 values)
        this.onResultsCallback({
            landmarks: combinedLandmarks,  // Array of 126 numbers
            numHands: numHands,
            hasLeftHand: hasLeft,
            hasRightHand: hasRight,
            bothHands: bothHands  
        });
    }

    /**
     * Update configuration
     * @param {Object} options - MediaPipe options to update
     */
    updateOptions(options) {
        if (!this.hands) {
        console.error('❌ MediaPipe not initialized');
        return false;
        }

        try {
        this.hands.setOptions(options);
        // Log successful MediaPipe options update
        console.log('MediaPipe options updated:', options);
        return true;
        } catch (error) {
        // Log error if updating MediaPipe options fails
        console.error('Error updating MediaPipe options:', error);
        return false;
        }
    }

    /**
     * Reset and cleanup
     */
    async cleanup() {
        // Log MediaPipe cleanup
        console.log('Cleaning up MediaPipe...');
        
        await this.stop();
        
        if (this.hands) {
        this.hands.close();
        this.hands = null;
        }
        
        this.camera = null;
        this.videoElement = null;
        this.onResultsCallback = null;
        this.isInitialized = false;
        
        // Log successful MediaPipe cleanup
        console.log('MediaPipe cleaned up');
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
        isInitialized: this.isInitialized,
        hasCamera: !!this.camera,
        hasVideo: !!this.videoElement,
        };
    }
}

// Export singleton instance
export const mediaPipeService = new MediaPipeService();
export default mediaPipeService;
