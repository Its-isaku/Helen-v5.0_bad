import { API_CONFIG } from '../config/constants';
import { mediaPipeService } from './mediaPipeService';
import { predictionService } from './predictionService';
/**
 * Camera Service: handles camera stream management
 * Uses MediaPipe for hand detection
 */

class CameraService {
    constructor() {
        this.isActive = false;
        this.stream = null;
        this.videoElement = null;
        
        // Log CameraService initialization
        console.log('CameraService initialized');
    }

    /**
     * Start camera stream with gesture detection
     */
    async start(videoElement = null) {
        try {
            // Log camera start
            console.log('Starting camera...');
            
            if (videoElement) {
                this.videoElement = videoElement;
                // Log use of provided video element
                console.log('Using provided video element');
            } else {
                this.videoElement = document.createElement('video');
                this.videoElement.style.display = 'none';
                document.body.appendChild(this.videoElement);
                // Log creation of hidden video element
                console.log('Created hidden video element');
            }
            
            // Log camera access request
            console.log('Requesting camera access...');
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();
            // Log video stream playing
            console.log('Video stream playing');
            
            // Initialize MediaPipe with callback
            // Log MediaPipe initialization
            console.log('Initializing MediaPipe...');
            const initialized = await mediaPipeService.initialize(
                this.videoElement,
                (results) => this.handleDetection(results)
            );
            
            if (initialized) {
                await mediaPipeService.start();
                // Log successful MediaPipe start
                console.log('MediaPipe started successfully');
            } else {
                // Log MediaPipe initialization failure
                console.error('Failed to initialize MediaPipe');
            }
            
            this.isActive = true;
            // Log successful camera start
            console.log('Camera started successfully');
            
            return this.stream;
            
        } catch (error) {
            // Log error if camera fails to start
            console.error('Error starting camera:', error);
            this.isActive = false;
            throw error;
        }
    }

    /**
     * Handle detection results from MediaPipe
     */
    handleDetection(results) {
        // Only send if BOTH hands detected
        if (results.landmarks && results.landmarks.length === 126 && results.bothHands) {
            predictionService.addFrame(results.landmarks);
        }
        // Do not notify raw MediaPipe events
        // Predictions are notified via predictionService.subscribe()
    }

    /**
     * Stop camera stream
     */
    async stop() {
        try {
            // Log camera stop
            console.log('Stopping camera...');
            
            await mediaPipeService.cleanup();
            
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            if (this.videoElement && !this.videoElement.parentElement) {
                this.videoElement.remove();
            }
            this.videoElement = null;
            
            this.isActive = false;
            // Log successful camera stop
            console.log('Camera stopped');
            
            return true;
            
        } catch (error) {
            // Log error if camera fails to stop
            console.error('Error stopping camera:', error);
            return false;
        }
    }

    /**
     * Subscribe to detection events
     */
    subscribe(callback) {
        // Log camera detection event subscription
        console.log('Subscribing to camera detection events');
        
        // Instead of subscribing to raw MediaPipe events,
        // subscribe to predictions from predictionService
        return predictionService.subscribe(callback);
    }

    /**
     * Get current status
     */
    async getStatus() {
        return {
            active: this.isActive,
            hasStream: !!this.stream,
        };
    }

    /**
     * Get available devices
     */
    async getDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            // Log error if device enumeration fails
            console.error('Error enumerating devices:', error);
            return [];
        }
    }
}

export const cameraService = new CameraService();
export default cameraService;