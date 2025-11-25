# Helen Backend Guide (Electron)

## Overview

The Helen Electron backend provides IPC communication between the React renderer and the EC2-based gesture recognition API. It handles frame buffering, prediction requests, alarm scheduling, and state management.

---

## 🏗️ Architecture

### Technology Stack

- **Electron** - Desktop application framework
- **Node.js** - JavaScript runtime
- **electron-store** - Persistent data storage
- **EventEmitter** - Event-driven architecture

### Project Structure

```
frontend/electron/
├── core/                      # Core services (shared)
│   ├── apiService.js          # API communication with EC2
│   ├── configService.js       # Configuration management
│   ├── endpoints.js           # API endpoint registry
│   ├── errorHandler.js        # Error handling utilities
│   ├── stateService.js        # Application state management
│   └── validationService.js   # Data validation
│
├── services/                  # Feature-specific services
│   ├── alarmService.js        # Alarm scheduling and persistence
│   └── predictionService.js   # Gesture prediction and buffering
│
└── ipc/                       # IPC handlers
    └── ipcHandlers.js         # IPC event handlers

frontend/
├── main.js                    # Electron main process
└── preload.js                 # Preload script (exposes APIs to renderer)
```

---

## 🚀 Core Services

### 1. API Service (`core/apiService.js`)

Handles HTTP communication with EC2 backend.

**Features**:
- Generic HTTP request methods (GET, POST, PUT, DELETE)
- Request caching with TTL
- Retry logic with exponential backoff
- Error handling and logging

**Key Methods**:

```javascript
// Health check
const status = await apiService.healthCheck();

// Predict gesture
const result = await apiService.predict(landmarksSequence, false);

// Gesture management
const gestures = await apiService.getGestures();
const gesture = await apiService.getGesture(id);
await apiService.createGesture(gestureData);
await apiService.updateGesture(id, gestureData);
await apiService.deleteGesture(id);

// Model management
const modelInfo = await apiService.getModelInfo();
const models = await apiService.getModelList();
await apiService.loadModel(modelPath);
```

**Configuration**:

```javascript
// EC2 Backend URL
const EC2_URL = 'http://13.58.208.156:5000';

// Endpoints
const ENDPOINTS = {
  HEALTH: '/health',
  PREDICT: '/predict',
  GESTURES_LIST: '/gestures',
  MODEL_INFO: '/model/info'
};
```

---

### 2. Prediction Service (`services/predictionService.js`)

Manages frame buffering and prediction requests.

**Features**:
- Frame buffer (40 frames)
- Two-hand validation
- Request queueing
- Debouncing (prevents spam)
- Cooldown between predictions

**Frame Buffer Flow**:

1. Renderer sends landmarks via IPC
2. Service validates frame (126 values, 2 hands)
3. Adds frame to buffer
4. When buffer full (40 frames), triggers prediction
5. Sends to EC2 API
6. Returns result to renderer via IPC

**Key Methods**:

```javascript
// Add frame to buffer
const result = predictionService.addFrame(landmarks);

// Force prediction
const prediction = await predictionService.forcePrediction();

// Get buffer status
const status = predictionService.getBufferStatus();
// Returns: { framesCollected, framesRequired, isReady }

// Clear buffer
predictionService.clearBuffer();

// Get prediction history
const history = predictionService.getHistory(10);

// Get statistics
const stats = predictionService.getStats();
```

**Configuration**:

```javascript
// Config in configService
{
  framesRequired: 40,           // Frames needed for prediction
  detectionIntervalMs: 2000,    // Cooldown between predictions
  confidenceThreshold: 0.7,     // Minimum confidence
  enablePredictionQueue: true,  // Enable request queue
  enableDebugLogging: true      // Debug logs
}
```

---

### 3. Alarm Service (`services/alarmService.js`)

Manages alarm scheduling and persistence.

**Features**:
- Create, read, update, delete alarms
- Persistent storage (electron-store)
- Automatic scheduling (checks every minute)
- Repeat days configuration
- Alarm triggering with notifications

**Key Methods**:

```javascript
// Get all alarms
const alarms = await alarmService.getAll();

// Get alarm by ID
const alarm = await alarmService.getById(id);

// Create alarm
const alarm = await alarmService.create({
  time: "10:30",         // 24-hour format
  label: "Wake up",
  days: [0, 1, 2, 3, 4], // 0=Monday, 6=Sunday
  enabled: true
});

// Update alarm
const alarm = await alarmService.update(id, updates);

// Delete alarm
await alarmService.delete(id);

// Toggle alarm
const alarm = await alarmService.toggle(id, enabled);

// Check alarms for specific time
const alarms = await alarmService.getAlarmsForTime(date);

// Scheduler control
alarmService.startScheduler();
alarmService.stopScheduler();
const status = alarmService.getSchedulerStatus();
```

**Storage Format**:

```json
{
  "alarms": [
    {
      "id": "uuid-v4",
      "time": "10:30",
      "label": "Morning Alarm",
      "days": [0, 1, 2, 3, 4],
      "enabled": true,
      "created_at": "2025-11-23T10:00:00.000Z",
      "updated_at": "2025-11-23T10:00:00.000Z"
    }
  ]
}
```

**Day Mapping**:

```javascript
// 0 = Monday
// 1 = Tuesday
// 2 = Wednesday
// 3 = Thursday
// 4 = Friday
// 5 = Saturday
// 6 = Sunday
```

---

### 4. Validation Service (`core/validationService.js`)

Centralized data validation.

**Features**:
- Frame validation (126 values)
- Sequence validation (40 frames)
- Hand counting
- Alarm data validation
- Gesture data validation

**Key Methods**:

```javascript
// Validate single frame
const result = validationService.validateFrame(landmarks);
// Returns: { valid: boolean, error: string }

// Validate landmarks sequence
const result = validationService.validateLandmarksSequence(sequence, 40);
// Returns: { valid: boolean, error: string }

// Count hands in frame
const count = validationService.countHands(landmarks);
// Returns: 0, 1, or 2

// Validate alarm data
const result = validationService.validateAlarmData(alarmData);
// Returns: { valid: boolean, errors: string[] }

// Validate gesture data
const result = validationService.validateGestureData(gestureData);
// Returns: { valid: boolean, errors: string[] }
```

---

### 5. State Service (`core/stateService.js`)

Manages application state with events.

**Features**:
- Connection state tracking
- Model state management
- Gesture list caching
- Prediction history (max 50)
- Statistics tracking
- Event-driven updates

**State Structure**:

```javascript
{
  connection: {
    isConnected: false,
    lastChecked: null,
    error: null
  },
  model: {
    loaded: false,
    name: null,
    version: null,
    accuracy: null,
    nGestures: 0
  },
  prediction: {
    isActive: false,
    lastPrediction: null,
    history: [],
    maxHistorySize: 50
  },
  stats: {
    totalPredictions: 0,
    successfulPredictions: 0,
    failedPredictions: 0,
    averageConfidence: 0
  }
}
```

**Key Methods**:

```javascript
// Get state
const state = stateService.getState();
const value = stateService.get('prediction.isActive');

// Update connection
stateService.updateConnection(true, null);

// Update model
stateService.updateModel({
  name: 'model_final.pth',
  version: '1.0',
  accuracy: 0.95
});

// Add prediction
stateService.addPrediction({
  success: true,
  gesture: 'INICIO',
  confidence: 0.87
});

// Get statistics
const stats = stateService.getStats();

// Subscribe to events
const unsubscribe = stateService.subscribe('prediction:added', callback);
```

**Events**:

```javascript
'connection:changed'
'model:changed'
'gestures:changed'
'prediction:added'
'prediction:activeChanged'
'prediction:historyCleared'
'training:started'
'training:stopped'
'training:progress'
'stats:updated'
```

---

### 6. Config Service (`core/configService.js`)

Manages configuration settings.

**Default Configuration**:

```javascript
{
  // EC2 Backend
  apiBaseUrl: 'http://13.58.208.156:5000',
  apiTimeout: 10000,
  maxRetries: 3,
  retryDelayMs: 1000,

  // Prediction
  framesRequired: 40,
  detectionIntervalMs: 2000,
  confidenceThreshold: 0.7,
  enablePredictionQueue: true,

  // Caching
  enableCaching: true,
  cacheExpiryMs: 300000, // 5 minutes

  // Logging
  enableDebugLogging: true
}
```

**Key Methods**:

```javascript
// Get config
const config = configService.getConfig();
const value = configService.get('apiBaseUrl');

// Update config
configService.updateConfig({ confidenceThreshold: 0.8 });

// Reset to defaults
configService.resetConfig();

// Subscribe to changes
const unsubscribe = configService.subscribe(callback);
```

---

## 📡 IPC Communication

### IPC Handlers (`ipc/ipcHandlers.js`)

Bridges renderer and main process.

**Channels**:

```javascript
// Prediction
'prediction:add-frame'        // Add frame to buffer
'prediction:force-prediction' // Force prediction
'prediction:get-buffer-status'// Get buffer status
'prediction:clear-buffer'     // Clear frame buffer
'prediction:get-history'      // Get prediction history
'prediction:get-stats'        // Get statistics

// Alarms
'alarms:get-all'             // Get all alarms
'alarms:get'                 // Get alarm by ID
'alarms:create'              // Create new alarm
'alarms:update'              // Update alarm
'alarms:delete'              // Delete alarm
'alarms:toggle'              // Toggle alarm on/off

// State
'state:get'                  // Get application state
'state:subscribe'            // Subscribe to state changes

// Config
'config:get'                 // Get configuration
'config:update'              // Update configuration

// API
'api:health-check'           // Check API health
'api:get-model-info'         // Get model information
```

**IPC Events (Main → Renderer)**:

```javascript
// Prediction results
mainWindow.webContents.send('prediction:result', {
  gesture: 'INICIO',
  confidence: 0.87,
  timestamp: Date.now()
});

// Alarm triggered
mainWindow.webContents.send('alarm:triggered', {
  id: 'uuid',
  time: '10:30',
  label: 'Wake up'
});

// State updates
mainWindow.webContents.send('state:update', stateData);
```

---

## 🔧 Configuration

### Environment Variables

```bash
# EC2 Backend URL
VITE_API_URL=http://13.58.208.156:5000

# Development mode
NODE_ENV=development
```

### Electron Store

Data is persisted in:

**Windows**: `%APPDATA%/helen/config.json`  
**macOS**: `~/Library/Application Support/helen/config.json`  
**Linux**: `~/.config/helen/config.json`

---

## 🧪 Testing

### Manual Testing

```javascript
// Test prediction service
const predictionService = require('./electron/services/predictionService');

// Add test frames
for (let i = 0; i < 40; i++) {
  const landmarks = Array(126).fill(0.5); // Mock landmarks
  predictionService.addFrame(landmarks);
}

// Check buffer
console.log(predictionService.getBufferStatus());

// Force prediction
const result = await predictionService.forcePrediction();
console.log(result);
```

### Debug Logging

Enable debug mode in `configService`:

```javascript
configService.updateConfig({ enableDebugLogging: true });
```

View logs in Electron main process terminal.

---

## 🐛 Troubleshooting

### Prediction Not Working

**Issue**: Frames not triggering predictions

**Solutions**:
1. Check buffer status: `predictionService.getBufferStatus()`
2. Verify EC2 backend is accessible
3. Check frame validation (must have 2 hands, 126 values)
4. Review cooldown settings
5. Check network connectivity

### Alarms Not Triggering

**Issue**: Alarms don't sound at scheduled time

**Solutions**:
1. Verify scheduler is running: `alarmService.getSchedulerStatus()`
2. Check alarm is enabled
3. Verify repeat days configuration
4. Check system time
5. Review main process logs

### IPC Communication Failing

**Issue**: Renderer can't communicate with main process

**Solutions**:
1. Verify IPC handlers are initialized
2. Check preload script is loaded
3. Confirm `electronBackend` is available in renderer
4. Review console for errors
5. Restart Electron

### Storage Issues

**Issue**: Alarms/config not persisting

**Solutions**:
1. Check electron-store is installed
2. Verify write permissions in config directory
3. Clear corrupt config: Delete config.json and restart
4. Check for file system errors

---

## 🚀 Performance

### Optimizations Implemented

1. **Frame Buffering** - Batches frames before sending to API
2. **Request Queue** - Prevents overwhelming EC2 backend
3. **Debouncing** - Cooldown prevents rapid-fire requests
4. **Caching** - API responses cached for 5 minutes
5. **Event Emitters** - Efficient state updates

### Performance Metrics

- Frame processing: <5ms per frame
- Prediction latency: ~500ms (including network)
- Memory usage: Stable, no leaks
- IPC overhead: <1ms per message

---

## 📚 Additional Documentation

### Related Guides
- **[Frontend Guide](../frontend/README.md)** - React components and UI
- **[API Documentation](./api/README.md)** - EC2 API endpoints
- **[ML Service](./ml-service/README.md)** - Model training
- **[Optimization Guide](./OPTIMIZATION_GUIDE.md)** - Performance tips

### External Resources
- [Electron Documentation](https://www.electronjs.org/docs)
- [Node.js Documentation](https://nodejs.org/docs)
- [electron-store](https://github.com/sindresorhus/electron-store)

---

*Last Updated: November 23, 2025*
