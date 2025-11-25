import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CAMERA_CONFIG } from '../config/constants';
import { cameraService } from '../services/cameraService';
import { CameraStateContext, CameraActionsContext } from './cameraContexts';

/**
 * CameraProvider Component
 *
 * Clean version - Pure JavaScript (no Tauri invoke)
 * - Uses cameraService for all operations
 * - Captures frames from the browser
 * - Sends frames to EC2 for gesture detection
 */

export const CameraProvider = ({ children }) => {
    // Basic camera states
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [lastDetection, setLastDetection] = useState(null);
    const [error, setError] = useState(null);
    const [cameraMode, setCameraMode] = useState('touch'); // 'gesture' or 'touch'

    const detectionCooldownRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isCameraActive) {
                cameraService.stop();
            }
        };
    }, [isCameraActive]);

    /**
     * Start the camera - Pure JavaScript
     */
    const startCamera = useCallback(async () => {
        try {
            // Log camera start
            console.log('Starting camera...');
            setError(null);
            
            // Usar cameraService (JavaScript)
            const success = await cameraService.start();

            if (success) {
                setIsCameraActive(true);
                console.log('Camera started successfully');
            } else {
                setError('Failed to start the camera');
                // Log error if camera fails to start
                console.error('Error starting camera');
            }
        } catch (err) {
            // Log error if exception occurs during camera start
            console.error('Error in startCamera:', err);
            setError('Error starting camera: ' + err.message);
        }
    }, []);

    /**
     * Stop the camera
     */
    const stopCamera = useCallback(async () => {
        try {
            // Log camera stop
            console.log('Stopping camera...');
            
            await cameraService.stop();
            
            setIsCameraActive(false);
            setIsDetecting(false);
            setLastDetection(null);
            
            console.log('Camera stopped successfully');
        } catch (err) {
            // Log error if exception occurs during camera stop
            console.error('Error in stopCamera:', err);
            setError('Error stopping camera: ' + err.message);
        }
    }, []);

    /**
     * Toggle the camera (on/off)
     */
    const toggleCamera = useCallback(async () => {
        // Log camera toggle
        console.log('Toggling camera...');
        
        if (isCameraActive) {
            await stopCamera();
            setCameraMode('touch');
        } else {
            await startCamera();
            setCameraMode('gesture');
        }
    }, [isCameraActive, startCamera, stopCamera]);

    /**
     * Handle lock screen - disables camera for security
     */
    const handleLockScreen = useCallback(async () => {
        // Log lock screen event
        console.log('Locking screen - disabling camera');
        if (isCameraActive) {
            await stopCamera();
        }
        // Keep the mode preference, just stop the camera
    }, [isCameraActive, stopCamera]);

    /**
     * Handle unlock screen - restores camera state based on mode
     */
    const handleUnlockScreen = useCallback(async () => {
        // Log unlock screen event
        console.log('Unlocking screen - restoring camera state');
        if (cameraMode === 'gesture' && !isCameraActive) {
            await startCamera();
        }
    }, [cameraMode, isCameraActive, startCamera]);

    /**
     * Handle gesture detection (with cooldown)
     */
    const handleSignDetection = useCallback((gesture) => {
        // Prevent detection spamming
        if (detectionCooldownRef.current) {
            console.log('Cooldown active, ignoring detection');
            return;
        }

        // Log detected gesture
        console.log(`Gesture detected: ${gesture}`);

        setIsDetecting(true);
        setLastDetection({ gesture, timestamp: Date.now() });

        // Visual feedback (1 second)
        setTimeout(() => {
            setIsDetecting(false);
        }, CAMERA_CONFIG.FEEDBACK_DURATION);

        // Cooldown (2 seconds)
        detectionCooldownRef.current = setTimeout(() => {
            detectionCooldownRef.current = null;
        }, CAMERA_CONFIG.DETECTION_COOLDOWN);
    }, []);

    /**
     * Subscribe to camera detection events
     */
    const subscribeToCameraEvents = useCallback((onDetection) => {
        // Log camera event subscription
        console.log('Subscribing to camera events');
        return cameraService.subscribe(onDetection);
    }, []);

    // Memoize camera actions
    const actions = useMemo(() => ({
        startCamera,
        stopCamera,
        toggleCamera,
        handleSignDetection,
        subscribeToCameraEvents,
        handleLockScreen,
        handleUnlockScreen,
    }), [startCamera, stopCamera, toggleCamera, handleSignDetection, subscribeToCameraEvents, handleLockScreen, handleUnlockScreen]);

    // Memoize camera state
    const state = useMemo(() => ({
        isCameraActive,
        isDetecting,
        lastDetection,
        error,
        cameraMode,
    }), [isCameraActive, isDetecting, lastDetection, error, cameraMode]);

    return (
        <CameraActionsContext.Provider value={actions}>
            <CameraStateContext.Provider value={state}>
                {children}
            </CameraStateContext.Provider>
        </CameraActionsContext.Provider>
    );
};