/**
 * Device service: Manages smart device operations
 * WEB VERSION - Uses localStorage
 */

// EventEmitter for web
class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }
  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(cb => cb(...args));
  }
}

class DeviceService extends EventEmitter {
    constructor() {
        super();
    }

    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getDevices() {
        try {
            const stored = localStorage.getItem('devices');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading devices:', e);
            return [];
        }
    }

    saveDevices(devices) {
        try {
            localStorage.setItem('devices', JSON.stringify(devices));
        } catch (e) {
            console.error('Error saving devices:', e);
        }
    }

    async getAll() {
        const devices = this.getDevices();
        return devices;
    }

    async getById(id) {
        const devices = this.getDevices();
        return devices.find(d => d.id === id) || null;
    }

    async create(deviceData) {
        const devices = this.getDevices();
        
        if (!deviceData.name) throw new Error('Device name is required');
        if (!deviceData.type && !deviceData.deviceType) throw new Error('Device type is required');
        
        const newDevice = {
            id: this.generateId(),
            name: deviceData.name,
            type: deviceData.type || deviceData.deviceType,
            location: deviceData.location || 'Sin ubicación',
            status: deviceData.status || 'inactive',
            connected: deviceData.connected !== undefined ? deviceData.connected : true,
            enabled: deviceData.enabled !== undefined ? deviceData.enabled : true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        devices.push(newDevice);
        this.saveDevices(devices);
        this.emit('device:created', newDevice);
        
        return newDevice;
    }

    async update(id, updates) {
        const devices = this.getDevices();
        const index = devices.findIndex(d => d.id === id);
        
        if (index === -1) throw new Error(`Device not found: ${id}`);
        
        if (updates.deviceType && !updates.type) {
            updates.type = updates.deviceType;
            delete updates.deviceType;
        }
        
        const updatedDevice = {
            ...devices[index],
            ...updates,
            id: devices[index].id,
            created_at: devices[index].created_at,
            updated_at: new Date().toISOString()
        };
        
        devices[index] = updatedDevice;
        this.saveDevices(devices);
        this.emit('device:updated', updatedDevice);
        
        return updatedDevice;
    }

    async delete(id) {
        const devices = this.getDevices();
        const index = devices.findIndex(d => d.id === id);
        
        if (index === -1) throw new Error(`Device not found: ${id}`);
        
        const deletedDevice = devices[index];
        devices.splice(index, 1);
        this.saveDevices(devices);
        this.emit('device:deleted', { id, device: deletedDevice });
        
        return true;
    }

    async toggle(id, enabled) {
        const device = await this.update(id, { 
            enabled,
            status: enabled ? 'active' : 'inactive'
        });
        
        this.emit('device:toggled', { id, enabled, device });
        return device;
    }

    async getByType(type) {
        return this.getDevices().filter(d => d.type === type);
    }

    async getByLocation(location) {
        return this.getDevices().filter(d => d.location === location);
    }

    async clear() {
        localStorage.removeItem('devices');
        this.emit('devices:cleared');
        return true;
    }

    async addDevice(deviceData) {
        return this.create(deviceData);
    }
}

const deviceService = new DeviceService();
export default deviceService;
export { deviceService };