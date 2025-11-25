/**
 * Alarm service: Manages alarm operations with local storage and event notifications.
 * Replaces Tauri/Rust alarm functionality with Electron-native implementation.
 * 
 * @module alarmService
 */

const { EventEmitter } = require('events');
const Store = require('electron-store');
const validationService = require('../core/validationService');

class AlarmService extends EventEmitter {
    constructor() {
        super();

        // Initialize electron-store for alarm persistence
        this.store = new Store({
            name: 'alarms',
            defaults: {
                alarms: []
            }
        });

        // Alarm scheduler state
        this.schedulerInterval = null;
        this.isSchedulerRunning = false;

        // Main window reference (set by initializeWithWindow)
        this.mainWindow = null;

        console.log('AlarmService initialized');
    }

    /**
     * Initialize alarm service with main window reference
     * @param {BrowserWindow} mainWindow - Main application window
     */
    initializeWithWindow(mainWindow) {
        this.mainWindow = mainWindow;
        console.log('AlarmService connected to main window');
    }

    /**
     * Generate a unique ID for new alarms
     * @returns {string} UUID v4
     */
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Get all alarms
     * @returns {Promise<Array>} List of all alarms
     */
    async getAll() {
        try {
            const alarms = this.store.get('alarms', []);
            console.log(`Retrieved ${alarms.length} alarms`);
            return alarms;
        } catch (error) {
            console.error('Error getting alarms:', error);
            throw new Error('Failed to retrieve alarms');
        }
    }

    /**
     * Get alarm by ID
     * @param {string} id - Alarm ID
     * @returns {Promise<Object|null>} Alarm object or null
     */
    async getById(id) {
        try {
            const alarms = this.store.get('alarms', []);
            const alarm = alarms.find(a => a.id === id);
            
            if (!alarm) {
                console.warn(`Alarm not found: ${id}`);
                return null;
            }
            
            return alarm;
        } catch (error) {
            console.error(`Error getting alarm ${id}:`, error);
            throw new Error('Failed to retrieve alarm');
        }
    }

    /**
     * Create a new alarm
     * Refactored to use validationService
     * @param {Object} alarmData - Alarm data (time, label, days/repeat_days, enabled)
     * @returns {Promise<Object>} Created alarm
     */

    async create(alarmData) {
        try {
        const alarms = this.store.get('alarms', []);

        // Validate alarm data using validation service
        const validation = validationService.validateAlarmData(alarmData);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // Accept both 'days' and 'repeat_days' for compatibility
        const repeatDays = alarmData.days || alarmData.repeat_days || []; // Create new alarm with generated ID
            const newAlarm = {
                id: this.generateId(),
                time: alarmData.time,
                label: alarmData.label || 'Alarma',
                days: repeatDays,  // Store as 'days' for frontend compatibility
                enabled: alarmData.enabled !== undefined ? alarmData.enabled : true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // Add to store
            alarms.push(newAlarm);
            this.store.set('alarms', alarms);
            
            // Emit event for state updates
            this.emit('alarm:created', newAlarm);
            
            console.log(`Alarm created: ${newAlarm.id}`);
            return newAlarm;
            
        } catch (error) {
            console.error('Error creating alarm:', error);
            throw new Error(`Failed to create alarm: ${error.message}`);
        }
    }

    /**
     * Update an existing alarm
     * @param {string} id - Alarm ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated alarm
     */
    async update(id, updates) {
        try {
            const alarms = this.store.get('alarms', []);
            const index = alarms.findIndex(a => a.id === id);
            
            if (index === -1) {
                throw new Error(`Alarm not found: ${id}`);
            }
            
            // Accept both 'days' and 'repeat_days' for compatibility
            if (updates.days !== undefined) {
                updates.days = updates.days;
            } else if (updates.repeat_days !== undefined) {
                updates.days = updates.repeat_days;
                delete updates.repeat_days;
            }
            
            // Update alarm
            const updatedAlarm = {
                ...alarms[index],
                ...updates,
                id: alarms[index].id, // Preserve ID
                created_at: alarms[index].created_at, // Preserve creation date
                updated_at: new Date().toISOString()
            };
            
            alarms[index] = updatedAlarm;
            this.store.set('alarms', alarms);
            
            // Emit event
            this.emit('alarm:updated', updatedAlarm);
            
            console.log(`Alarm updated: ${id}`);
            return updatedAlarm;
            
        } catch (error) {
            console.error(`Error updating alarm ${id}:`, error);
            throw new Error(`Failed to update alarm: ${error.message}`);
        }
    }

    /**
     * Delete an alarm
     * @param {string} id - Alarm ID
     * @returns {Promise<boolean>} Success status
     */
    async delete(id) {
        try {
            const alarms = this.store.get('alarms', []);
            const index = alarms.findIndex(a => a.id === id);
            
            if (index === -1) {
                throw new Error(`Alarm not found: ${id}`);
            }
            
            // Remove alarm
            const deletedAlarm = alarms[index];
            alarms.splice(index, 1);
            this.store.set('alarms', alarms);
            
            // Emit event
            this.emit('alarm:deleted', { id, alarm: deletedAlarm });
            
            console.log(`Alarm deleted: ${id}`);
            return true;
            
        } catch (error) {
            console.error(`Error deleting alarm ${id}:`, error);
            throw new Error(`Failed to delete alarm: ${error.message}`);
        }
    }

    /**
     * Toggle alarm enabled state
     * @param {string} id - Alarm ID
     * @param {boolean} enabled - New enabled state
     * @returns {Promise<Object>} Updated alarm
     */
    async toggle(id, enabled) {
        try {
            const alarm = await this.update(id, { enabled });
            
            // Emit specific toggle event
            this.emit('alarm:toggled', { id, enabled, alarm });
            
            console.log(`Alarm toggled: ${id} → ${enabled ? 'enabled' : 'disabled'}`);
            return alarm;
            
        } catch (error) {
            console.error(`Error toggling alarm ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get alarms that should trigger at a specific time
     * @param {Date} date - Date/time to check
     * @returns {Promise<Array>} Alarms that should trigger
     */
    async getAlarmsForTime(date = new Date()) {
        try {
            const alarms = this.store.get('alarms', []);
            const currentTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            
            // Convert JS day (0=Sunday, 1=Monday, ..., 6=Saturday)
            // to our format (0=Monday, 1=Tuesday, ..., 6=Sunday)
            const jsDay = date.getDay();
            const currentDay = jsDay === 0 ? 6 : jsDay - 1; // Sunday becomes 6, Monday becomes 0, etc.
            
            console.log(`Current time: ${currentTime}, day: ${currentDay} (JS: ${jsDay})`);
            
            const triggeredAlarms = alarms.filter(alarm => {
                console.log(`Checking alarm "${alarm.label}": time=${alarm.time}, enabled=${alarm.enabled}, days=${JSON.stringify(alarm.days)}`);
                
                if (!alarm.enabled) {
                    console.log(`Skipped (disabled)`);
                    return false;
                }
                
                if (alarm.time !== currentTime) {
                    console.log(`Skipped (time mismatch: ${alarm.time} !== ${currentTime})`);
                    return false;
                }
                
                // Check repeat days (support both 'days' and 'repeat_days')
                const repeatDays = alarm.days || alarm.repeat_days || [];
                if (repeatDays.length > 0) {
                    const shouldTrigger = repeatDays.includes(currentDay);
                    console.log(`Days check: ${JSON.stringify(repeatDays)} includes ${currentDay}? ${shouldTrigger}`);
                    return shouldTrigger;
                }
                
                // If no repeat days, trigger every day
                console.log(`No repeat days - triggers every day`);
                return true;
            });
            
            if (triggeredAlarms.length > 0) {
                console.log(`${triggeredAlarms.length} alarm(s) should trigger!`);
            }
            
            return triggeredAlarms;
            
        } catch (error) {
            console.error('Error getting alarms for time:', error);
            return [];
        }
    }

    /**
     * Clear all alarms (for testing/reset)
     * @returns {Promise<boolean>} Success status
     */
    async clear() {
    try {
        this.store.set('alarms', []);
        this.emit('alarms:cleared');
        console.log('All alarms cleared');
        return true;
    } catch (error) {
        console.error('Error clearing alarms:', error);
        throw new Error('Failed to clear alarms');
    }
    }

    /**
     * Start the alarm scheduler
     * Checks every minute for alarms that should trigger
     */
    startScheduler() {
        if (this.isSchedulerRunning) {
            console.log('Alarm scheduler already running');
            return;
        }

        console.log('Starting alarm scheduler...');
        this.isSchedulerRunning = true;

        // Check immediately on start
        this.checkAlarms();

        // Then check every minute
        this.schedulerInterval = setInterval(() => {
            this.checkAlarms();
        }, 60000); // 60 seconds

        console.log('Alarm scheduler started');
    }

    /**
     * Stop the alarm scheduler
     */
    stopScheduler() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
            this.isSchedulerRunning = false;
            console.log('Alarm scheduler stopped');
        }
    }

    /**
     * Check if any alarms should trigger right now
     */
    async checkAlarms() {
        try {
            const now = new Date();
            const allAlarms = this.store.get('alarms', []);
            console.log(`[${now.toLocaleTimeString()}] Checking ${allAlarms.length} alarm(s)...`);
            
            const triggeredAlarms = await this.getAlarmsForTime(now);

            if (triggeredAlarms.length > 0) {
                console.log(`${triggeredAlarms.length} alarm(s) triggered at ${now.toLocaleTimeString()}`);
                
                triggeredAlarms.forEach(alarm => {
                    this.triggerAlarm(alarm);
                });
            }
        } catch (error) {
            console.error('Error checking alarms:', error);
        }
    }

    /**
     * Trigger an alarm - send to renderer for display
     * @param {Object} alarm - Alarm to trigger
     */
    triggerAlarm(alarm) {
        console.log(`Triggering alarm: ${alarm.label} at ${alarm.time}`);

        // Emit event for IPC handlers to forward to renderer
        this.emit('alarm:triggered', alarm);

        // Send directly to renderer if window is available
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.send('alarm:triggered', alarm);
            
            // Focus and show the window when alarm triggers
            if (this.mainWindow.isMinimized()) {
                this.mainWindow.restore();
            }
            this.mainWindow.show();
            this.mainWindow.focus();
        }
    }

    /**
     * Get scheduler status
     * @returns {Object} Scheduler info
     */
    getSchedulerStatus() {
    return {
        isRunning: this.isSchedulerRunning,
        nextCheck: this.isSchedulerRunning 
            ? new Date(Date.now() + 60000).toISOString() 
            : null
    };
    }
}

const alarmService = new AlarmService();

module.exports = alarmService;
