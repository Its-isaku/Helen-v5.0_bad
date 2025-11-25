/**
 * app constants: central config for application-wide constants
 */

export const VIEWPORT = {
    viewport: {
        width: '1024px',
        height: '600px'
    },
    touch: {
        minSize: '44px' // Apple Human Interface Guidelines
    }
}

export const THEMES = {
    MIDNIGHT: {
        id: 'midnight',
        name: 'Medianoche',
        backgroundColor: 'linear-gradient(to bottom, #232323, #000000)'
    },
    OCEAN: {
        id: 'ocean',
        name: 'Océano',
        backgroundColor: 'linear-gradient(to bottom, #246BFF, #0000FF)'
    },
    VIOLET: {
        id: 'violet',
        name: 'Violeta',
        backgroundColor: 'linear-gradient(to right, #53197B, #7A3CC3)'
    },
    PINK: {
        id: 'pink',
        name: 'Rosa',
        backgroundColor: '#ca2ca3ff'
    },
    ABISMO: {
        id: 'abismo',
        name: 'Abismo',
        backgroundColor: '#11193e'
    },
    COSMOS: {
        id: 'cosmos',
        name: 'Cosmos',
        backgroundColor: 'linear-gradient(to right, #070070, #300045)'
    }
};

export const GLASS_STYLES = {
    BACKGROUND: 'rgba(255, 255, 255, 0.2)',
    BACKDROP_FILTER: 'blur(7px)',
    BORDER: 'rgba(255, 255, 255, 0.3)'
};

export const COLORS = {
    text: {
        primary: '#FFFFFF',
        opacity: {
            full: '100%',
            fifty: '50%'
        }
    },
    icons: {
        primary: '#FFFFFF',
        opacity: '50%'
    }
};

export const CAMERA_CONFIG = {
    DETECTION_COOLDOWN: 2000, // 2 sec
    FEEDBACK_DURATION: 1000 // 1 sec
};

export const EC2_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://13.58.208.156:5000',
    ENDPOINTS: {
        PREDICT: '/predict',
        GESTURES: '/gestures',
        MODELS: '/models',
        TRAINING: '/training',
        HEALTH: '/health'
    },
    FRAMES_TO_CAPTURE: 40,
    FRAME_DELAY_MS: 75,
    DETECTION_INTERVAL_MS: 3000
};

// nav routes
export const ROUTES = {
    LOCK: '/lock',
    HOME: '/home',
    ALARMS: '/alarms',
    WEATHER: '/weather',
    DEVICES: '/devices',
    SETTINGS: '/settings'
};

// home screen action types
export const HOME_ACTION_TYPES = {
    NAVIGATE: 'navigate',
    MODAL: 'modal',
};

export const HOME_ACTIONS = {
    // navigation actions
    ALARMS: { type: HOME_ACTION_TYPES.NAVIGATE, route: ROUTES.ALARMS },
    WEATHER: { type: HOME_ACTION_TYPES.NAVIGATE, route: ROUTES.WEATHER },
    DEVICES: { type: HOME_ACTION_TYPES.NAVIGATE, route: ROUTES.DEVICES },
    SETTINGS: { type: HOME_ACTION_TYPES.NAVIGATE, route: ROUTES.SETTINGS },
    
    // modal actions
    WIFI: { type: HOME_ACTION_TYPES.MODAL, modal: 'wifi' },
    THEME: { type: HOME_ACTION_TYPES.MODAL, modal: 'theme' },
};

/**
 * Gesture-to-Action Mapping
 * Maps sign language gestures from ML model to UI actions
 * All 10 gestures from the trained model
 */
export const GESTURE_ACTIONS = {
    // Navigation gestures
    'home': { type: HOME_ACTION_TYPES.NAVIGATE, route: ROUTES.HOME },
    'alarma': { type: HOME_ACTION_TYPES.NAVIGATE, route: ROUTES.ALARMS },
    'clima': { type: HOME_ACTION_TYPES.NAVIGATE, route: ROUTES.WEATHER },
    'dispositivos': { type: HOME_ACTION_TYPES.NAVIGATE, route: ROUTES.DEVICES },
    'configuracion': { type: HOME_ACTION_TYPES.NAVIGATE, route: ROUTES.SETTINGS },
    
    // Modal gestures
    'wifi': { type: HOME_ACTION_TYPES.MODAL, modal: 'wifi' },
    'colores': { type: HOME_ACTION_TYPES.MODAL, modal: 'theme' },
    
    // Action gestures (context-dependent)
    'camara': { type: 'action', action: 'toggle-camera' },
    'agregar': { type: 'action', action: 'add-item' },
    'editar': { type: 'action', action: 'edit-item' },
};

// screen metadata
export const SCREENS = {
    LOCK: { title: 'Bloqueo', route: ROUTES.LOCK, requiresAuth: false },
    HOME: { title: 'Inicio', route: ROUTES.HOME, requiresAuth: false },
    ALARMS: { title: 'Alarmas', route: ROUTES.ALARMS, requiresAuth: true },
    WEATHER: { title: 'Clima', route: ROUTES.WEATHER, requiresAuth: true },
    DEVICES: { title: 'Dispositivos', route: ROUTES.DEVICES, requiresAuth: true },
    SETTINGS: { title: 'Configuración', route: ROUTES.SETTINGS, requiresAuth: true }
};

export const CIRCLE_STATES = {
    IDLE: 'idle',
    ACTIVE: 'active'
};

// Screen name mapping for camera feedback "Última: [screen]" label
export const SCREEN_NAMES = {
    [ROUTES.ALARMS]: 'Alarmas',
    [ROUTES.WEATHER]: 'Clima',
    [ROUTES.DEVICES]: 'Dispositivos',
    [ROUTES.SETTINGS]: 'Configuración',
    [ROUTES.HOME]: null,  // HomeScreen excluded (uses orb instead)
    [ROUTES.LOCK]: null,  // LockScreen excluded
};

// Environment detection
export const ENVIRONMENT = {
    // Detect if running in Electron environment
    IS_ELECTRON: typeof window !== 'undefined' && window.electronBackend,
    // Check if mock data is enabled
    USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    // Debug mode
    DEBUG: import.meta.env.VITE_DEBUG === 'true',
};

/**
 * Backend architecture:
 * Electron (IPC): It handles all frontend requests via IPC, including
 * alarms, devices, and weather data stored locally using electron-store.
 * It also proxies ML prediction requests to the Flask service on EC2.
 * 
 * Flask ML Service (EC2:5000): This service is responsible for
 * sign language gesture recognition, model management, training, and
 * gesture CRUD operations.
 */

// ML Service Configuration (accessed via Electron IPC)
export const API_CONFIG = {
    // Flask ML backend on EC2
    ML_BASE_URL: import.meta.env.VITE_API_URL || 'http://13.58.208.156:5000',
    ML_ENDPOINTS: {
        PREDICT: '/predict',
        GESTURES: '/gestures',
        MODELS: '/models',
        TRAINING: '/training',
        HEALTH: '/health'
    }
};

// sign (LSM) language gestures types (expandable based on backend implementation)
export const SIGN_GESTURES = {
    INICIO: 'home',
    ALARMA: 'alarma',
    CLIMA: 'clima',
    DISPOSITIVOS: 'dispositivos',
    CONFIGURACION: 'configuracion',
    WIFI: 'wifi',
    TEMA: 'colores',
    AGREGAR: 'agregar',
    EDITAR: 'editar',
};

// z-index layers
export const Z_INDEX = {
    BACKGROUND: 0,
    GLASS_FOUNDATION: 10,
    CONTENT: 20,
    MODAL_OVERLAY: 100,
    MODAL: 110,
    CAMERA_FEEDBACK: 120,
    CENTRAL_BUBBLE: 200, // Helen Orb - on top of all elements
};