import React, { createContext, useState, useCallback, useEffect } from 'react';
import alarmAudioService from '../../services/audio/alarmAudioService';

/**
 * AlarmNotificationContext
 * Provides global alarm notification state and functionality
 * Allows alarm notifications to appear across all screens
 */
export const AlarmNotificationContext = createContext(null);

/**
 * AlarmNotificationProvider
 * Manages global alarm notification state and event listeners
 * 
 * Architecture:
 * - Listens to Electron backend alarm events
 * - Manages alarm notification modal state
 * - Controls alarm audio playback
 * - Works independently of current screen/route
 */
export const AlarmNotificationProvider = ({ children }) => {
    const [triggeredAlarm, setTriggeredAlarm] = useState(null);
    const [isAlarmNotificationOpen, setIsAlarmNotificationOpen] = useState(false);

    // Global alarm listener - works across all screens
    useEffect(() => {
        // Check if running in Electron
        if (typeof window === 'undefined' || !window.electronBackend) {
            console.warn('Alarm notifications: Not in Electron environment');
            return;
        }

        const handleAlarmTriggered = (alarm) => {
            console.log('Alarm triggered:', alarm.label);
            
            // Play alarm sound
            alarmAudioService.playAlarmSound();

            // Show alarm notification modal
            setTriggeredAlarm(alarm);
            setIsAlarmNotificationOpen(true);
        };
        
        // Subscribe to alarm triggered events
        try {
            const cleanup = window.electronBackend.on('alarm:triggered', handleAlarmTriggered);
            
            return () => {
                if (cleanup && typeof cleanup === 'function') {
                    cleanup();
                }
                alarmAudioService.stopAlarmSound();
            };
        } catch (error) {
            console.error('Error setting up alarm listener:', error);
        }
    }, []); // Empty deps - run only once on mount

    /**
     * Dismiss the current alarm notification
     * Stops audio and closes the modal
     */
    const dismissAlarm = useCallback(() => {
        // Stop the sound
        alarmAudioService.stopAlarmSound();
        
        // Close the notification modal
        setIsAlarmNotificationOpen(false);
        setTriggeredAlarm(null);
    }, []);

    const value = {
        triggeredAlarm,
        isAlarmNotificationOpen,
        dismissAlarm
    };

    return (
        <AlarmNotificationContext.Provider value={value}>
            {children}
        </AlarmNotificationContext.Provider>
    );
};
