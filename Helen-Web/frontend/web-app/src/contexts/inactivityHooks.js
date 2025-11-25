import { useContext } from 'react';
import { InactivityContext } from './InactivityContext';

/**
 * useInactivity Hook
 * Provides access to inactivity timer controls
 * 
 * @returns {Object} Inactivity context
 * @returns {Function} handleActivity - Reset inactivity timer
 * @returns {Function} resetInactivityTimer - Manually reset timer
 * 
 * @throws {Error} If used outside of InactivityProvider
 * 
 * @example
 * const { handleActivity } = useInactivity();
 * 
 * // Reset timer when user does something
 * handleActivity();
 */
export const useInactivity = () => {
    const context = useContext(InactivityContext);
    
    if (!context) {
        throw new Error('useInactivity must be used within an InactivityProvider');
    }
    
    return context;
};
