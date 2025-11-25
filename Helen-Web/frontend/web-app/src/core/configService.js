/**
 * Configuration Service: Load, validate, and manage API configuration
 * WEB VERSION - Uses localStorage instead of electron-store
 */

class ConfigService {
  constructor() {
    this.config = null;
    this.loadConfig();
  }

  loadConfig() {
    // Load from localStorage
    const storedConfig = this.getFromStorage('apiConfig') || {};
    
    // Defaults from environment variables
    const defaults = {
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
      apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
      mlServiceUrl: import.meta.env.VITE_ML_SERVICE_URL || null,
      
      confidenceThreshold: 0.7,
      framesRequired: parseInt(import.meta.env.VITE_FRAMES_TO_CAPTURE) || 40,
      frameDelayMs: parseInt(import.meta.env.VITE_FRAME_DELAY_MS) || 75,
      detectionIntervalMs: parseInt(import.meta.env.VITE_DETECTION_INTERVAL_MS) || 3000,
      
      cameraDevice: 'default',
      maxRetries: 3,
      retryDelayMs: 1000,
      connectionTimeout: 5000,
      
      enableDebugLogging: import.meta.env.DEV,
      enablePredictionQueue: true,
      enableCaching: true,
    };

    this.config = {
      ...defaults,
      ...storedConfig,
    };

    if (!this.config.mlServiceUrl) {
      this.config.mlServiceUrl = this.config.apiUrl;
    }

    if (this.config.enableDebugLogging) {
      // Log configuration load
      console.log('Configuration loaded:', this.config);
    }
  }

  getConfig() {
    return { ...this.config };
  }

  get(key, defaultValue = null) {
    return this.config[key] ?? defaultValue;
  }

  async updateConfig(updates) {
    const validatedUpdates = this.validateConfigUpdates(updates);
    
    this.config = {
      ...this.config,
      ...validatedUpdates,
    };

    this.saveToStorage('apiConfig', this.config);

    if (this.config.enableDebugLogging) {
      console.log('Configuration updated:', validatedUpdates);
    }

    return this.config;
  }

  validateConfigUpdates(updates) {
    const validated = {};

    if (updates.apiUrl) {
      if (!this.isValidUrl(updates.apiUrl)) {
        throw new Error('Invalid API URL format');
      }
      validated.apiUrl = updates.apiUrl.replace(/\/$/, '');
    }

    if (updates.mlServiceUrl) {
      if (!this.isValidUrl(updates.mlServiceUrl)) {
        throw new Error('Invalid ML Service URL format');
      }
      validated.mlServiceUrl = updates.mlServiceUrl.replace(/\/$/, '');
    }

    if (updates.apiTimeout !== undefined) {
      validated.apiTimeout = this.validatePositiveInteger(updates.apiTimeout, 'apiTimeout');
    }

    if (updates.confidenceThreshold !== undefined) {
      validated.confidenceThreshold = this.validateRange(
        updates.confidenceThreshold, 0, 1, 'confidenceThreshold'
      );
    }

    if (updates.framesRequired !== undefined) {
      validated.framesRequired = this.validatePositiveInteger(updates.framesRequired, 'framesRequired');
    }

    if (updates.frameDelayMs !== undefined) {
      validated.frameDelayMs = this.validatePositiveInteger(updates.frameDelayMs, 'frameDelayMs');
    }

    if (updates.detectionIntervalMs !== undefined) {
      validated.detectionIntervalMs = this.validatePositiveInteger(updates.detectionIntervalMs, 'detectionIntervalMs');
    }

    if (updates.maxRetries !== undefined) {
      validated.maxRetries = this.validatePositiveInteger(updates.maxRetries, 'maxRetries');
    }

    if (updates.retryDelayMs !== undefined) {
      validated.retryDelayMs = this.validatePositiveInteger(updates.retryDelayMs, 'retryDelayMs');
    }

    if (updates.connectionTimeout !== undefined) {
      validated.connectionTimeout = this.validatePositiveInteger(updates.connectionTimeout, 'connectionTimeout');
    }

    if (updates.cameraDevice !== undefined) {
      validated.cameraDevice = String(updates.cameraDevice);
    }

    if (updates.enableDebugLogging !== undefined) {
      validated.enableDebugLogging = Boolean(updates.enableDebugLogging);
    }

    if (updates.enablePredictionQueue !== undefined) {
      validated.enablePredictionQueue = Boolean(updates.enablePredictionQueue);
    }

    if (updates.enableCaching !== undefined) {
      validated.enableCaching = Boolean(updates.enableCaching);
    }

    return validated;
  }

  isValidUrl(urlString) {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  validatePositiveInteger(value, fieldName) {
    const num = parseInt(value);
    if (isNaN(num) || num <= 0) {
      throw new Error(`${fieldName} must be a positive integer`);
    }
    return num;
  }

  validateRange(value, min, max, fieldName) {
    const num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
      throw new Error(`${fieldName} must be between ${min} and ${max}`);
    }
    return num;
  }

  resetToDefaults() {
    localStorage.removeItem('apiConfig');
    this.loadConfig();
    return this.config;
  }

  async testConnection(url = null) {
    const testUrl = url || this.config.apiUrl;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.connectionTimeout);

      const response = await fetch(`${testUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return {
        success: response.ok,
        status: response.status,
        url: testUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        url: testUrl,
      };
    }
  }

  getEndpoint(path) {
    const baseUrl = this.config.apiUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  getMLEndpoint(path) {
    const baseUrl = this.config.mlServiceUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  // localStorage helpers
  getFromStorage(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }
}

const configService = new ConfigService();
export default configService;