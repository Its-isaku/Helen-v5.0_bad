import React, { createContext, useState, useCallback, useEffect } from 'react';
import alarmAudioService from '../services/alarmAudioService';
import { alarmService } from '../services/alarmService';

/**
 * AlarmNotificationContext
 * Provides global alarm notification state and functionality
 * Allows alarm notifications to appear across all screens
 */
// eslint-disable-next-line react-refresh/only-export-components
export const AlarmNotificationContext = createContext(null);

/**
 * AlarmNotificationProvider
 * Manages global alarm notification state and event listeners
 * 
 * Architecture:
 * - Listens to alarm service events (web version)
 * - Manages alarm notification modal state
 * - Controls alarm audio playback
 * - Works independently of current screen/route
 */
export const AlarmNotificationProvider = ({ children }) => {
    const [triggeredAlarm, setTriggeredAlarm] = useState(null);
    const [isAlarmNotificationOpen, setIsAlarmNotificationOpen] = useState(false);

    // Global alarm listener - works across all screens
    useEffect(() => {
        const handleAlarmTriggered = (alarm) => {
            // Play alarm sound
            alarmAudioService.playAlarmSound();

            // Show alarm notification modal
            setTriggeredAlarm(alarm);
            setIsAlarmNotificationOpen(true);
        };
        
        // Subscribe to alarm triggered events from alarmService
        alarmService.on('alarm:triggered', handleAlarmTriggered);
        
        return () => {
            alarmService.off('alarm:triggered', handleAlarmTriggered);
            alarmAudioService.stopAlarmSound();
        };
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
