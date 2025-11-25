/**
 * Time utility functions
 * Handles time conversions between 12-hour and 24-hour formats
 * Eliminates duplication across alarm components
 */

/**
 * Convert 12-hour time object to 24-hour HH:MM string
 * @param {Object|string} time - { hour: 10, minute: 30, period: 'a.m.' } or "10:30"
 * @returns {string} - "10:30" or "22:30"
 */
export function convertTo24Hour(time) {
    if (typeof time === 'string') {
        return time; // Already in HH:MM format
    }
    
    let hour = time.hour;
    const minute = time.minute;
    const period = time.period;
    
    // Convert to 24-hour format
    if (period === 'p.m.' && hour !== 12) {
        hour += 12;
    } else if (period === 'a.m.' && hour === 12) {
        hour = 0;
    }
    
    // Format as HH:MM
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Convert 24-hour HH:MM string to 12-hour time object
 * @param {string|Object} timeString - "10:30" or "22:30" or already an object
 * @returns {Object} - { hour: 10, minute: 30, period: string }
 */
export function convertTo12Hour(timeString) {
    if (typeof timeString === 'object') {
        return timeString; // Already in object format
    }
    
    const [hourStr, minuteStr] = timeString.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    let period = 'a.m.';
    
    if (hour >= 12) {
        period = 'p.m.';
        if (hour > 12) {
        hour -= 12;
        }
    } else if (hour === 0) {
        hour = 12;
    }
    
    return { hour, minute, period };
}

/**
 * Format time for display
 * @param {Object} time - { hour, minute, period }
 * @returns {string} - "10:30 a.m."
 */
export function formatTimeDisplay(time) {
    const { hour, minute, period } = time;
    const minuteStr = minute.toString().padStart(2, '0');
    return `${hour}:${minuteStr} ${period}`;
}
