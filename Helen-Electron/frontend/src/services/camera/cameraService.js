import { API_CONFIG } from '../../config/constants';
import { gestureService } from '../gesture/gestureService';

/**
 * Camera Service: handles camera stream management
 * 
 * UPDATED (v4.0):
 * - Manages camera stream (getUserMedia)
 * - Initializes gestureService with video element
 * - Delegates hand detection to MediaPipe via gestureService
 */

class CameraService {
    constructor() {
        // State
        this.isActive = false;
        this.stream = null;
        this.videoElement = null;
        
        console.log('CameraService initialized');
    }

    /**
     * Start camera stream with gesture detection
     * @param {HTMLVideoElement} videoElement - Video element to use (optional)
     * @returns {Promise<MediaStream>} camera stream
     */
    async start(videoElement = null) {
        try {
            console.log('Starting camera...');
            
            // Get or create video element
            if (videoElement) {
                this.videoElement = videoElement;
                console.log('Using provided video element');
            } else {
                // Create hidden video element for processing
                this.videoElement = document.createElement('video');
                this.videoElement.style.display = 'none';
                document.body.appendChild(this.videoElement);
                console.log('Created hidden video element');
            }
            
            // Get camera stream
            console.log('Requesting camera access...');
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            
            // Attach stream to video element
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();
            console.log('Video stream playing');
            
            // Initialize gesture detection with MediaPipe
            console.log('Initializing gesture detection...');
            const gestureInitialized = await gestureService.initialize(this.videoElement);
            
            if (gestureInitialized) {
                console.log('Gesture detection initialized successfully');
            } else {
                console.error('Failed to initialize gesture detection');
            }
            
            this.isActive = true;
            console.log('Camera started successfully with gesture detection');
            
            return this.stream;
            
        } catch (error) {
            console.error('Error starting camera:', error);
            this.isActive = false;
            throw error;
        }
    }

    /**
     * Stop camera stream
     * @returns {Promise<boolean>} success status
     */
    async stop() {
        try {
            console.log('Stopping camera...');
            
            // Stop gesture detection
            await gestureService.cleanup();
            
            // Stop camera stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            // Cleanup video element if we created it
            if (this.videoElement && !this.videoElement.parentElement) {
                this.videoElement.remove();
            }
            this.videoElement = null;
            
            this.isActive = false;
            console.log('Camera stopped');
            
            return true;
            
        } catch (error) {
            console.error('Error stopping camera:', error);
            return false;
        }
    }

    /**
     * Get current camera status
     * @returns {Promise<Object>} camera status
     */
    async getStatus() {
        return {
            active: this.isActive,
            hasStream: !!this.stream,
        };
    }

    /**
     * Get available camera devices
     * @returns {Promise<Array>} list of camera devices
     */
    async getDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Error enumerating devices:', error);
            return [];
        }
    }

    /**
     * Switch to a different camera
     * @param {string} deviceId - camera device ID
     * @returns {Promise<MediaStream>} new camera stream
     */
    async switchCamera(deviceId) {
        try {
            // Stop current stream
            await this.stop();
            
            // Start with new device
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: deviceId },
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                }
            });
            
            this.isActive = true;
            console.log(`Switched to camera: ${deviceId}`);
            
            return this.stream;
            
        } catch (error) {
            console.error('Error switching camera:', error);
            throw error;
        }
    }

    /**
     * Subscribe to gesture detection events
     * Delegates to gestureService
     * @param {Function} callback - handler for detection events
     * @returns {Function} unsubscribe function
     */
    subscribe(callback) {
        return gestureService.subscribe(callback);
    }
}

export const cameraService = new CameraService();
export default cameraService;