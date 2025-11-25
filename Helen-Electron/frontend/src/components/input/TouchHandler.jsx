import React, { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../../contexts/camera/cameraHooks';
import { SIGN_GESTURES, ROUTES } from '../../config/constants';

/**
 * Touch Handler
 * Touch interactions are ALWAYS available
 * Camera gestures are processed independently when camera is active
 * Backend can send hand sign to deactivate camera
 */
export const TouchHandler = ({ children }) => {
    const navigate = useNavigate();
    const { isCameraActive, subscribeToCameraEvents, handleSignDetection } = useCamera();

    const handleGesture = useCallback((gesture) => {
        // Map gestures to actions
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
            console.log('Unknown gesture:', gesture);
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