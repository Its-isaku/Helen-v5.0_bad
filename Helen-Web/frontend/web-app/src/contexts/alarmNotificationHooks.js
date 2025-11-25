import { useContext } from 'react';
import { AlarmNotificationContext } from './AlarmNotificationContext';

/**
 * useAlarmNotification Hook
 * Provides access to alarm notification state and controls
 * 
 * @returns {Object} Alarm notification context
 * @returns {Object|null} triggeredAlarm - Current triggered alarm
 * @returns {boolean} isAlarmNotificationOpen - Whether notification modal is open
 * @returns {Function} dismissAlarm - Function to dismiss the current alarm
 * 
 * @throws {Error} If used outside of AlarmNotificationProvider
 * 
 * @example
 * const { triggeredAlarm, isAlarmNotificationOpen, dismissAlarm } = useAlarmNotification();
 * 
 * // In your component
 * <AlarmNotification
 *   isOpen={isAlarmNotificationOpen}
 *   alarm={triggeredAlarm}
 *   onDismiss={dismissAlarm}
 * />
 */
export const useAlarmNotification = () => {
    const context = useContext(AlarmNotificationContext);
    
    if (!context) {
        throw new Error('useAlarmNotification must be used within an AlarmNotificationProvider');
    }
    
    return context;
};
