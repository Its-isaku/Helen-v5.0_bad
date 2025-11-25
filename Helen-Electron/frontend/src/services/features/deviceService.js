// deviceService.js
// Service layer for device operations via Electron backend
import { electronBackend } from '../api/electronBackend';

// Device data model for backend communication
// { id, name, type, location, status, connected, enabled }

/**
 * Fetch all devices from Electron backend
 */
export async function fetchDevices() {
    const response = await electronBackend.devices.getAll();
    if (!response.success) {
        console.error('Failed to fetch devices:', response.error);
        return [];
    }
    return Array.isArray(response.data) ? response.data : [];
}

/**
 * Add a new device
 */
export async function addDevice(device) {
    // Ensure type field is present (support both 'type' and 'deviceType')
    const devicePayload = {
        name: device.name,
        type: device.type || device.deviceType,
        location: device.location,
    };
    
    const response = await electronBackend.devices.create(devicePayload);
    return response.success ? response.data : null;
}

/**
 * Update an existing device
 */
export async function updateDevice(device) {
    // Ensure type field is present (support both 'type' and 'deviceType')
    const devicePayload = {
        name: device.name,
        type: device.type || device.deviceType,
        location: device.location,
        enabled: device.enabled,
    };
    
    const response = await electronBackend.devices.update(device.id, devicePayload);
    return response.success ? response.data : null;
}

/**
 * Remove a device by ID
 */
export async function removeDevice(id) {
    const response = await electronBackend.devices.delete(id);
    return response.success ? id : null;
}

/**
 * Toggle device enabled state
 */
export async function toggleDevice(id, enabled) {
    const response = await electronBackend.devices.toggle(id, enabled);
    return response.success ? response.data : null;
}

/**
 * Subscribe to device updates (created, updated, deleted, toggled)
 */
export function subscribeToDeviceUpdates(onUpdate) {
    // Subscribe to all device events
    const unsubscribers = [
        electronBackend.devices.onCreated(onUpdate),
        electronBackend.devices.onUpdated(onUpdate),
        electronBackend.devices.onDeleted(onUpdate),
        electronBackend.devices.onToggled(onUpdate),
    ];

    // Return function to unsubscribe from all events
    return () => {
        unsubscribers.forEach(unsub => unsub());
    };
}

// Export as default object for backward compatibility
export const deviceService = {
    fetchDevices,
    addDevice,
    updateDevice,
    removeDevice,
    toggleDevice,
    subscribeToDeviceUpdates
};

export default deviceService;

