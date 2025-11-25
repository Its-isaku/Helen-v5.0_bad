const { contextBridge, ipcRenderer } = require('electron');

// IPC Channel definitions (inlined to avoid module resolution issues)
const IPC_CHANNELS = {
  // Config
  CONFIG_GET: 'config:get',
  CONFIG_UPDATE: 'config:update',
  CONFIG_RESET: 'config:reset',
  CONFIG_TEST_CONNECTION: 'config:testConnection',
  
  // Prediction
  PREDICTION_ADD_FRAME: 'prediction:addFrame',
  PREDICTION_TRIGGER: 'prediction:trigger',
  PREDICTION_FORCE: 'prediction:forcePrediction',
  PREDICTION_CLEAR_BUFFER: 'prediction:clearBuffer',
  PREDICTION_GET_BUFFER_STATUS: 'prediction:getBufferStatus',
  PREDICTION_GET_HISTORY: 'prediction:getHistory',
  PREDICTION_CLEAR_HISTORY: 'prediction:clearHistory',
  PREDICTION_GET_STATS: 'prediction:getStats',
  PREDICTION_RESET_STATS: 'prediction:resetStats',
  PREDICTION_RESULT: 'prediction:result',  // Main -> Renderer: Prediction result
  
  // Gestures
  GESTURES_GET_ALL: 'gestures:getAll',
  GESTURES_GET_ONE: 'gestures:getOne',
  GESTURES_CREATE: 'gestures:create',
  GESTURES_UPDATE: 'gestures:update',
  GESTURES_DELETE: 'gestures:delete',
  GESTURES_GET_STATS: 'gestures:getStats',
  
  // Model
  MODEL_GET_INFO: 'model:getInfo',
  MODEL_GET_LIST: 'model:getList',
  MODEL_LOAD: 'model:load',
  MODEL_SWITCH: 'model:switch',
  MODEL_GET_METRICS: 'model:getMetrics',
  MODEL_REFRESH: 'model:refresh',
  MODEL_UNLOAD: 'model:unload',
  
  // Training
  TRAINING_START: 'training:start',
  TRAINING_STOP: 'training:stop',
  TRAINING_GET_STATUS: 'training:getStatus',
  TRAINING_GET_HISTORY: 'training:getHistory',
  TRAINING_VALIDATE: 'training:validate',
  TRAINING_UPLOAD_DATA: 'training:uploadData',
  TRAINING_GET_DATA_LIST: 'training:getDataList',
  TRAINING_DELETE_DATA: 'training:deleteData',
  
  // API
  API_HEALTH_CHECK: 'api:healthCheck',
  
  // State
  STATE_GET: 'state:get',
  STATE_RESET: 'state:reset',
  STATE_CONNECTION_CHANGED: 'state:connectionChanged',
  STATE_MODEL_CHANGED: 'state:modelChanged',
  STATE_GESTURES_CHANGED: 'state:gesturesChanged',
  STATE_PREDICTION_ADDED: 'state:predictionAdded',
  STATE_PREDICTION_ACTIVE_CHANGED: 'state:predictionActiveChanged',
  STATE_TRAINING_CHANGED: 'state:trainingChanged',
  STATE_TRAINING_STARTED: 'state:trainingStarted',
  STATE_TRAINING_STOPPED: 'state:trainingStopped',
  STATE_TRAINING_PROGRESS: 'state:trainingProgress',
  STATE_STATS_UPDATED: 'state:statsUpdated',
  
  // Alarms
  ALARMS_GET_ALL: 'alarms:getAll',
  ALARMS_GET_ONE: 'alarms:getOne',
  ALARMS_CREATE: 'alarms:create',
  ALARMS_UPDATE: 'alarms:update',
  ALARMS_DELETE: 'alarms:delete',
  ALARMS_TOGGLE: 'alarms:toggle',
  ALARMS_CLEAR: 'alarms:clear',
  ALARMS_CREATED: 'alarms:created',
  ALARMS_UPDATED: 'alarms:updated',
  ALARMS_DELETED: 'alarms:deleted',
  ALARMS_TOGGLED: 'alarms:toggled',
  
  // Devices
  DEVICES_GET_ALL: 'devices:getAll',
  DEVICES_GET_ONE: 'devices:getOne',
  DEVICES_CREATE: 'devices:create',
  DEVICES_UPDATE: 'devices:update',
  DEVICES_DELETE: 'devices:delete',
  DEVICES_TOGGLE: 'devices:toggle',
  DEVICES_GET_BY_TYPE: 'devices:getByType',
  DEVICES_GET_BY_LOCATION: 'devices:getByLocation',
  DEVICES_CLEAR: 'devices:clear',
  DEVICES_CREATED: 'devices:created',
  DEVICES_UPDATED: 'devices:updated',
  DEVICES_DELETED: 'devices:deleted',
  DEVICES_TOGGLED: 'devices:toggled',
  
  // Weather
  WEATHER_GET_CURRENT: 'weather:getCurrent',
  WEATHER_GET_FORECAST: 'weather:getForecast',
  WEATHER_CLEAR_CACHE: 'weather:clearCache',
  WEATHER_UPDATED: 'weather:updated',
  
  // System
  SYSTEM_GET_INFO: 'system:getInfo',
  
  // Window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
};

// Expose backend API to renderer process
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

    // Event subscriptions
    onCreated: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.ALARMS_CREATED, subscription);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.ALARMS_CREATED, subscription);
    },
    
    onUpdated: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.ALARMS_UPDATED, subscription);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.ALARMS_UPDATED, subscription);
    },
    
    onDeleted: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.ALARMS_DELETED, subscription);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.ALARMS_DELETED, subscription);
    },
    
    onToggled: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.ALARMS_TOGGLED, subscription);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.ALARMS_TOGGLED, subscription);
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

    // Event subscriptions
    onCreated: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.DEVICES_CREATED, subscription);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DEVICES_CREATED, subscription);
    },
    
    onUpdated: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.DEVICES_UPDATED, subscription);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DEVICES_UPDATED, subscription);
    },
    
    onDeleted: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.DEVICES_DELETED, subscription);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DEVICES_DELETED, subscription);
    },
    
    onToggled: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.DEVICES_TOGGLED, subscription);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DEVICES_TOGGLED, subscription);
    },
  },

  // Weather API
  weather: {
    getCurrent: (lat, lon) => ipcRenderer.invoke(IPC_CHANNELS.WEATHER_GET_CURRENT, lat, lon),
    getForecast: (lat, lon, days = 5) => ipcRenderer.invoke(IPC_CHANNELS.WEATHER_GET_FORECAST, lat, lon, days),
    clearCache: () => ipcRenderer.invoke(IPC_CHANNELS.WEATHER_CLEAR_CACHE),

    // Event subscription
    onUpdated: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.WEATHER_UPDATED, subscription);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WEATHER_UPDATED, subscription);
    },
  },

  // System API
  system: {
    getInfo: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_INFO),
  },

  // Window Control
  window: {
    minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
  },

  // Event Listeners
  on: (channel, callback) => {
    // Allowed channels for listening (main -> renderer)
    const validChannels = [
      ...Object.values(IPC_CHANNELS),
      'alarm:triggered',  // ✅ Added for alarm notifications
      'alarm:created',
      'alarm:updated',
      'alarm:deleted',
      'alarm:toggled',
      'device:created',
      'device:updated',
      'device:deleted',
      'device:toggled',
      'weather:updated',
    ];
    
    if (validChannels.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
    console.warn(`⚠️ Attempted to listen to invalid channel: ${channel}`);
    return () => {};
  },
  
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
});

// Log for confirming preload loaded correctly
console.log('Preload script loaded successfully');
console.log('window.electronBackend exposed');

// Keep legacy electron API for backward compatibility (will be removed after renderer refactor)
contextBridge.exposeInMainWorld('electron', {
  // Legacy config (deprecated - use window.electronBackend.config instead)
  config: {
    save: (config) => {
      console.warn('electron.config.save is deprecated. Use window.electronBackend.config.update instead');
      return ipcRenderer.invoke('config:update', config);
    },
    load: () => {
      console.warn('electron.config.load is deprecated. Use window.electronBackend.config.get instead');
      return ipcRenderer.invoke('config:get');
    }
  },

  // Legacy system info (deprecated - use window.electronBackend.system instead)
  system: {
    getInfo: () => {
      console.warn('electron.system.getInfo is deprecated. Use window.electronBackend.system.getInfo instead');
      return ipcRenderer.invoke('system:getInfo');
    }
  },

  // Legacy window control (deprecated - use window.electronBackend.window instead)
  window: {
    minimize: () => {
      console.warn('electron.window.minimize is deprecated. Use window.electronBackend.window.minimize instead');
      return ipcRenderer.send('window:minimize');
    },
    maximize: () => {
      console.warn('electron.window.maximize is deprecated. Use window.electronBackend.window.maximize instead');
      return ipcRenderer.send('window:maximize');
    },
    close: () => {
      console.warn('electron.window.close is deprecated. Use window.electronBackend.window.close instead');
      return ipcRenderer.send('window:close');
    }
  },

  // Legacy listeners (deprecated - use window.electronBackend.on instead)
  on: (channel, callback) => {
    console.warn('electron.on is deprecated. Use window.electronBackend.on instead');
    const validChannels = ['menu:openSettings', 'menu:openAbout'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  removeListener: (channel, callback) => {
    console.warn('electron.removeListener is deprecated. Use window.electronBackend.removeListener instead');
    const validChannels = ['menu:openSettings', 'menu:openAbout'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  }
});

// Log for confirming preload loaded correctly
console.log('Preload script loaded successfully with new backend architecture');
console.log('Available APIs: window.electronBackend (recommended), window.electron (legacy)');
