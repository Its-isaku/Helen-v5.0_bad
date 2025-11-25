/**
 * IPC Exposure (Preload Script): Expose secure backend API to renderer via contextBridge
 * Only whitelisted channels and methods are exposed
 */

const { contextBridge, ipcRenderer } = require('electron');
const { IPC_CHANNELS, VALID_INVOKE_CHANNELS, VALID_ON_CHANNELS, VALID_SEND_CHANNELS } = require('./ipcChannels');

/**
 * Expose backend API to renderer process
 */
function exposeBackendApi() {
  contextBridge.exposeInMainWorld('electronBackend', {
    // Configuration API
    config: {
      get: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),
      update: (updates) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_UPDATE, updates),
      reset: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_RESET),
      testConnection: (url) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_TEST_CONNECTION, url),
    },

    // Prediction API
    prediction: {
      addFrame: (landmarks) => ipcRenderer.invoke(IPC_CHANNELS.PREDICTION_ADD_FRAME, landmarks),
      trigger: () => ipcRenderer.invoke(IPC_CHANNELS.PREDICTION_TRIGGER),
      forcePrediction: () => ipcRenderer.invoke(IPC_CHANNELS.PREDICTION_FORCE),
      clearBuffer: () => ipcRenderer.invoke(IPC_CHANNELS.PREDICTION_CLEAR_BUFFER),
      getBufferStatus: () => ipcRenderer.invoke(IPC_CHANNELS.PREDICTION_GET_BUFFER_STATUS),
      getHistory: (limit) => ipcRenderer.invoke(IPC_CHANNELS.PREDICTION_GET_HISTORY, limit),
      clearHistory: () => ipcRenderer.invoke(IPC_CHANNELS.PREDICTION_CLEAR_HISTORY),
      getStats: () => ipcRenderer.invoke(IPC_CHANNELS.PREDICTION_GET_STATS),
      resetStats: () => ipcRenderer.invoke(IPC_CHANNELS.PREDICTION_RESET_STATS),
    },

    // Gestures API
    gestures: {
      getAll: () => ipcRenderer.invoke(IPC_CHANNELS.GESTURES_GET_ALL),
      getOne: (id) => ipcRenderer.invoke(IPC_CHANNELS.GESTURES_GET_ONE, id),
      create: (gestureData) => ipcRenderer.invoke(IPC_CHANNELS.GESTURES_CREATE, gestureData),
      update: (id, gestureData) => ipcRenderer.invoke(IPC_CHANNELS.GESTURES_UPDATE, id, gestureData),
      delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.GESTURES_DELETE, id),
      getStats: () => ipcRenderer.invoke(IPC_CHANNELS.GESTURES_GET_STATS),
    },

    // Model API
    model: {
      getInfo: () => ipcRenderer.invoke(IPC_CHANNELS.MODEL_GET_INFO),
      getList: () => ipcRenderer.invoke(IPC_CHANNELS.MODEL_GET_LIST),
      load: (modelPath) => ipcRenderer.invoke(IPC_CHANNELS.MODEL_LOAD, modelPath),
      switch: (modelIdentifier) => ipcRenderer.invoke(IPC_CHANNELS.MODEL_SWITCH, modelIdentifier),
      getMetrics: () => ipcRenderer.invoke(IPC_CHANNELS.MODEL_GET_METRICS),
      refresh: () => ipcRenderer.invoke(IPC_CHANNELS.MODEL_REFRESH),
      unload: () => ipcRenderer.invoke(IPC_CHANNELS.MODEL_UNLOAD),
    },

    // Training API
    training: {
      start: (trainingConfig) => ipcRenderer.invoke(IPC_CHANNELS.TRAINING_START, trainingConfig),
      stop: () => ipcRenderer.invoke(IPC_CHANNELS.TRAINING_STOP),
      getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.TRAINING_GET_STATUS),
      getHistory: () => ipcRenderer.invoke(IPC_CHANNELS.TRAINING_GET_HISTORY),
      validate: () => ipcRenderer.invoke(IPC_CHANNELS.TRAINING_VALIDATE),
      uploadData: (dataPayload) => ipcRenderer.invoke(IPC_CHANNELS.TRAINING_UPLOAD_DATA, dataPayload),
      getDataList: () => ipcRenderer.invoke(IPC_CHANNELS.TRAINING_GET_DATA_LIST),
      deleteData: (id) => ipcRenderer.invoke(IPC_CHANNELS.TRAINING_DELETE_DATA, id),
    },

    // API Health
    api: {
      healthCheck: () => ipcRenderer.invoke(IPC_CHANNELS.API_HEALTH_CHECK),
    },

    // State API
    state: {
      get: (path) => ipcRenderer.invoke(IPC_CHANNELS.STATE_GET, path),
      reset: () => ipcRenderer.invoke(IPC_CHANNELS.STATE_RESET),
      
      // Event listeners for state changes
      onConnectionChanged: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on(IPC_CHANNELS.STATE_CONNECTION_CHANGED, subscription);
        return () => ipcRenderer.removeListener(IPC_CHANNELS.STATE_CONNECTION_CHANGED, subscription);
      },
      
      onModelChanged: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on(IPC_CHANNELS.STATE_MODEL_CHANGED, subscription);
        return () => ipcRenderer.removeListener(IPC_CHANNELS.STATE_MODEL_CHANGED, subscription);
      },
      
      onGesturesChanged: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on(IPC_CHANNELS.STATE_GESTURES_CHANGED, subscription);
        return () => ipcRenderer.removeListener(IPC_CHANNELS.STATE_GESTURES_CHANGED, subscription);
      },
      
      onPredictionAdded: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on(IPC_CHANNELS.STATE_PREDICTION_ADDED, subscription);
        return () => ipcRenderer.removeListener(IPC_CHANNELS.STATE_PREDICTION_ADDED, subscription);
      },
      
      onPredictionActiveChanged: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on(IPC_CHANNELS.STATE_PREDICTION_ACTIVE_CHANGED, subscription);
        return () => ipcRenderer.removeListener(IPC_CHANNELS.STATE_PREDICTION_ACTIVE_CHANGED, subscription);
      },
      
      onTrainingChanged: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on(IPC_CHANNELS.STATE_TRAINING_CHANGED, subscription);
        return () => ipcRenderer.removeListener(IPC_CHANNELS.STATE_TRAINING_CHANGED, subscription);
      },
      
      onTrainingStarted: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on(IPC_CHANNELS.STATE_TRAINING_STARTED, subscription);
        return () => ipcRenderer.removeListener(IPC_CHANNELS.STATE_TRAINING_STARTED, subscription);
      },
      
      onTrainingStopped: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on(IPC_CHANNELS.STATE_TRAINING_STOPPED, subscription);
        return () => ipcRenderer.removeListener(IPC_CHANNELS.STATE_TRAINING_STOPPED, subscription);
      },
      
      onTrainingProgress: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on(IPC_CHANNELS.STATE_TRAINING_PROGRESS, subscription);
        return () => ipcRenderer.removeListener(IPC_CHANNELS.STATE_TRAINING_PROGRESS, subscription);
      },
      
      onStatsUpdated: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on(IPC_CHANNELS.STATE_STATS_UPDATED, subscription);
        return () => ipcRenderer.removeListener(IPC_CHANNELS.STATE_STATS_UPDATED, subscription);
      },
    },

    // Alarms API
    alarms: {
      getAll: () => ipcRenderer.invoke(IPC_CHANNELS.ALARMS_GET_ALL),
      getOne: (id) => ipcRenderer.invoke(IPC_CHANNELS.ALARMS_GET_ONE, id),
      create: (alarmData) => ipcRenderer.invoke(IPC_CHANNELS.ALARMS_CREATE, alarmData),
      update: (id, updates) => ipcRenderer.invoke(IPC_CHANNELS.ALARMS_UPDATE, id, updates),
      delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.ALARMS_DELETE, id),
      toggle: (id, enabled) => ipcRenderer.invoke(IPC_CHANNELS.ALARMS_TOGGLE, id, enabled),
      clear: () => ipcRenderer.invoke(IPC_CHANNELS.ALARMS_CLEAR),

      // Event listeners
      onCreated: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('alarm:created', subscription);
        return () => ipcRenderer.removeListener('alarm:created', subscription);
      },
      onUpdated: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('alarm:updated', subscription);
        return () => ipcRenderer.removeListener('alarm:updated', subscription);
      },
      onDeleted: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('alarm:deleted', subscription);
        return () => ipcRenderer.removeListener('alarm:deleted', subscription);
      },
      onToggled: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('alarm:toggled', subscription);
        return () => ipcRenderer.removeListener('alarm:toggled', subscription);
      },
    },

    // Devices API
    devices: {
      getAll: () => ipcRenderer.invoke(IPC_CHANNELS.DEVICES_GET_ALL),
      getOne: (id) => ipcRenderer.invoke(IPC_CHANNELS.DEVICES_GET_ONE, id),
      create: (deviceData) => ipcRenderer.invoke(IPC_CHANNELS.DEVICES_CREATE, deviceData),
      update: (id, updates) => ipcRenderer.invoke(IPC_CHANNELS.DEVICES_UPDATE, id, updates),
      delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.DEVICES_DELETE, id),
      toggle: (id, enabled) => ipcRenderer.invoke(IPC_CHANNELS.DEVICES_TOGGLE, id, enabled),
      getByType: (type) => ipcRenderer.invoke(IPC_CHANNELS.DEVICES_GET_BY_TYPE, type),
      getByLocation: (location) => ipcRenderer.invoke(IPC_CHANNELS.DEVICES_GET_BY_LOCATION, location),
      clear: () => ipcRenderer.invoke(IPC_CHANNELS.DEVICES_CLEAR),

      // Event listeners
      onCreated: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('device:created', subscription);
        return () => ipcRenderer.removeListener('device:created', subscription);
      },
      onUpdated: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('device:updated', subscription);
        return () => ipcRenderer.removeListener('device:updated', subscription);
      },
      onDeleted: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('device:deleted', subscription);
        return () => ipcRenderer.removeListener('device:deleted', subscription);
      },
      onToggled: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('device:toggled', subscription);
        return () => ipcRenderer.removeListener('device:toggled', subscription);
      },
    },

    // Weather API
    weather: {
      getCurrent: (lat, lon) => ipcRenderer.invoke(IPC_CHANNELS.WEATHER_GET_CURRENT, lat, lon),
      getForecast: (lat, lon, days) => ipcRenderer.invoke(IPC_CHANNELS.WEATHER_GET_FORECAST, lat, lon, days),
      clearCache: () => ipcRenderer.invoke(IPC_CHANNELS.WEATHER_CLEAR_CACHE),

      // Event listener
      onUpdated: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('weather:updated', subscription);
        return () => ipcRenderer.removeListener('weather:updated', subscription);
      },
    },

    // System API
    system: {
      getInfo: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_INFO),
    },

    // Window Control API
    window: {
      minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
      maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
      close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
    },

    // Event Listeners (menu, etc.)
    on: (channel, callback) => {
      if (VALID_ON_CHANNELS.includes(channel)) {
        const subscription = (event, ...args) => callback(...args);
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
      } else {
        console.warn(`Invalid channel: ${channel}`);
        return () => {};
      }
    },

    removeListener: (channel, callback) => {
      if (VALID_ON_CHANNELS.includes(channel)) {
        ipcRenderer.removeListener(channel, callback);
      }
    },
  });

  console.log('Backend API exposed to renderer via contextBridge');
}

module.exports = { exposeBackendApi };
