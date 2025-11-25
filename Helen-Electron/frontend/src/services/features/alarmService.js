// alarmService.js
// Service layer for alarm API integration and real-time updates
import { electronBackend } from '../api/electronBackend';

// Alarm data model for backend communication
// { id, time, label, repeat_days, enabled }

/**
 * Fetch all alarms from Electron backend
 */
export async function fetchAlarms() {
  const response = await electronBackend.alarms.getAll();
  return response.success ? response.data : [];
}

/**
 * Create a new alarm
 */
export async function createAlarm(alarm) {
  const response = await electronBackend.alarms.create(alarm);
  return response.success ? response.data : null;
}

/**
 * Update an existing alarm
 */
export async function updateAlarm(id, updates) {
  const response = await electronBackend.alarms.update(id, updates);
  return response.success ? response.data : null;
}

/**
 * Delete an alarm by ID
 */
export async function deleteAlarm(id) {
  const response = await electronBackend.alarms.delete(id);
  return response.success ? id : null;
}

/**
 * Toggle alarm enabled state
 */
export async function toggleAlarm(id, enabled) {
  const response = await electronBackend.alarms.toggle(id, enabled);
  return response.success ? response.data : null;
}

/**
 * Subscribe to alarm updates (created, updated, deleted, toggled)
 */
export function subscribeToAlarmUpdates(onUpdate) {
  // Subscribe to all alarm events
  const unsubscribers = [
    electronBackend.alarms.onCreated(onUpdate),
    electronBackend.alarms.onUpdated(onUpdate),
    electronBackend.alarms.onDeleted(onUpdate),
    electronBackend.alarms.onToggled(onUpdate),
  ];

  // Return function to unsubscribe from all events
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
}

// Export as default object for backward compatibility
export const alarmService = {
  fetchAlarms,
  createAlarm,
  updateAlarm,
  deleteAlarm,
  toggleAlarm,
  subscribeToAlarmUpdates
};