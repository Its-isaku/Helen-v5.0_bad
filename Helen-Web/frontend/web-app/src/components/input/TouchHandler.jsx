import React, { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../../contexts/cameraHooks';
import { SIGN_GESTURES, ROUTES } from '../../config/constants';

/**
 * TouchHandler Component
 *
 * Handles touch interactions, which are always available regardless of camera state.
 * Camera gestures are processed independently when the camera is active.
 * The backend can send a hand sign to deactivate the camera.
 */
export const TouchHandler = ({ children }) => {
    const navigate = useNavigate();
    const { isCameraActive, subscribeToCameraEvents, handleSignDetection } = useCamera();

    const handleGesture = useCallback((gesture) => {
        // Map recognized gestures to corresponding navigation actions
        switch (gesture) {
        case SIGN_GESTURES.INICIO:
            navigate(ROUTES.HOME);
            break;
        case SIGN_GESTURES.ALARMA:
            navigate(ROUTES.ALARMS);
            break;
        case SIGN_GESTURES.CLIMA:
            navigate(ROUTES.WEATHER);
            break;
        case SIGN_GESTURES.DISPOSITIVOS:
            navigate(ROUTES.DEVICES);
            break;
        case SIGN_GESTURES.CONFIGURACION:
            navigate(ROUTES.SETTINGS);
            break;
        default:
            // Log unrecognized gestures for debugging purposes
            console.log('Unrecognized gesture received:', gesture);
        }
    }, [navigate]);

    // Keep a stable reference to avoid re-subscribing
    const handleGestureRef = useRef(handleGesture);
    useEffect(() => {
        handleGestureRef.current = handleGesture;
    }, [handleGesture]);

    useEffect(() => {
        if (!isCameraActive) return;

        let unsubscribe = null;

        // Subscribe to camera events only when camera is active
        const subscribe = async () => {
            unsubscribe = await subscribeToCameraEvents((detection) => {
                handleSignDetection(detection.gesture);
                handleGestureRef.current(detection.gesture);
            });
        };

        subscribe();

        return () => {
            if (unsubscribe && typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [isCameraActive, subscribeToCameraEvents, handleSignDetection]);

    return <>{children}</>;
};