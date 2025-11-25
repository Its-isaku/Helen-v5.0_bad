/**
 * IPC Channels: Define all IPC channel names
 * Central registry of all communication channels between main and renderer
 */

const IPC_CHANNELS = {
  // Configuration
  CONFIG_GET: 'config:get',
  CONFIG_UPDATE: 'config:update',
  CONFIG_RESET: 'config:reset',
  CONFIG_TEST_CONNECTION: 'config:testConnection',

  // Prediction
  PREDICTION_ADD_FRAME: 'prediction:addFrame',
  PREDICTION_TRIGGER: 'prediction:trigger',
  PREDICTION_FORCE: 'prediction:forcePredict',
  PREDICTION_CLEAR_BUFFER: 'prediction:clearBuffer',
  PREDICTION_GET_BUFFER_STATUS: 'prediction:getBufferStatus',
  PREDICTION_GET_HISTORY: 'prediction:getHistory',
  PREDICTION_CLEAR_HISTORY: 'prediction:clearHistory',
  PREDICTION_GET_STATS: 'prediction:getStats',
  PREDICTION_RESET_STATS: 'prediction:resetStats',
  PREDICTION_RESULT: 'prediction:result',  // Main -> Renderer: Prediction result from EC2

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

  // API Health
  API_HEALTH_CHECK: 'api:healthCheck',

  // Alarms
  ALARMS_GET_ALL: 'alarms:getAll',
  ALARMS_GET_ONE: 'alarms:getOne',
  ALARMS_CREATE: 'alarms:create',
  ALARMS_UPDATE: 'alarms:update',
  ALARMS_DELETE: 'alarms:delete',
  ALARMS_TOGGLE: 'alarms:toggle',
  ALARMS_CLEAR: 'alarms:clear',

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

  // Weather
  WEATHER_GET_CURRENT: 'weather:getCurrent',
  WEATHER_GET_FORECAST: 'weather:getForecast',
  WEATHER_CLEAR_CACHE: 'weather:clearCache',

  // State Management
  STATE_GET: 'state:get',
  STATE_SUBSCRIBE: 'state:subscribe',
  STATE_UNSUBSCRIBE: 'state:unsubscribe',
  STATE_RESET: 'state:reset',

  // State Events (main -> renderer)
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

  // System (kept from original)
  SYSTEM_GET_INFO: 'system:getInfo',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  // Menu Events (from main process)
  MENU_OPEN_SETTINGS: 'menu:openSettings',
  MENU_OPEN_ABOUT: 'menu:openAbout',
};

// Valid channels for renderer to main communication
const VALID_INVOKE_CHANNELS = [
  // Config
  IPC_CHANNELS.CONFIG_GET,
  IPC_CHANNELS.CONFIG_UPDATE,
  IPC_CHANNELS.CONFIG_RESET,
  IPC_CHANNELS.CONFIG_TEST_CONNECTION,

  // Prediction
  IPC_CHANNELS.PREDICTION_ADD_FRAME,
  IPC_CHANNELS.PREDICTION_TRIGGER,
  IPC_CHANNELS.PREDICTION_FORCE,
  IPC_CHANNELS.PREDICTION_CLEAR_BUFFER,
  IPC_CHANNELS.PREDICTION_GET_BUFFER_STATUS,
  IPC_CHANNELS.PREDICTION_GET_HISTORY,
  IPC_CHANNELS.PREDICTION_CLEAR_HISTORY,
  IPC_CHANNELS.PREDICTION_GET_STATS,
  IPC_CHANNELS.PREDICTION_RESET_STATS,

  // Gestures
  IPC_CHANNELS.GESTURES_GET_ALL,
  IPC_CHANNELS.GESTURES_GET_ONE,
  IPC_CHANNELS.GESTURES_CREATE,
  IPC_CHANNELS.GESTURES_UPDATE,
  IPC_CHANNELS.GESTURES_DELETE,
  IPC_CHANNELS.GESTURES_GET_STATS,

  // Model
  IPC_CHANNELS.MODEL_GET_INFO,
  IPC_CHANNELS.MODEL_GET_LIST,
  IPC_CHANNELS.MODEL_LOAD,
  IPC_CHANNELS.MODEL_SWITCH,
  IPC_CHANNELS.MODEL_GET_METRICS,
  IPC_CHANNELS.MODEL_REFRESH,
  IPC_CHANNELS.MODEL_UNLOAD,

  // Training
  IPC_CHANNELS.TRAINING_START,
  IPC_CHANNELS.TRAINING_STOP,
  IPC_CHANNELS.TRAINING_GET_STATUS,
  IPC_CHANNELS.TRAINING_GET_HISTORY,
  IPC_CHANNELS.TRAINING_VALIDATE,
  IPC_CHANNELS.TRAINING_UPLOAD_DATA,
  IPC_CHANNELS.TRAINING_GET_DATA_LIST,
  IPC_CHANNELS.TRAINING_DELETE_DATA,

  // API
  IPC_CHANNELS.API_HEALTH_CHECK,

  // Alarms
  IPC_CHANNELS.ALARMS_GET_ALL,
  IPC_CHANNELS.ALARMS_GET_ONE,
  IPC_CHANNELS.ALARMS_CREATE,
  IPC_CHANNELS.ALARMS_UPDATE,
  IPC_CHANNELS.ALARMS_DELETE,
  IPC_CHANNELS.ALARMS_TOGGLE,
  IPC_CHANNELS.ALARMS_CLEAR,

  // Devices
  IPC_CHANNELS.DEVICES_GET_ALL,
  IPC_CHANNELS.DEVICES_GET_ONE,
  IPC_CHANNELS.DEVICES_CREATE,
  IPC_CHANNELS.DEVICES_UPDATE,
  IPC_CHANNELS.DEVICES_DELETE,
  IPC_CHANNELS.DEVICES_TOGGLE,
  IPC_CHANNELS.DEVICES_GET_BY_TYPE,
  IPC_CHANNELS.DEVICES_GET_BY_LOCATION,
  IPC_CHANNELS.DEVICES_CLEAR,

  // Weather
  IPC_CHANNELS.WEATHER_GET_CURRENT,
  IPC_CHANNELS.WEATHER_GET_FORECAST,
  IPC_CHANNELS.WEATHER_CLEAR_CACHE,

  // State
  IPC_CHANNELS.STATE_GET,
  IPC_CHANNELS.STATE_RESET,

  // System
  IPC_CHANNELS.SYSTEM_GET_INFO,
];

// Valid channels for one-way main to renderer send
const VALID_SEND_CHANNELS = [
  IPC_CHANNELS.WINDOW_MINIMIZE,
  IPC_CHANNELS.WINDOW_MAXIMIZE,
  IPC_CHANNELS.WINDOW_CLOSE,
];

// Valid channels for renderer to listen to from main
const VALID_ON_CHANNELS = [
  // Menu events
  IPC_CHANNELS.MENU_OPEN_SETTINGS,
  IPC_CHANNELS.MENU_OPEN_ABOUT,

  // State events
  IPC_CHANNELS.STATE_CONNECTION_CHANGED,
  IPC_CHANNELS.STATE_MODEL_CHANGED,
  IPC_CHANNELS.STATE_GESTURES_CHANGED,
  IPC_CHANNELS.STATE_PREDICTION_ADDED,
  IPC_CHANNELS.STATE_PREDICTION_ACTIVE_CHANGED,
  IPC_CHANNELS.STATE_TRAINING_CHANGED,
  IPC_CHANNELS.STATE_TRAINING_STARTED,
  IPC_CHANNELS.STATE_TRAINING_STOPPED,
  IPC_CHANNELS.STATE_TRAINING_PROGRESS,
  IPC_CHANNELS.STATE_STATS_UPDATED,

  // Alarm/Device events
  'alarm:created',
  'alarm:updated',
  'alarm:deleted',
  'alarm:toggled',
  'alarm:triggered',
  'device:created',
  'device:updated',
  'device:deleted',
  'device:toggled',
  'weather:updated',

  // Prediction events
  IPC_CHANNELS.PREDICTION_RESULT,
];

module.exports = {
  IPC_CHANNELS,
  VALID_INVOKE_CHANNELS,
  VALID_SEND_CHANNELS,
  VALID_ON_CHANNELS,
};
