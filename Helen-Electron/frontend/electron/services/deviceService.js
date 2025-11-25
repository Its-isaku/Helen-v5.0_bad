/**
 * Device service: Manages smart device operations with local storage and event notifications.
 * 
 * @module deviceService
 */

const { EventEmitter } = require('events');
const Store = require('electron-store');

class DeviceService extends EventEmitter {
    constructor() {
        super();
        
        // Initialize electron-store for device persistence
        this.store = new Store({
            name: 'devices',
            defaults: {
                devices: []
            }
        });
        
        console.log('DeviceService initialized');
    }

    /**
     * Generate a unique ID for new devices
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
     * Get all devices
     * @returns {Promise<Array>} List of all devices
     */
    async getAll() {
        try {
            const devices = this.store.get('devices', []);
            console.log(`Retrieved ${devices.length} devices`);
            return devices;
        } catch (error) {
            console.error('Error getting devices:', error);
            throw new Error('Failed to retrieve devices');
        }
    }

    /**
     * Get device by ID
     * @param {string} id - Device ID
     * @returns {Promise<Object|null>} Device object or null
     */
    async getById(id) {
        try {
            const devices = this.store.get('devices', []);
            const device = devices.find(d => d.id === id);
            
            if (!device) {
                console.warn(`Device not found: ${id}`);
                return null;
            }
            
            return device;
        } catch (error) {
            console.error(`Error getting device ${id}:`, error);
            throw new Error('Failed to retrieve device');
        }
    }

    /**
     * Create a new device
     * @param {Object} deviceData - Device data (name, type, location, enabled)
     * @returns {Promise<Object>} Created device
     */
    async create(deviceData) {
        try {
            const devices = this.store.get('devices', []);
            
            // Validate required fields
            if (!deviceData.name) {
                throw new Error('Device name is required');
            }
            if (!deviceData.type && !deviceData.deviceType) {
                throw new Error('Device type is required');
            }
            
            // Create new device with generated ID
            const newDevice = {
                id: this.generateId(),
                name: deviceData.name,
                type: deviceData.type || deviceData.deviceType, // Support both naming conventions
                location: deviceData.location || 'Sin ubicación',
                status: deviceData.status || 'inactive',
                connected: deviceData.connected !== undefined ? deviceData.connected : true,
                enabled: deviceData.enabled !== undefined ? deviceData.enabled : true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // Add to store
            devices.push(newDevice);
            this.store.set('devices', devices);
            
            // Emit event for state updates
            this.emit('device:created', newDevice);
            
            console.log(`Device created: ${newDevice.id} (${newDevice.name})`);
            return newDevice;
            
        } catch (error) {
            console.error('Error creating device:', error);
            throw new Error(`Failed to create device: ${error.message}`);
        }
    }

    /**
     * Update an existing device
     * @param {string} id - Device ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated device
     */
    async update(id, updates) {
        try {
            const devices = this.store.get('devices', []);
            const index = devices.findIndex(d => d.id === id);
            
            if (index === -1) {
                throw new Error(`Device not found: ${id}`);
            }
            
            // Handle both 'type' and 'deviceType' naming conventions
            if (updates.deviceType && !updates.type) {
                updates.type = updates.deviceType;
                delete updates.deviceType;
            }
            
            // Update device
            const updatedDevice = {
                ...devices[index],
                ...updates,
                id: devices[index].id, // Preserve ID
                created_at: devices[index].created_at, // Preserve creation date
                updated_at: new Date().toISOString()
            };
            
            devices[index] = updatedDevice;
            this.store.set('devices', devices);
            
            // Emit event
            this.emit('device:updated', updatedDevice);
            
            console.log(`Device updated: ${id}`);
            return updatedDevice;
            
        } catch (error) {
            console.error(`Error updating device ${id}:`, error);
            throw new Error(`Failed to update device: ${error.message}`);
        }
    }

    /**
     * Delete a device
     * @param {string} id - Device ID
     * @returns {Promise<boolean>} Success status
     */
    async delete(id) {
        try {
            const devices = this.store.get('devices', []);
            const index = devices.findIndex(d => d.id === id);
            
            if (index === -1) {
                throw new Error(`Device not found: ${id}`);
            }
            
            // Remove device
            const deletedDevice = devices[index];
            devices.splice(index, 1);
            this.store.set('devices', devices);
            
            // Emit event
            this.emit('device:deleted', { id, device: deletedDevice });
            
            console.log(`Device deleted: ${id}`);
            return true;
            
        } catch (error) {
            console.error(`Error deleting device ${id}:`, error);
            throw new Error(`Failed to delete device: ${error.message}`);
        }
    }

    /**
     * Toggle device enabled state
     * @param {string} id - Device ID
     * @param {boolean} enabled - New enabled state
     * @returns {Promise<Object>} Updated device
     */
    async toggle(id, enabled) {
        try {
            const device = await this.update(id, { 
                enabled,
                status: enabled ? 'active' : 'inactive'
            });
            
            // Emit specific toggle event
            this.emit('device:toggled', { id, enabled, device });
            
            console.log(`Device toggled: ${id} → ${enabled ? 'enabled' : 'disabled'}`);
            return device;
            
        } catch (error) {
            console.error(`Error toggling device ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get devices by type
     * @param {string} type - Device type
     * @returns {Promise<Array>} Devices of specified type
     */
    async getByType(type) {
        try {
            const devices = this.store.get('devices', []);
            return devices.filter(d => d.type === type);
        } catch (error) {
            console.error(`Error getting devices by type ${type}:`, error);
            return [];
        }
    }

    /**
     * Get devices by location
     * @param {string} location - Location name
     * @returns {Promise<Array>} Devices in specified location
     */
    async getByLocation(location) {
        try {
            const devices = this.store.get('devices', []);
            return devices.filter(d => d.location === location);
        } catch (error) {
            console.error(`Error getting devices by location ${location}:`, error);
            return [];
        }
    }

    /**
     * Clear all devices (for testing/reset)
     * @returns {Promise<boolean>} Success status
     */
    async clear() {
        try {
            this.store.set('devices', []);
            this.emit('devices:cleared');
            console.log('All devices cleared');
            return true;
        } catch (error) {
            console.error('Error clearing devices:', error);
            throw new Error('Failed to clear devices');
        }
    }
}

// Singleton instance
const deviceService = new DeviceService();

module.exports = deviceService;
