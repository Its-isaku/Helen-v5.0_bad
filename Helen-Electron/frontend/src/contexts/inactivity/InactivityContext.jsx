import React, { createContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCamera } from '../camera/cameraHooks';
import { ROUTES } from '../../config/constants';

/**
 * InactivityContext
 * Monitors user activity and locks the screen after 1 minute of inactivity
 * 
 * Inactivity is defined as:
 * - No gesture predictions sent to server for 1 minute
 * 
 * When inactive:
 * - Navigates to lock screen
 * - Turns off camera
 */
export const InactivityContext = createContext(null);

const INACTIVITY_TIMEOUT = 60000; // 1 minute in milliseconds

export const InactivityProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { handleLockScreen, cameraMode, toggleCamera } = useCamera();
    const inactivityTimerRef = useRef(null);
    const isLockScreenRef = useRef(false);
    const cameraModeRef = useRef(cameraMode);
    const toggleCameraRef = useRef(toggleCamera);

    // Keep refs in sync to avoid callback recreation
    useEffect(() => {
        cameraModeRef.current = cameraMode;
        toggleCameraRef.current = toggleCamera;
    }, [cameraMode, toggleCamera]);

    // Update lock screen status
    useEffect(() => {
        isLockScreenRef.current = location.pathname === ROUTES.LOCK;
    }, [location.pathname]);

    /**
     * Lock the screen due to inactivity
     * Optimized to prevent unnecessary recreations
     */
    const lockScreen = useCallback(async () => {
        console.log('Locking screen due to inactivity');
        
        // If camera is in gesture mode, turn it off
        if (cameraModeRef.current === 'gesture') {
            toggleCameraRef.current(); // This will switch to 'touch' mode
        }
        
        // Turn off camera
        await handleLockScreen();
        
        // Navigate to lock screen if not already there
        if (!isLockScreenRef.current) {
            navigate(ROUTES.LOCK);
        }
    }, [handleLockScreen, navigate]); // Reduced dependencies

    /**
     * Reset inactivity timer
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
     * Handle activity - called when user interacts (gesture OR touch)
     */
    const handleActivity = useCallback(() => {
        resetInactivityTimer();
    }, [resetInactivityTimer]);

    // Listen for ANY user interaction (gestures + touch/click)
    useEffect(() => {
        // Track touch/mouse interactions globally
        const handleUserInteraction = () => {
            if (!isLockScreenRef.current) {
                handleActivity();
            }
        };

        // Add event listeners for user interactions
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('touchstart', handleUserInteraction);
        document.addEventListener('keydown', handleUserInteraction);

        // Also listen for gesture predictions from Electron backend
        let unsubscribeGestures = null;
        if (typeof window !== 'undefined' && window.electronBackend) {
            unsubscribeGestures = window.electronBackend.on('prediction:result', (result) => {
                if (result && result.gesture) {
                    handleActivity();
                }
            });
        }

        // Start initial timer when component mounts (if not on lock screen)
        if (!isLockScreenRef.current) {
            resetInactivityTimer();
        }

        return () => {
            // Cleanup event listeners
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
            
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
            if (unsubscribeGestures && typeof unsubscribeGestures === 'function') {
                unsubscribeGestures();
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
