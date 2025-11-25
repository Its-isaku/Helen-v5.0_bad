# Helen Electron Backend Integration

## Overview

This directory contains the complete backend integration architecture for the Helen Sign Language Recognition System in Electron. The implementation follows **SOLID** and **DRY** principles with a clean separation of concerns.

---

## Architecture

```
frontend/electron/backend/
├── core/                   # Core infrastructure services
│   ├── apiService.js       # HTTP client for FastAPI/ML service
│   ├── configService.js    # Configuration management
│   ├── endpoints.js        # API endpoint registry
│   ├── errorHandler.js     # Centralized error handling
│   └── stateService.js     # Application state management
├── services/               # Domain-specific business services
│   ├── alarmService.js     # Alarm CRUD operations (electron-store)
│   ├── deviceService.js    # Device CRUD operations (electron-store)
│   ├── gestureService.js   # Gesture CRUD operations
│   ├── modelService.js     # Model management
│   ├── predictionService.js # Prediction with queuing/debouncing
│   ├── trainingService.js  # Training operations
│   └── weatherService.js   # Weather API integration (OpenWeatherMap)
└── ipc/                    # IPC communication layer
    ├── ipcChannels.js      # IPC channel definitions
    ├── ipcExpose.js        # Secure API exposure (preload)
    └── ipcHandlers.js      # IPC request handlers (main)
```

---

## Design Principles

### SOLID Compliance

1. **Single Responsibility Principle (SRP)**
   - Each service has one clear responsibility
   - `apiService`: HTTP communication
   - `configService`: Configuration management
   - `predictionService`: Prediction logic and queuing
   - `stateService`: State management
   - etc.

2. **Open/Closed Principle (OCP)**
   - Services are open for extension via inheritance
   - Closed for modification - add new services instead of modifying existing ones

3. **Liskov Substitution Principle (LSP)**
   - All services follow consistent interfaces
   - Services can be mocked/replaced for testing

4. **Interface Segregation Principle (ISP)**
   - IPC channels are segregated by functionality
   - Renderer only has access to methods it needs

5. **Dependency Inversion Principle (DIP)**
   - Services depend on abstractions (other services) not concrete implementations
   - Easy to swap implementations (e.g., different API clients)

### DRY (Don't Repeat Yourself)

- **No hardcoded URLs**: All configuration in `configService`
- **Centralized error handling**: `errorHandler` used throughout
- **Reusable API client**: `apiService` shared by all services
- **Single IPC definition**: `ipcChannels` defines all channels once

---

## Data Flow

```
Renderer (React Components)
    ↓ (window.electronBackend.*)
Preload (contextBridge)
    ↓ (IPC channels)
Main Process (IPC Handlers)
    ↓ (Service calls)
Backend Services
    ↓ (HTTP)
FastAPI / ML Service
```

### Example: Prediction Flow

1. **Renderer**: MediaPipe extracts hand landmarks from video
2. **Renderer**: Calls `electronBackend.prediction.addFrame(landmarks)`
3. **Preload**: Forwards via IPC channel `prediction:addFrame`
4. **Main**: IPC handler receives request
5. **PredictionService**: Accumulates frames (40 required)
6. **PredictionService**: Queues prediction request
7. **ApiService**: POSTs to `/predict` endpoint
8. **StateService**: Stores prediction result
9. **IPC Event**: Broadcasts `state:predictionAdded` to renderer
10. **Renderer**: Updates UI with gesture name and confidence

---

## Services

### API Services

#### `configService.js`
- Loads configuration from `electron-store`
- Validates config updates
- Provides API endpoint URLs
- No hardcoded values

**Methods:**
- `getConfig()`: Get current config
- `updateConfig(updates)`: Update and persist config
- `resetToDefaults()`: Reset to defaults
- `testConnection(url)`: Test API connectivity

#### `apiService.js`
- Unified HTTP client for all backend communication
- Request/response formatting
- Retry logic with exponential backoff
- Caching for performance

**Methods:**
- `get(url, options)`: GET request
- `post(url, data, options)`: POST request
- `put(url, data, options)`: PUT request
- `delete(url, options)`: DELETE request
- `healthCheck()`: Check API health
- `predict(landmarks, returnProbabilities)`: Predict gesture

#### `errorHandler.js`
- Categorizes errors (network, timeout, API, validation, etc.)
- User-friendly error messages in Spanish
- Determines if errors are retryable
- Validates landmark data structure

**Methods:**
- `handleError(error, context)`: Handle and categorize error
- `retryWithBackoff(fn, maxRetries, baseDelay)`: Retry with exponential backoff
- `validateLandmarks(landmarks)`: Validate 40-frame sequences
- `createErrorResponse(error, context)`: Standardized error response
- `createSuccessResponse(data)`: Standardized success response

#### `predictionService.js`
- Accumulates 40 frames of landmarks
- Request queuing to prevent overwhelming backend
- Debouncing for rapid requests
- Confidence threshold filtering

**Methods:**
- `addFrame(landmarks)`: Add frame to buffer
- `triggerPrediction()`: Trigger prediction when ready
- `forcePrediction()`: Force prediction with current buffer
- `clearBuffer()`: Clear frame buffer
- `getBufferStatus()`: Get buffer state
- `getHistory(limit)`: Get prediction history
- `clearHistory()`: Clear prediction history

#### `gestureService.js`
- CRUD operations for gestures
- Gesture statistics
- State synchronization

**Methods:**
- `getGestures()`: List all gestures
- `getGesture(id)`: Get one gesture
- `createGesture(data)`: Create new gesture
- `updateGesture(id, data)`: Update gesture
- `deleteGesture(id)`: Delete gesture
- `getGestureStats()`: Get gesture statistics

#### `modelService.js`
- Model information retrieval
- Model switching/loading
- Performance metrics

**Methods:**
- `getModelInfo()`: Get current model info
- `getModelList()`: List available models
- `loadModel(path)`: Load specific model
- `switchModel(identifier)`: Switch to different model
- `getModelMetrics()`: Get performance metrics
- `refresh()`: Refresh model info

#### `trainingService.js`
- Training lifecycle management
- Progress tracking with polling
- Data upload/management

**Methods:**
- `startTraining(config)`: Start training
- `stopTraining()`: Stop training
- `getTrainingStatus()`: Get current status
- `getTrainingHistory()`: Get training history
- `validateModel()`: Validate trained model
- `uploadData(data)`: Upload training data
- `getDataList()`: List training data
- `deleteData(id)`: Delete training data

#### `stateService.js`
- EventEmitter-based state management
- Tracks connection, model, gestures, predictions, training
- Broadcasts state changes to renderer

**Methods:**
- `getState()`: Get full state
- `get(path)`: Get state by path (e.g., 'model.loaded')
- `updateConnection(isConnected, error)`: Update connection state
- `updateModel(data)`: Update model state
- `updateGestures(list)`: Update gestures list
- `addPrediction(prediction)`: Add prediction to history
- `updateTraining(data)`: Update training state

**Events:**
- `connection:changed`
- `model:changed`
- `gestures:changed`
- `prediction:added`
- `training:progress`
- etc.

#### `endpoints.js`
- Registry of all API endpoints
- Builds full URLs using `configService`

---

### IPC Layer

#### `ipcChannels.js`
- Defines all IPC channel names
- Whitelists for security
- No magic strings in code

#### `ipcHandlers.js` (Main Process)
- Handles all IPC requests
- Delegates to appropriate services
- Forwards state events to renderer

#### `ipcExpose.js` (Preload)
- Exposes secure API via `contextBridge`
- Only whitelisted methods available to renderer
- No direct IPC access from renderer

---

## Configuration

Configuration is managed by `configService` and stored in `electron-store`.

### Default Configuration

```javascript
{
  apiUrl: 'http://localhost:8000',
  apiTimeout: 30000,
  confidenceThreshold: 0.7,
  framesRequired: 40,
  frameDelayMs: 75,
  detectionIntervalMs: 3000,
  cameraDevice: 'default',
  maxRetries: 3,
  retryDelayMs: 1000,
  connectionTimeout: 5000,
  enableDebugLogging: false,
  enablePredictionQueue: true,
  enableCaching: true,
}
```

### Environment Variables

Configuration can be overridden with environment variables:

- `VITE_API_URL`: API base URL
- `VITE_ML_SERVICE_URL`: ML service URL (if different)
- `VITE_API_TIMEOUT`: Request timeout in ms
- `NODE_ENV=development`: Enables debug logging

---

## Usage in Renderer

### Import the backend bridge

```javascript
import { electronBackend } from '@/services/electronBackend';
```

### Prediction

```javascript
// Add frame from MediaPipe
const result = await electronBackend.prediction.addFrame(landmarks);

// Get buffer status
const status = await electronBackend.prediction.getBufferStatus();
console.log(`Frames: ${status.data.framesCollected}/${status.data.framesRequired}`);

// Get prediction history
const history = await electronBackend.prediction.getHistory(10);
```

### Gestures

```javascript
// Get all gestures
const result = await electronBackend.gestures.getAll();
if (result.success) {
  console.log('Gestures:', result.data.gestures);
}

// Create new gesture
await electronBackend.gestures.create({
  name: 'hello',
  description: 'Wave hand'
});
```

### Model

```javascript
// Get model info
const result = await electronBackend.model.getInfo();
console.log('Model:', result.data.name, 'Accuracy:', result.data.accuracy);

// Switch model
await electronBackend.model.switch('model_v2.pth');
```

### Training

```javascript
// Start training
await electronBackend.training.start({
  epochs: 50,
  batch_size: 32,
  learning_rate: 0.001
});

// Monitor progress with event listener
const unsubscribe = electronBackend.state.onTrainingProgress((data) => {
  console.log(`Epoch ${data.currentEpoch}/${data.totalEpochs}`);
  console.log(`Loss: ${data.loss}, Accuracy: ${data.accuracy}`);
});

// Stop listening
unsubscribe();
```

### State Events

```javascript
// Listen for prediction results
const unsubscribe = electronBackend.state.onPredictionAdded((prediction) => {
  if (prediction.success) {
    console.log('Gesture:', prediction.data.gesture);
    console.log('Confidence:', prediction.data.confidence);
  }
});

// Cleanup
unsubscribe();
```

### Configuration

```javascript
// Get current config
const config = await electronBackend.config.get();

// Update config
await electronBackend.config.update({
  confidenceThreshold: 0.8,
  apiUrl: 'http://192.168.1.100:8000'
});

// Test connection
const result = await electronBackend.config.testConnection();
if (result.success) {
  console.log('Backend is reachable');
}
```

### Health Check

```javascript
// Check backend health
const result = await electronBackend.api.healthCheck();
if (result.success) {
  console.log('API is healthy');
  console.log('Model loaded:', result.data.model_loaded);
  console.log('Device:', result.data.device);
}
```

---

## Error Handling

All backend methods return a standardized response:

### Success Response

```javascript
{
  success: true,
  data: { /* response data */ },
  timestamp: '2025-11-02T12:00:00.000Z'
}
```

### Error Response

```javascript
{
  success: false,
  error: 'User-friendly error message in Spanish',
  category: 'network', // network, timeout, api, validation, camera, mediapipe, unknown
  retryable: true,
  timestamp: '2025-11-02T12:00:00.000Z'
}
```

### Example Error Handling

```javascript
const result = await electronBackend.prediction.addFrame(landmarks);

if (!result.success) {
  console.error('Error:', result.error);
  
  if (result.retryable) {
    // Show "Retry" button to user
  } else {
    // Show error message, no retry option
  }
}
```

---

## Testing

### Mock Backend for Development

When not in Electron (e.g., browser development):

```javascript
import { isElectronBackendAvailable } from '@/services/electronBackend';

if (!isElectronBackendAvailable()) {
  console.warn('Running without Electron backend - using mock data');
  // Use mock data or HTTP fallback
}
```

### Testing Services

All services are testable in isolation:

```javascript
const configService = require('./api/configService');
const apiService = require('./api/apiService');

// Mock dependencies
jest.mock('./api/configService');
configService.getConfig.mockReturnValue({ apiUrl: 'http://test' });

// Test apiService
const result = await apiService.healthCheck();
```

---

## Performance Optimizations

1. **Request Queuing**: Prediction requests are queued to prevent overwhelming the backend
2. **Debouncing**: Rapid prediction requests are debounced (100ms)
3. **Caching**: GET requests are cached for 5 minutes (configurable)
4. **Detection Interval**: Predictions have a cooldown period (3 seconds default)
5. **Retry Logic**: Failed requests are automatically retried with exponential backoff
6. **State Management**: State changes are batched and broadcast to renderer only when needed

---

## Security

1. **Context Isolation**: Renderer has no direct access to Node.js or Electron APIs
2. **Whitelisted Channels**: Only specific IPC channels are exposed
3. **Input Validation**: All data is validated before sending to backend
4. **No Secrets in Renderer**: API keys, paths, etc. are only in main process
5. **Secure Communication**: All backend calls go through main process

---

## Migration from Tauri

### What Changed

- **Tauri `invoke()` → Electron `electronBackend.*`**
- **Direct HTTP calls → IPC to main process → HTTP**
- **Rust backend → Node.js main process**
- **`window.__TAURI__` → `window.electronBackend`**

### Old (Tauri)

```javascript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('predict_gesture', { landmarks });
```

### New (Electron)

```javascript
import { electronBackend } from '@/services/electronBackend';

const result = await electronBackend.prediction.addFrame(landmarks);
```

---

## Troubleshooting

### Backend not available

```javascript
if (!isElectronBackendAvailable()) {
  console.error('Not running in Electron');
}
```

### Connection errors

```javascript
const result = await electronBackend.api.healthCheck();
if (!result.success) {
  console.error('Backend not reachable:', result.error);
  // Check if backend server is running
  // Check apiUrl in config
}
```

### Debug logging

Enable debug logging in config:

```javascript
await electronBackend.config.update({
  enableDebugLogging: true
});
```

Check console for detailed logs:
- `🌐 GET http://localhost:8000/health`
- `✅ Response from http://localhost:8000/health`
- `❌ Error: ...`

---

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Offline mode with local caching
- [ ] Background prediction processing
- [ ] Model preloading for faster startup
- [ ] Training progress visualization
- [ ] Batch prediction support
- [ ] Multi-hand gesture recognition

---

## Contributing

When adding new backend features:

1. Add service to `electron/backend/api/` with single responsibility
2. Add IPC channels to `ipcChannels.js`
3. Add handlers to `ipcHandlers.js`
4. Expose in `ipcExpose.js`
5. Add to `electronBackend.js` bridge
6. Document in this README
7. Ensure SOLID/DRY compliance

---

## License

Same as Helen project license.
