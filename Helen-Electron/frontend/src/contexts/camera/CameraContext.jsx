import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CAMERA_CONFIG } from '../../config/constants';
import { cameraService } from '../../services/camera/cameraService';
import { CameraStateContext, CameraActionsContext } from './cameraContexts';

/**
 * Camera Provider Component
 * CLEAN VERSION - Pure JavaScript (no Tauri invoke)
 * - Uses cameraService for everything
 * - Captures frames from browser
 * - Sends to EC2 for detection
 */

export const CameraProvider = ({ children }) => {
    // Basic states
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
     * Start camera - Pure JavaScript
     */
    const startCamera = useCallback(async () => {
        try {
            console.log('Starting camera...');
            setError(null);
            
            // Use cameraService (JavaScript)
            const success = await cameraService.start();

            if (success) {
                setIsCameraActive(true);
                console.log('Camera started');
            } else {
                setError('Could not start camera');
                console.error('Error starting camera');
            }
        } catch (err) {
            console.error('Error in startCamera:', err);
            setError('Error starting camera: ' + err.message);
        }
    }, []);

    /**
     * Stop camera
     */
    const stopCamera = useCallback(async () => {
        try {
            console.log('Stopping camera...');
            
            await cameraService.stop();
            
            setIsCameraActive(false);
            setIsDetecting(false);
            setLastDetection(null);
            
            console.log('Camera stopped');
        } catch (err) {
            console.error('Error in stopCamera:', err);
            setError('Error stopping camera: ' + err.message);
        }
    }, []);

    /**
     * Toggle camera (on/off)
     */
    const toggleCamera = useCallback(async () => {
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
     * Handle lock screen - disable camera for security
     */
    const handleLockScreen = useCallback(async () => {
        console.log('Locking screen - disabling camera');
        if (isCameraActive) {
            await stopCamera();
        }
        // Keep the mode preference, just stop the camera
    }, [isCameraActive, stopCamera]);

    /**
     * Handle unlock screen - restore camera state based on mode
     */
    const handleUnlockScreen = useCallback(async () => {
        console.log('Unlocking screen - restoring camera state');
        if (cameraMode === 'gesture' && !isCameraActive) {
            await startCamera();
        }
    }, [cameraMode, isCameraActive, startCamera]);

    /**
     * Handle gesture detection (with cooldown)
     */
    const handleSignDetection = useCallback((gesture) => {
        // Prevent spam
        if (detectionCooldownRef.current) {
            console.log('Cooldown active, ignoring detection');
            return;
        }

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
     * Subscribe to detection events
     */
    const subscribeToCameraEvents = useCallback((onDetection) => {
        console.log('Subscribing to camera events');
        return cameraService.subscribe(onDetection);
    }, []);

    // Memoize actions
    const actions = useMemo(() => ({
        startCamera,
        stopCamera,
        toggleCamera,
        handleSignDetection,
        subscribeToCameraEvents,
        handleLockScreen,
        handleUnlockScreen,
    }), [startCamera, stopCamera, toggleCamera, handleSignDetection, subscribeToCameraEvents, handleLockScreen, handleUnlockScreen]);

    // Memoize state
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