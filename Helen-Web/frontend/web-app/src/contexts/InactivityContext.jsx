import React, { createContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCamera } from './cameraHooks';
import { ROUTES } from '../config/constants';

/**
 * InactivityContext
 *
 * Monitors user activity and locks the screen after 1 minute of inactivity.
 *
 * Inactivity is defined as:
 * - No gesture predictions sent to the server for 1 minute.
 *
 * When inactive:
 * - Navigates to the lock screen.
 * - Turns off the camera.
 */
export const InactivityContext = createContext(null);

const INACTIVITY_TIMEOUT = 60000; // 1 minute in milliseconds

export const InactivityProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { handleLockScreen, cameraMode, toggleCamera } = useCamera();
    const inactivityTimerRef = useRef(null);
    const isLockScreenRef = useRef(false);

    // Update lock screen status
    useEffect(() => {
        isLockScreenRef.current = location.pathname === ROUTES.LOCK;
    }, [location.pathname]);

    /**
     * Lock the screen due to inactivity.
     */
    const lockScreen = useCallback(async () => {
        // Log when the screen is locked due to inactivity
        console.log('Locking screen due to inactivity');
        
        // If camera is in gesture mode, turn it off
        if (cameraMode === 'gesture') {
            toggleCamera(); // This will switch to 'touch' mode
        }
        
        // Turn off camera
        await handleLockScreen();
        
        // Navigate to lock screen if not already there
        if (!isLockScreenRef.current) {
            navigate(ROUTES.LOCK);
        }
    }, [handleLockScreen, navigate, cameraMode, toggleCamera]);

    /**
     * Reset the inactivity timer.
     */
    const resetInactivityTimer = useCallback(() => {
        // Don't start timer on lock screen
        if (isLockScreenRef.current) {
            return;
        }

        // Clear existing timer
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        // Set new timer
        inactivityTimerRef.current = setTimeout(() => {
            lockScreen();
        }, INACTIVITY_TIMEOUT);
    }, [lockScreen]);

    /**
     * Handle user activity - called when a prediction is sent to the server.
     */
    const handleActivity = useCallback(() => {
        resetInactivityTimer();
    }, [resetInactivityTimer]);

    // Listen for prediction events from the Electron backend
    useEffect(() => {
        if (typeof window === 'undefined' || !window.electronBackend) {
            // Warn if not running in Electron environment
            console.warn('InactivityContext: Not in Electron environment');
            return;
        }

        // Subscribe to prediction results
        const unsubscribe = window.electronBackend.on('prediction:result', (result) => {
            if (result && result.gesture) {
                // Log when activity is detected from prediction event
                console.log('Activity detected (prediction sent)');
                handleActivity();
            }
        });

        // Start initial timer when component mounts (if not on lock screen)
        if (!isLockScreenRef.current) {
            resetInactivityTimer();
        }

        return () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
            if (unsubscribe && typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [handleActivity, resetInactivityTimer]);

    // Reset timer when leaving lock screen
    useEffect(() => {
        if (!isLockScreenRef.current) {
            resetInactivityTimer();
        } else {
            // Clear timer when on lock screen
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
        }
    }, [location.pathname, resetInactivityTimer]);

    const value = {
        handleActivity,
        resetInactivityTimer
    };

    return (
        <InactivityContext.Provider value={value}>
            {children}
        </InactivityContext.Provider>
    );
};
