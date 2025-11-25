/**
 * Electron Backend Bridge (Renderer Process): Provides a clean API for renderer to access Electron backend
 * Replaces direct HTTP calls and Tauri invoke calls with Electron IPC
 * 
 * Usage in components:
 * import { electronBackend } from '@/services/electronBackend';
 * const result = await electronBackend.prediction.addFrame(landmarks);
 */

/**
 * Check if Electron backend is available
 */
export const isElectronBackendAvailable = () => {
  return typeof window !== 'undefined' && window.electronBackend !== undefined;
};

/**
 * Get Electron backend API
 * Throws error if not in Electron environment
 */
export const getElectronBackend = () => {
  if (!isElectronBackendAvailable()) {
    console.error('Electron backend is not available. Make sure you are running in Electron environment.');
    throw new Error('Electron backend is not available. Make sure you are running in Electron environment.');
  }
  return window.electronBackend;
};

/**
 * Wait for Electron backend to be available (with timeout)
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 * @returns {Promise<boolean>} True if available, false if timeout
 */
export const waitForElectronBackend = (timeout = 5000) => {
  return new Promise((resolve) => {
    if (isElectronBackendAvailable()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isElectronBackendAvailable()) {
        clearInterval(checkInterval);
        console.log('Electron backend is now available');
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        console.warn('Electron backend timeout - backend not available after ${timeout}ms');
        resolve(false);
      }
    }, 100);
  });
};

/**
 * Electron Backend API
 * Provides typed access to all backend operations
 */
export const electronBackend = {
  /**
   * Configuration API
   */
  config: {
    get: async () => {
      const backend = getElectronBackend();
      return backend.config.get();
    },
    
    update: async (updates) => {
      const backend = getElectronBackend();
      return backend.config.update(updates);
    },
    
    reset: async () => {
      const backend = getElectronBackend();
      return backend.config.reset();
    },
    
    testConnection: async (url) => {
      const backend = getElectronBackend();
      return backend.config.testConnection(url);
    },
  },

  /**
   * Prediction API
   */
  prediction: {
    addFrame: async (landmarks) => {
      const backend = getElectronBackend();
      return backend.prediction.addFrame(landmarks);
    },
    
    trigger: async () => {
      const backend = getElectronBackend();
      return backend.prediction.trigger();
    },
    
    forcePrediction: async () => {
      const backend = getElectronBackend();
      return backend.prediction.forcePrediction();
    },
    
    clearBuffer: async () => {
      const backend = getElectronBackend();
      return backend.prediction.clearBuffer();
    },
    
    getBufferStatus: async () => {
      const backend = getElectronBackend();
      return backend.prediction.getBufferStatus();
    },
    
    getHistory: async (limit) => {
      const backend = getElectronBackend();
      return backend.prediction.getHistory(limit);
    },
    
    clearHistory: async () => {
      const backend = getElectronBackend();
      return backend.prediction.clearHistory();
    },
    
    getStats: async () => {
      const backend = getElectronBackend();
      return backend.prediction.getStats();
    },
    
    resetStats: async () => {
      const backend = getElectronBackend();
      return backend.prediction.resetStats();
    },
  },

  /**
   * Gestures API
   */
  gestures: {
    getAll: async () => {
      const backend = getElectronBackend();
      return backend.gestures.getAll();
    },
    
    getOne: async (id) => {
      const backend = getElectronBackend();
      return backend.gestures.getOne(id);
    },
    
    create: async (gestureData) => {
      const backend = getElectronBackend();
      return backend.gestures.create(gestureData);
    },
    
    update: async (id, gestureData) => {
      const backend = getElectronBackend();
      return backend.gestures.update(id, gestureData);
    },
    
    delete: async (id) => {
      const backend = getElectronBackend();
      return backend.gestures.delete(id);
    },
    
    getStats: async () => {
      const backend = getElectronBackend();
      return backend.gestures.getStats();
    },
  },

  /**
   * Model API
   */
  model: {
    getInfo: async () => {
      const backend = getElectronBackend();
      return backend.model.getInfo();
    },
    
    getList: async () => {
      const backend = getElectronBackend();
      return backend.model.getList();
    },
    
    load: async (modelPath) => {
      const backend = getElectronBackend();
      return backend.model.load(modelPath);
    },
    
    switch: async (modelIdentifier) => {
      const backend = getElectronBackend();
      return backend.model.switch(modelIdentifier);
    },
    
    getMetrics: async () => {
      const backend = getElectronBackend();
      return backend.model.getMetrics();
    },
    
    refresh: async () => {
      const backend = getElectronBackend();
      return backend.model.refresh();
    },
    
    unload: async () => {
      const backend = getElectronBackend();
      return backend.model.unload();
    },
  },

  /**
   * Training API
   */
  training: {
    start: async (trainingConfig) => {
      const backend = getElectronBackend();
      return backend.training.start(trainingConfig);
    },
    
    stop: async () => {
      const backend = getElectronBackend();
      return backend.training.stop();
    },
    
    getStatus: async () => {
      const backend = getElectronBackend();
      return backend.training.getStatus();
    },
    
    getHistory: async () => {
      const backend = getElectronBackend();
      return backend.training.getHistory();
    },
    
    validate: async () => {
      const backend = getElectronBackend();
      return backend.training.validate();
    },
    
    uploadData: async (dataPayload) => {
      const backend = getElectronBackend();
      return backend.training.uploadData(dataPayload);
    },
    
    getDataList: async () => {
      const backend = getElectronBackend();
      return backend.training.getDataList();
    },
    
    deleteData: async (id) => {
      const backend = getElectronBackend();
      return backend.training.deleteData(id);
    },
  },

  /**
   * API Health
   */
  api: {
    healthCheck: async () => {
      const backend = getElectronBackend();
      return backend.api.healthCheck();
    },
  },

  /**
   * State API
   */
  state: {
    get: async (path) => {
      const backend = getElectronBackend();
      return backend.state.get(path);
    },
    
    reset: async () => {
      const backend = getElectronBackend();
      return backend.state.reset();
    },
    
    // Event subscriptions
    onConnectionChanged: (callback) => {
      const backend = getElectronBackend();
      return backend.state.onConnectionChanged(callback);
    },
    
    onModelChanged: (callback) => {
      const backend = getElectronBackend();
      return backend.state.onModelChanged(callback);
    },
    
    onGesturesChanged: (callback) => {
      const backend = getElectronBackend();
      return backend.state.onGesturesChanged(callback);
    },
    
    onPredictionAdded: (callback) => {
      const backend = getElectronBackend();
      return backend.state.onPredictionAdded(callback);
    },
    
    onPredictionActiveChanged: (callback) => {
      const backend = getElectronBackend();
      return backend.state.onPredictionActiveChanged(callback);
    },
    
    onTrainingChanged: (callback) => {
      const backend = getElectronBackend();
      return backend.state.onTrainingChanged(callback);
    },
    
    onTrainingStarted: (callback) => {
      const backend = getElectronBackend();
      return backend.state.onTrainingStarted(callback);
    },
    
    onTrainingStopped: (callback) => {
      const backend = getElectronBackend();
      return backend.state.onTrainingStopped(callback);
    },
    
    onTrainingProgress: (callback) => {
      const backend = getElectronBackend();
      return backend.state.onTrainingProgress(callback);
    },
    
    onStatsUpdated: (callback) => {
      const backend = getElectronBackend();
      return backend.state.onStatsUpdated(callback);
    },
  },

  /**
   * Alarms API
   */
  alarms: {
    getAll: async () => {
      const backend = getElectronBackend();
      return backend.alarms.getAll();
    },
    
    getOne: async (id) => {
      const backend = getElectronBackend();
      return backend.alarms.getOne(id);
    },
    
    create: async (alarmData) => {
      const backend = getElectronBackend();
      return backend.alarms.create(alarmData);
    },
    
    update: async (id, updates) => {
      const backend = getElectronBackend();
      return backend.alarms.update(id, updates);
    },
    
    delete: async (id) => {
      const backend = getElectronBackend();
      return backend.alarms.delete(id);
    },
    
    toggle: async (id, enabled) => {
      const backend = getElectronBackend();
      return backend.alarms.toggle(id, enabled);
    },
    
    clear: async () => {
      const backend = getElectronBackend();
      return backend.alarms.clear();
    },

    // Event subscriptions
    onCreated: (callback) => {
      const backend = getElectronBackend();
      return backend.alarms.onCreated(callback);
    },
    
    onUpdated: (callback) => {
      const backend = getElectronBackend();
      return backend.alarms.onUpdated(callback);
    },
    
    onDeleted: (callback) => {
      const backend = getElectronBackend();
      return backend.alarms.onDeleted(callback);
    },
    
    onToggled: (callback) => {
      const backend = getElectronBackend();
      return backend.alarms.onToggled(callback);
    },
  },

  /**
   * Devices API
   */
  devices: {
    getAll: async () => {
      const backend = getElectronBackend();
      return backend.devices.getAll();
    },
    
    getOne: async (id) => {
      const backend = getElectronBackend();
      return backend.devices.getOne(id);
    },
    
    create: async (deviceData) => {
      const backend = getElectronBackend();
      return backend.devices.create(deviceData);
    },
    
    update: async (id, updates) => {
      const backend = getElectronBackend();
      return backend.devices.update(id, updates);
    },
    
    delete: async (id) => {
      const backend = getElectronBackend();
      return backend.devices.delete(id);
    },
    
    toggle: async (id, enabled) => {
      const backend = getElectronBackend();
      return backend.devices.toggle(id, enabled);
    },
    
    getByType: async (type) => {
      const backend = getElectronBackend();
      return backend.devices.getByType(type);
    },
    
    getByLocation: async (location) => {
      const backend = getElectronBackend();
      return backend.devices.getByLocation(location);
    },
    
    clear: async () => {
      const backend = getElectronBackend();
      return backend.devices.clear();
    },

    // Event subscriptions
    onCreated: (callback) => {
      const backend = getElectronBackend();
      return backend.devices.onCreated(callback);
    },
    
    onUpdated: (callback) => {
      const backend = getElectronBackend();
      return backend.devices.onUpdated(callback);
    },
    
    onDeleted: (callback) => {
      const backend = getElectronBackend();
      return backend.devices.onDeleted(callback);
    },
    
    onToggled: (callback) => {
      const backend = getElectronBackend();
      return backend.devices.onToggled(callback);
    },
  },

  /**
   * Weather API
   */
  weather: {
    getCurrent: async (lat, lon) => {
      const backend = getElectronBackend();
      return backend.weather.getCurrent(lat, lon);
    },
    
    getForecast: async (lat, lon, days = 5) => {
      const backend = getElectronBackend();
      return backend.weather.getForecast(lat, lon, days);
    },
    
    clearCache: async () => {
      const backend = getElectronBackend();
      return backend.weather.clearCache();
    },

    // Event subscription
    onUpdated: (callback) => {
      const backend = getElectronBackend();
      return backend.weather.onUpdated(callback);
    },
  },

  /**
   * System API
   */
  system: {
    getInfo: async () => {
      const backend = getElectronBackend();
      return backend.system.getInfo();
    },
  },

  /**
   * Window Control
   */
  window: {
    minimize: () => {
      const backend = getElectronBackend();
      return backend.window.minimize();
    },
    
    maximize: () => {
      const backend = getElectronBackend();
      return backend.window.maximize();
    },
    
    close: () => {
      const backend = getElectronBackend();
      return backend.window.close();
    },
  },

  /**
   * Event Listeners
   */
  on: (channel, callback) => {
    const backend = getElectronBackend();
    return backend.on(channel, callback);
  },
  
  removeListener: (channel, callback) => {
    const backend = getElectronBackend();
    return backend.removeListener(channel, callback);
  },
};

export default electronBackend;
