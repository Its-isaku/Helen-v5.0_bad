# Helen Frontend Guide

## Overview

The Helen frontend is built with **React 18** and **Electron**, providing a modern desktop application for gesture-controlled smart home interfaces. The application uses MediaPipe for hand tracking and communicates with an EC2-based backend for gesture recognition.

---

## 🏗️ Architecture

### Technology Stack

- **React 18** - UI framework
- **Electron** - Desktop application framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **MediaPipe Hands** - Hand landmark detection
- **Context API** - State management

### Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── alarms/       # Alarm-related components
│   │   ├── common/       # Shared components
│   │   ├── devices/      # Device control components
│   │   ├── glass/        # Glassmorphism UI components
│   │   ├── input/        # Input handling components
│   │   ├── layout/       # Layout components
│   │   └── wifi/         # WiFi configuration components
│   │
│   ├── contexts/         # React Context providers
│   │   ├── alarm/        # Alarm notification context
│   │   ├── camera/       # Camera control context
│   │   ├── gesture/      # Gesture navigation context
│   │   ├── inactivity/   # Inactivity detection context
│   │   └── theme/        # Theme management context
│   │
│   ├── screens/          # Main application screens
│   │   ├── alarms/       # Alarms management screen
│   │   ├── devices/      # Devices control screen
│   │   ├── home/         # Home screen
│   │   ├── lock/         # Lock screen
│   │   ├── settings/     # Settings screen
│   │   └── weather/      # Weather screen
│   │
│   ├── services/         # API and service integrations
│   │   ├── api/          # API client services
│   │   ├── audio/        # Audio services
│   │   ├── camera/       # Camera services
│   │   └── gesture/      # Gesture services
│   │
│   ├── utils/            # Utility functions
│   │   ├── timeUtils.js      # Time conversion utilities
│   │   ├── validation.js     # Validation functions
│   │   └── performance.js    # Performance utilities
│   │
│   ├── hooks/            # Custom React hooks
│   │   └── useOptimisticUpdate.js
│   │
│   ├── config/           # Configuration files
│   │   └── constants.js  # Application constants
│   │
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # React entry point
│   └── index.css         # Global styles
│
├── electron/             # Electron backend services
│   ├── core/             # Core services
│   ├── ipc/              # IPC handlers
│   └── services/         # Feature services
│
├── main.js               # Electron main process
├── preload.js            # Electron preload script
├── package.json          # Dependencies and scripts
└── vite.config.js        # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Webcam** (for gesture detection)

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://13.58.208.156:5000
```

### Development

```bash
# Start Vite dev server (React app)
npm run dev

# In another terminal, start Electron
npm run electron
```

The application will open in an Electron window with hot reload enabled.

### Production Build

```bash
# Build React app
npm run build

# Package Electron app
npm run package

# Create installer
npm run make
```

---

## 📱 Application Screens

### Lock Screen
- Entry point of the application
- Unlocks via touch or gesture
- Automatically locks after 1 minute of inactivity

### Home Screen
- Central hub with quick access to all features
- Displays time, date, and weather
- Camera toggle for gesture mode
- Theme selector
- WiFi configuration

### Alarms Screen
- Create, edit, and delete alarms (max 10)
- Set alarm time with 12-hour format
- Configure repeat days (Monday-Sunday)
- Toggle alarms on/off
- Visual feedback for active alarms

### Devices Screen
- Control smart home devices (max 10)
- Toggle devices on/off
- Organize by location and type
- Edit device settings

### Weather Screen
- Current weather conditions
- Temperature and forecast
- Location-based weather data

### Settings Screen
- System configuration
- WiFi settings
- Help documentation
- System information

---

## 🎨 UI Components

### Glass Components

All UI elements use a glassmorphism design system:

- **GlassCard** - Container with glass effect
- **GlassButton** - Interactive button
- **GlassModal** - Modal dialog
- **GlassContainer** - Layout container

### Layout Components

- **AppLayout** - Main application layout
- **Background** - Animated background
- **ScreenHeader** - Screen title with actions
- **GlassFoundation** - Base layout foundation

### Input Components

- **CentralCircle** - Main gesture detection area
- **CameraFeedback** - Visual feedback for gestures
- **TouchHandler** - Touch/click event handler

---

## 🎯 Gesture Navigation

### Supported Gestures

| Gesture | Action | Screen |
|---------|--------|--------|
| **INICIO** | Navigate to Home | Any |
| **ALARMA** | Navigate to Alarms | Any |
| **CLIMA** | Navigate to Weather | Any |
| **DISPOSITIVOS** | Navigate to Devices | Any |
| **CONFIGURACION** | Navigate to Settings | Any |
| **WIFI** | Open WiFi modal | Home |
| **TEMA** | Open theme selector | Home |
| **CAMARA** | Toggle camera | Home |
| **AGREGAR** | Add new item | Alarms/Devices |
| **EDITAR** | Toggle edit mode | Alarms/Devices |

### Gesture Detection Flow

1. **MediaPipe** detects hands and extracts landmarks
2. Landmarks sent to **Electron backend** (40 frames buffered)
3. Backend sends to **EC2 API** for prediction
4. Prediction result sent back to renderer via IPC
5. **GestureNavigationContext** executes appropriate action

---

## 🔌 Context API

### CameraContext

Manages camera state and gesture detection:

```javascript
const {
  isCameraActive,
  isDetecting,
  cameraMode,
  toggleCamera,
  startCamera,
  stopCamera
} = useCamera();
```

### GestureNavigationContext

Handles gesture-based navigation:

```javascript
const {
  lastGesture,
  pendingModalGesture,
  executeGestureAction,
  clearPendingModal
} = useGestureNavigation();
```

### ThemeContext

Manages application themes:

```javascript
const {
  currentTheme,
  availableThemes,
  changeTheme
} = useTheme();
```

### InactivityContext

Monitors user activity and locks screen:

```javascript
const {
  handleActivity,
  resetInactivityTimer
} = useInactivity();
```

### AlarmNotificationContext

Manages global alarm notifications:

```javascript
const {
  triggeredAlarm,
  isAlarmNotificationOpen,
  dismissAlarm
} = useAlarmNotification();
```

---

## 🛠️ Services

### Camera Service (`services/camera/cameraService.js`)

Manages camera stream and MediaPipe integration:

```javascript
// Start camera with gesture detection
await cameraService.start(videoElement);

// Stop camera
await cameraService.stop();

// Subscribe to detections
const unsubscribe = cameraService.subscribe(callback);
```

### Gesture Service (`services/gesture/gestureService.js`)

Handles gesture prediction via Electron backend:

```javascript
// Initialize with video element
await gestureService.initialize(videoElement);

// Subscribe to predictions
gestureService.subscribe((prediction) => {
  console.log(prediction.gesture, prediction.confidence);
});

// Cleanup
await gestureService.cleanup();
```

### MediaPipe Service (`services/gesture/mediaPipeService.js`)

Provides hand landmark detection:

```javascript
// Initialize MediaPipe
await mediaPipeService.initialize(videoElement, onResultsCallback);

// Start processing
await mediaPipeService.start();

// Stop processing
await mediaPipeService.stop();
```

### Alarm Service (`services/api/alarmService.js`)

Manages alarms via API:

```javascript
// Fetch all alarms
const alarms = await alarmService.fetchAlarms();

// Create alarm
const alarm = await alarmService.createAlarm({
  time: "10:30",
  label: "Wake up",
  days: [0, 1, 2, 3, 4] // Monday-Friday
});

// Update alarm
await alarmService.updateAlarm(id, updates);

// Delete alarm
await alarmService.deleteAlarm(id);

// Toggle alarm
await alarmService.toggleAlarm(id);
```

### Device Service (`services/api/deviceService.js`)

Manages smart home devices:

```javascript
// Fetch devices
const devices = await fetchDevices();

// Add device
const device = await addDevice({
  name: "Living Room Light",
  type: "light",
  location: "Living Room"
});

// Toggle device
await toggleDevice(id, enabled);
```

---

## 🎨 Theming

### Available Themes

- **Ocean** (default) - Blue tones
- **Sunset** - Orange/pink tones
- **Forest** - Green tones
- **Lavender** - Purple tones
- **Rose** - Pink/red tones

### Theme Structure

```javascript
{
  id: 'ocean',
  name: 'Ocean',
  backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  primaryColor: '#667eea',
  secondaryColor: '#764ba2',
  accentColor: '#f093fb'
}
```

### Custom Theme

Add new themes in `config/constants.js`:

```javascript
export const THEMES = {
  // ... existing themes
  CUSTOM: {
    id: 'custom',
    name: 'Custom Theme',
    backgroundColor: 'linear-gradient(135deg, #color1 0%, #color2 100%)',
    primaryColor: '#color1',
    secondaryColor: '#color2',
    accentColor: '#color3'
  }
};
```

---

## 🔧 Configuration

### Constants (`config/constants.js`)

```javascript
// Routes
export const ROUTES = {
  LOCK: '/lock',
  HOME: '/home',
  ALARMS: '/alarms',
  WEATHER: '/weather',
  DEVICES: '/devices',
  SETTINGS: '/settings'
};

// Camera config
export const CAMERA_CONFIG = {
  FEEDBACK_DURATION: 1000,    // Visual feedback duration (ms)
  DETECTION_COOLDOWN: 2000,   // Cooldown between detections (ms)
  MIN_CONFIDENCE: 0.7         // Minimum confidence threshold
};

// API config
export const API_CONFIG = {
  BASE_URL: 'http://13.58.208.156:5000',
  TIMEOUT: 10000
};
```

---

## 📊 Performance Optimizations

### Implemented Optimizations

1. **Lazy Loading** - All screens are lazy-loaded
2. **Memoization** - Context values and callbacks are memoized
3. **Stable References** - Using `useRef` to prevent unnecessary re-renders
4. **Code Splitting** - Route-based code splitting
5. **Optimistic Updates** - UI updates before API confirmation
6. **Memory Management** - Proper cleanup of event listeners

### Performance Metrics

- Initial bundle size: ~250KB (gzipped)
- Time to Interactive: <2s
- Re-renders per navigation: ~7 (40% reduction)
- Memory growth: ~0.5MB per hour (75% reduction)

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Camera starts/stops correctly
- [ ] Gestures are detected with visual feedback
- [ ] Navigation works (touch and gesture)
- [ ] Alarms can be created/edited/deleted
- [ ] Devices can be controlled
- [ ] Screen locks after 1 minute of inactivity
- [ ] Theme changes persist
- [ ] All screens render correctly

### Debug Mode

Enable debug logging in development:

```javascript
// In browser console
localStorage.setItem('DEBUG', 'true');
```

View logs in:
- Browser DevTools Console
- Electron Main Process Terminal

---

## 🐛 Troubleshooting

### Camera Not Starting

**Issue**: Camera fails to initialize

**Solutions**:
- Check camera permissions in browser/OS
- Verify MediaPipe CDN is accessible
- Check console for error messages
- Try refreshing the application

### Gestures Not Detected

**Issue**: Hand gestures not recognized

**Solutions**:
- Ensure both hands are visible in camera
- Check lighting conditions
- Verify EC2 backend is running
- Check network connectivity
- Review console logs for prediction errors

### Navigation Not Working

**Issue**: Touch/gesture navigation fails

**Solutions**:
- Check if `electronBackend` is available
- Verify IPC handlers are initialized
- Check prediction confidence threshold
- Review GestureNavigationContext logs

### Alarms Not Triggering

**Issue**: Alarms don't sound at scheduled time

**Solutions**:
- Verify alarm scheduler is running (check main process logs)
- Confirm alarm is enabled
- Check system time is correct
- Verify repeat days are configured correctly

### Build Errors

**Issue**: Build fails with errors

**Solutions**:
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`
- Check Node.js version (requires 18+)
- Verify all dependencies are installed

---

## 🚀 Deployment

### Building for Production

```bash
# 1. Build React app
npm run build

# 2. Test production build
npm run electron

# 3. Package for distribution
npm run package

# 4. Create installer (Windows/macOS/Linux)
npm run make
```

### Electron Forge Configuration

Edit `forge.config.js` to customize packaging:

```javascript
module.exports = {
  packagerConfig: {
    name: 'Helen',
    icon: './assets/icon',
    asar: true
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Helen'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux']
    }
  ]
};
```

### Environment-Specific Builds

```bash
# Development build
NODE_ENV=development npm run build

# Production build
NODE_ENV=production npm run build
```

---

## 📚 Additional Resources

### Documentation
- [React Documentation](https://react.dev)
- [Electron Documentation](https://www.electronjs.org/docs)
- [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html)
- [Vite Documentation](https://vitejs.dev)

### Helen Project Docs
- [Backend Guide](../backend/README.md)
- [Optimization Guide](./OPTIMIZATION_GUIDE.md)
- [Architecture Overview](../architecture/system-overview.md)

---

## 🤝 Contributing

### Code Style

- Use functional components with hooks
- Follow ESLint configuration
- Use meaningful variable names
- Add JSDoc comments for functions
- Keep components under 300 lines

### Pull Request Process

1. Create feature branch from `refactor-helen-electron`
2. Implement changes with tests
3. Update documentation
4. Submit PR with clear description

---

## 📄 License

This project is part of the Helen smart home system.

---

*Last Updated: November 23, 2025*
