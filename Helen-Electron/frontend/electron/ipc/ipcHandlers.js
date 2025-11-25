/**
 * IPC Handlers (Main Process): Handle all IPC requests from renderer and delegate to services
 * All backend communication happens here - renderer never talks to backend directly
 */

const { ipcMain } = require('electron');
const { IPC_CHANNELS } = require('./ipcChannels');

// Import core services
const configService = require('../core/configService');
const apiService = require('../core/apiService');
const stateService = require('../core/stateService');

// Import domain services
const predictionService = require('../services/predictionService');
const gestureService = require('../services/gestureService');
const modelService = require('../services/modelService');
const trainingService = require('../services/trainingService');
const alarmService = require('../services/alarmService');
const deviceService = require('../services/deviceService');
const weatherService = require('../services/weatherService');

/**
 * Initialize all IPC handlers
 */
function initializeIpcHandlers(mainWindow) {
  console.log('Initializing IPC handlers...');

  // ========== Configuration Handlers ==========
  
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async () => {
    try {
      return {
        success: true,
        data: configService.getConfig(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_UPDATE, async (event, updates) => {
    try {
      const config = await configService.updateConfig(updates);
      return {
        success: true,
        data: config,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_RESET, async () => {
    try {
      const config = configService.resetToDefaults();
      return {
        success: true,
        data: config,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_TEST_CONNECTION, async (event, url) => {
    try {
      const result = await configService.testConnection(url);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ========== Prediction Handlers ==========

  ipcMain.handle(IPC_CHANNELS.PREDICTION_ADD_FRAME, async (event, landmarks) => {
    try {
      return predictionService.addFrame(landmarks);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PREDICTION_TRIGGER, async () => {
    try {
      return await predictionService.triggerPrediction();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PREDICTION_FORCE, async () => {
    try {
      return await predictionService.forcePrediction();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PREDICTION_CLEAR_BUFFER, async () => {
    try {
      predictionService.clearBuffer();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PREDICTION_GET_BUFFER_STATUS, async () => {
    try {
      return {
        success: true,
        data: predictionService.getBufferStatus(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PREDICTION_GET_HISTORY, async (event, limit) => {
    try {
      return {
        success: true,
        data: predictionService.getHistory(limit),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PREDICTION_CLEAR_HISTORY, async () => {
    try {
      predictionService.clearHistory();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PREDICTION_GET_STATS, async () => {
    try {
      return {
        success: true,
        data: predictionService.getStats(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PREDICTION_RESET_STATS, async () => {
    try {
      stateService.resetStats();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ========== Gesture Handlers ==========

  ipcMain.handle(IPC_CHANNELS.GESTURES_GET_ALL, async () => {
    try {
      return await gestureService.getGestures();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GESTURES_GET_ONE, async (event, id) => {
    try {
      return await gestureService.getGesture(id);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GESTURES_CREATE, async (event, gestureData) => {
    try {
      return await gestureService.createGesture(gestureData);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GESTURES_UPDATE, async (event, id, gestureData) => {
    try {
      return await gestureService.updateGesture(id, gestureData);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GESTURES_DELETE, async (event, id) => {
    try {
      return await gestureService.deleteGesture(id);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GESTURES_GET_STATS, async () => {
    try {
      return await gestureService.getGestureStats();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ========== Model Handlers ==========

  ipcMain.handle(IPC_CHANNELS.MODEL_GET_INFO, async () => {
    try {
      return await modelService.getModelInfo();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_GET_LIST, async () => {
    try {
      return await modelService.getModelList();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_LOAD, async (event, modelPath) => {
    try {
      return await modelService.loadModel(modelPath);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_SWITCH, async (event, modelIdentifier) => {
    try {
      return await modelService.switchModel(modelIdentifier);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_GET_METRICS, async () => {
    try {
      return await modelService.getModelMetrics();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_REFRESH, async () => {
    try {
      return await modelService.refresh();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_UNLOAD, async () => {
    try {
      return modelService.unloadModel();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ========== Training Handlers ==========

  ipcMain.handle(IPC_CHANNELS.TRAINING_START, async (event, trainingConfig) => {
    try {
      return await trainingService.startTraining(trainingConfig);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.TRAINING_STOP, async () => {
    try {
      return await trainingService.stopTraining();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.TRAINING_GET_STATUS, async () => {
    try {
      return await trainingService.getTrainingStatus();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.TRAINING_GET_HISTORY, async () => {
    try {
      return await trainingService.getTrainingHistory();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.TRAINING_VALIDATE, async () => {
    try {
      return await trainingService.validateModel();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.TRAINING_UPLOAD_DATA, async (event, dataPayload) => {
    try {
      return await trainingService.uploadData(dataPayload);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.TRAINING_GET_DATA_LIST, async () => {
    try {
      return await trainingService.getDataList();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.TRAINING_DELETE_DATA, async (event, id) => {
    try {
      return await trainingService.deleteData(id);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ========== API Handlers ==========

  ipcMain.handle(IPC_CHANNELS.API_HEALTH_CHECK, async () => {
    try {
      const result = await apiService.healthCheck();
      
      // Update connection state
      stateService.updateConnection(result.success, result.error || null);
      
      return result;
    } catch (error) {
      stateService.updateConnection(false, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ========== State Handlers ==========

  ipcMain.handle(IPC_CHANNELS.STATE_GET, async (event, path) => {
    try {
      const value = path ? stateService.get(path) : stateService.getState();
      return {
        success: true,
        data: value,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.STATE_RESET, async () => {
    try {
      stateService.resetAll();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ========== System Handlers (from original) ==========

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_INFO, async () => {
    const os = require('os');
    const { app } = require('electron');
    
    try {
      return {
        success: true,
        data: {
          platform: process.platform,
          arch: process.arch,
          version: app.getVersion(),
          electronVersion: process.versions.electron,
          nodeVersion: process.versions.node,
          cpus: os.cpus().length,
          totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ========== Alarm Handlers ==========

  ipcMain.handle(IPC_CHANNELS.ALARMS_GET_ALL, async () => {
    try {
      const alarms = await alarmService.getAll();
      return {
        success: true,
        data: alarms,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.ALARMS_GET_ONE, async (event, id) => {
    try {
      const alarm = await alarmService.getById(id);
      return {
        success: true,
        data: alarm,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.ALARMS_CREATE, async (event, alarmData) => {
    try {
      const alarm = await alarmService.create(alarmData);
      return {
        success: true,
        data: alarm,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.ALARMS_UPDATE, async (event, id, updates) => {
    try {
      const alarm = await alarmService.update(id, updates);
      return {
        success: true,
        data: alarm,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.ALARMS_DELETE, async (event, id) => {
    try {
      await alarmService.delete(id);
      return {
        success: true,
        data: { id },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.ALARMS_TOGGLE, async (event, id, enabled) => {
    try {
      const alarm = await alarmService.toggle(id, enabled);
      return {
        success: true,
        data: alarm,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.ALARMS_CLEAR, async () => {
    try {
      await alarmService.clear();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ========== Device Handlers ==========

  ipcMain.handle(IPC_CHANNELS.DEVICES_GET_ALL, async () => {
    try {
      const devices = await deviceService.getAll();
      return {
        success: true,
        data: devices,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DEVICES_GET_ONE, async (event, id) => {
    try {
      const device = await deviceService.getById(id);
      return {
        success: true,
        data: device,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DEVICES_CREATE, async (event, deviceData) => {
    try {
      const device = await deviceService.create(deviceData);
      return {
        success: true,
        data: device,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DEVICES_UPDATE, async (event, id, updates) => {
    try {
      const device = await deviceService.update(id, updates);
      return {
        success: true,
        data: device,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DEVICES_DELETE, async (event, id) => {
    try {
      await deviceService.delete(id);
      return {
        success: true,
        data: { id },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DEVICES_TOGGLE, async (event, id, enabled) => {
    try {
      const device = await deviceService.toggle(id, enabled);
      return {
        success: true,
        data: device,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DEVICES_GET_BY_TYPE, async (event, type) => {
    try {
      const devices = await deviceService.getByType(type);
      return {
        success: true,
        data: devices,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DEVICES_GET_BY_LOCATION, async (event, location) => {
    try {
      const devices = await deviceService.getByLocation(location);
      return {
        success: true,
        data: devices,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DEVICES_CLEAR, async () => {
    try {
      await deviceService.clear();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ========== Weather Handlers ==========

  ipcMain.handle(IPC_CHANNELS.WEATHER_GET_CURRENT, async (event, lat, lon) => {
    try {
      const weather = await weatherService.getCurrentWeather(lat, lon);
      return {
        success: true,
        data: weather,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.WEATHER_GET_FORECAST, async (event, lat, lon, days) => {
    try {
      const forecast = await weatherService.getWeatherForecast(lat, lon, days);
      return {
        success: true,
        data: forecast,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.WEATHER_CLEAR_CACHE, async () => {
    try {
      weatherService.clearCache();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ========== Window Control Handlers (from original) ==========

  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  // ========== State Event Forwarding ==========
  // Forward state events from stateService to renderer

  stateService.on('connection:changed', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.STATE_CONNECTION_CHANGED, data);
    }
  });

  stateService.on('model:changed', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.STATE_MODEL_CHANGED, data);
    }
  });

  stateService.on('gestures:changed', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.STATE_GESTURES_CHANGED, data);
    }
  });

  stateService.on('prediction:added', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.STATE_PREDICTION_ADDED, data);
    }
  });

  stateService.on('prediction:activeChanged', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.STATE_PREDICTION_ACTIVE_CHANGED, data);
    }
  });

  stateService.on('training:changed', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.STATE_TRAINING_CHANGED, data);
    }
  });

  stateService.on('training:started', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.STATE_TRAINING_STARTED, data);
    }
  });

  stateService.on('training:stopped', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.STATE_TRAINING_STOPPED, data);
    }
  });

  stateService.on('training:progress', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.STATE_TRAINING_PROGRESS, data);
    }
  });

  stateService.on('stats:updated', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.STATE_STATS_UPDATED, data);
    }
  });

  // ========== Alarm/Device/Weather Event Forwarding ==========

  alarmService.on('alarm:created', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('alarm:created', data);
    }
  });

  alarmService.on('alarm:updated', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('alarm:updated', data);
    }
  });

  alarmService.on('alarm:deleted', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('alarm:deleted', data);
    }
  });

  alarmService.on('alarm:toggled', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('alarm:toggled', data);
    }
  });

  deviceService.on('device:created', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('device:created', data);
    }
  });

  deviceService.on('device:updated', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('device:updated', data);
    }
  });

  deviceService.on('device:deleted', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('device:deleted', data);
    }
  });

  deviceService.on('device:toggled', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('device:toggled', data);
    }
  });

  weatherService.on('weather:updated', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('weather:updated', data);
    }
  });

  console.log('IPC handlers initialized successfully');
}

/**
 * Cleanup function for when app closes
 */
function cleanupIpcHandlers() {
  console.log('Cleaning up IPC handlers...');
  
  // Stop training polling
  trainingService.cleanup();
  
  // Remove all listeners
  ipcMain.removeAllListeners();
  stateService.removeAllListeners();
  alarmService.removeAllListeners();
  deviceService.removeAllListeners();
  weatherService.removeAllListeners();
  
  console.log('IPC handlers cleaned up');
}

module.exports = {
  initializeIpcHandlers,
  cleanupIpcHandlers,
};
