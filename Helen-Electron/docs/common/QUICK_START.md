# 🚀 Quick Start Guide - Option B Migration

## What Was Done

**Complete migration from Tauri/HTTP to unified Electron architecture.**

All frontend services (`alarmService`, `deviceService`, `weatherService`, `gestureService`, `cameraService`) now use the Electron backend via IPC instead of Tauri or direct HTTP.

---

## 🏃‍♂️ Quick Start (1 Step!)

### Start Electron App (Auto-starts Backend)
```powershell
cd frontend
npm run dev
```

The FastAPI backend will automatically start when Electron launches!

Expected output:
```
🚀 Starting FastAPI backend...
[Backend] INFO:     Started server process
[Backend] INFO:     Uvicorn running on http://localhost:8000
✅ Electron window opens
```
### Test Features
- ✅ **Alarms**: Go to Alarms screen → Create alarm
- ✅ **Devices**: Go to My Devices → Add device
- ✅ **Weather**: Check HomeScreen for weather widget
- ✅ **Gestures**: Open gesture recognition → Allow camera → Wave hand

**Note**: Backend starts automatically and stops when you close Electron. No need to manage it separately!

---

## 📦 What Changed

### Files Created (3 backend services)
```
frontend/electron/backend/api/
  ├── alarmService.js      (145 lines)
  ├── deviceService.js     (163 lines)
  └── weatherService.js    (243 lines)
```

### Files Modified (8 files)
```
frontend/electron/backend/ipc/
  ├── ipcChannels.js       (+30 lines)
  ├── ipcHandlers.js       (+270 lines)
  └── ipcExpose.js         (+95 lines)

frontend/src/services/
  ├── electronBackend.js   (+155 lines)
  ├── alarmService.js      (Rewritten - 58 lines)
  ├── deviceService.js     (Rewritten - 72 lines)
  ├── weatherService.js    (Simplified)
  ├── gestureService.js    (Rewritten - 179 lines)
  ├── cameraService.js     (Simplified - 95 lines)
  └── apiClient.js         (+Deprecation warning)
```

---

## 🎯 Key Improvements

| Feature | Before | After |
|---------|--------|-------|
| **Alarms** | Tauri IPC (Rust) | Electron + electron-store |
| **Devices** | Tauri IPC (Rust) | Electron + electron-store |
| **Weather** | Tauri IPC (Rust) | Electron + OpenWeatherMap |
| **Gestures** | Direct HTTP to EC2 | Electron IPC + FastAPI |
| **Events** | WebSocket polling | EventEmitter (real-time) |
| **Storage** | Rust persistence | electron-store (Node.js) |

---

## 💡 Usage Examples

### Alarms
```javascript
import { fetchAlarms, createAlarm } from '@/services/alarmService';

const alarms = await fetchAlarms(); // Gets all alarms
const alarm = await createAlarm({
  time: '08:00',
  label: 'Wake Up',
  repeat_days: [1,2,3,4,5], // Mon-Fri
  enabled: true
});
```

### Devices
```javascript
import { fetchDevices, addDevice } from '@/services/deviceService';

const devices = await fetchDevices();
const device = await addDevice({
  name: 'Living Room Light',
  type: 'light',
  location: 'Living Room'
});
```

### Weather
```javascript
import { weatherService } from '@/services/weatherService';

const weather = await weatherService.getCurrentWeather();
// Returns: { temperature, condition, humidity, ... }
```

### Gestures (with MediaPipe)
```javascript
import { gestureService } from '@/services/gestureService';

await gestureService.initialize(videoElement);

// Subscribe to predictions
gestureService.subscribe((detection) => {
  console.log(detection.gesture, detection.confidence);
});

// Send landmarks (called for each MediaPipe frame)
await gestureService.detectGesture(landmarks);
```

---

## 🔍 Verification Steps

### 1. Check Backend Services
Open DevTools Console (F12) and look for:
```
✅ AlarmService initialized
✅ DeviceService initialized
✅ WeatherService initialized
✅ IPC handlers initialized successfully
```

### 2. Test Alarms
```javascript
// In DevTools Console:
const { electronBackend } = window;
await electronBackend.alarms.getAll();
```

### 3. Test Devices
```javascript
await electronBackend.devices.getAll();
```

### 4. Test Weather
```javascript
await electronBackend.weather.getCurrent(32.5149, -117.0382);
```

### 5. Check for Warnings
Look for deprecation warning from `apiClient.js`:
```
⚠️  DEPRECATION WARNING: apiClient.js
```

---

## 🐛 Troubleshooting

### Issue: Backend fails to start automatically
**Symptoms**: Electron opens but no `[Backend]` logs in console

**Solutions**:
1. **Check Python is installed**:
   ```powershell
   python --version
   # Should show Python 3.8+
   ```

2. **Start backend manually** (fallback):
   ```powershell
   cd backend/api
   python api_service.py
   ```
   Then in another terminal:
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Check backend dependencies**:
   ```powershell
   cd backend/api
   pip install -r requirements.txt
   ```

### Issue: Backend port already in use
**Solution**: Kill the process using port 8000:
```powershell
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill
```

### Issue: "electronBackend is not defined"
**Solution**: Make sure preload script is loaded:
```javascript
// Check in DevTools Console:
console.log(window.electronBackend);
```

### Issue: Alarms/Devices not saving
**Solution**: Check electron-store location:
```javascript
await electronBackend.config.get();
// Should show config with paths
```

### Issue: Weather not loading
**Solution**: Check OpenWeatherMap API key in `backend/api/weatherService.js`:
```javascript
this.apiKey = process.env.OPENWEATHER_API_KEY || 'YOUR_API_KEY_HERE';
```

### Issue: Gestures not detecting
**Solution**: 
1. Make sure FastAPI backend is running
2. Check MediaPipe landmarks are being sent
3. Verify 40 frames are accumulating:
```javascript
await electronBackend.prediction.getBufferStatus();
```

---

## 📚 Documentation

- **Architecture**: `frontend/electron/backend/README.md`
- **Migration Guide**: `frontend/MIGRATION_GUIDE.md`
- **Service Status**: `frontend/SERVICES_CONNECTION_STATUS.md`
- **Implementation**: `IMPLEMENTATION_SUMMARY.md`
- **Completion**: `OPTION_B_MIGRATION_COMPLETE.md`

---

## 🎉 Success!

If everything works:
- ✅ Alarms can be created/updated/deleted
- ✅ Devices can be added/toggled
- ✅ Weather displays current conditions
- ✅ Gestures are recognized from camera
- ✅ No Tauri errors in console

**You're ready to go!** 🚀

---

## 🧹 Optional Cleanup

Remove Tauri dependencies (if not needed):
```powershell
cd frontend
npm uninstall @tauri-apps/api @tauri-apps/plugin-shell
```

Remove deprecated code:
```powershell
# Can remove these later (after verifying everything works):
# - frontend/src/services/apiClient.js
# - Any Tauri-specific code
```

---

## 📞 Need Help?

Check the comprehensive docs:
1. `OPTION_B_MIGRATION_COMPLETE.md` - Full migration details
2. `SERVICES_CONNECTION_STATUS.md` - Service-by-service breakdown
3. `MIGRATION_GUIDE.md` - Component migration examples

---

**That's it! You're now running on pure Electron architecture!** 🎊
