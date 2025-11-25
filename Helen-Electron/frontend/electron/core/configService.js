/**
 * Configuration Service: Load, validate, and manage API configuration
 * Loads from environment variables and electron-store with fallback defaults
 * No hardcoded URLs - all configuration is centralized here
 */

const Store = require('electron-store');

class ConfigService {
  constructor() {
    this.store = new Store();
    this.config = null;
    this.loadConfig();
  }

  /**
   * Load configuration from store with environment variable overrides
   * Priority: electron-store > environment variables > defaults
   */
  loadConfig() {
    const storedConfig = this.store.get('apiConfig', {});
    
    // Default configuration - loaded from environment or fallback
    const defaults = {
      // Flask Backend (ML Service) on EC2
      apiUrl: process.env.VITE_API_URL || 'http://13.58.208.156:5000',
      apiTimeout: parseInt(process.env.VITE_API_TIMEOUT) || 30000,
      
      // ML Service specific (if different from main API)
      mlServiceUrl: process.env.VITE_ML_SERVICE_URL || null,
      
      // Prediction settings
      confidenceThreshold: 0.7,
      framesRequired: parseInt(process.env.VITE_FRAMES_TO_CAPTURE) || 40,
      frameDelayMs: parseInt(process.env.VITE_FRAME_DELAY_MS) || 75,
      detectionIntervalMs: parseInt(process.env.VITE_DETECTION_INTERVAL_MS) || 3000, // 3 seconds between predictions
      
      // Camera settings
      cameraDevice: 'default',
      
      // Connection settings
      maxRetries: 3,
      retryDelayMs: 1000,
      connectionTimeout: 5000,
      
      // Feature flags
      enableDebugLogging: process.env.NODE_ENV === 'development',
      enablePredictionQueue: true,
      enableCaching: true,
    };

    // Merge: defaults < stored config < environment overrides
    this.config = {
      ...defaults,
      ...storedConfig,
    };

    // Ensure ML service URL defaults to main API if not specified
    if (!this.config.mlServiceUrl) {
      this.config.mlServiceUrl = this.config.apiUrl;
    }

    if (this.config.enableDebugLogging) {
      console.log('Configuration loaded:', this.sanitizeForLogging(this.config));
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Get specific config value
   */
  get(key, defaultValue = null) {
    return this.config[key] ?? defaultValue;
  }

  /**
   * Update configuration and persist to store
   */
  async updateConfig(updates) {
    const validatedUpdates = this.validateConfigUpdates(updates);
    
    this.config = {
      ...this.config,
      ...validatedUpdates,
    };

    // Persist to store
    const currentStored = this.store.get('apiConfig', {});
    this.store.set('apiConfig', {
      ...currentStored,
      ...validatedUpdates,
    });

    if (this.config.enableDebugLogging) {
      console.log('Configuration updated:', this.sanitizeForLogging(validatedUpdates));
    }

    return this.config;
  }

  /**
   * Validate configuration updates
   */
  validateConfigUpdates(updates) {
    const validated = {};

    // Validate URL formats
    if (updates.apiUrl) {
      if (!this.isValidUrl(updates.apiUrl)) {
        throw new Error('Invalid API URL format');
      }
      validated.apiUrl = updates.apiUrl.replace(/\/$/, ''); // Remove trailing slash
    }

    if (updates.mlServiceUrl) {
      if (!this.isValidUrl(updates.mlServiceUrl)) {
        throw new Error('Invalid ML Service URL format');
      }
      validated.mlServiceUrl = updates.mlServiceUrl.replace(/\/$/, '');
    }

    // Validate numeric values
    if (updates.apiTimeout !== undefined) {
      validated.apiTimeout = this.validatePositiveInteger(updates.apiTimeout, 'apiTimeout');
    }

    if (updates.confidenceThreshold !== undefined) {
      validated.confidenceThreshold = this.validateRange(
        updates.confidenceThreshold,
        0,
        1,
        'confidenceThreshold'
      );
    }

    if (updates.framesRequired !== undefined) {
      validated.framesRequired = this.validatePositiveInteger(
        updates.framesRequired,
        'framesRequired'
      );
    }

    if (updates.frameDelayMs !== undefined) {
      validated.frameDelayMs = this.validatePositiveInteger(updates.frameDelayMs, 'frameDelayMs');
    }

    if (updates.detectionIntervalMs !== undefined) {
      validated.detectionIntervalMs = this.validatePositiveInteger(
        updates.detectionIntervalMs,
        'detectionIntervalMs'
      );
    }

    if (updates.maxRetries !== undefined) {
      validated.maxRetries = this.validatePositiveInteger(updates.maxRetries, 'maxRetries');
    }

    if (updates.retryDelayMs !== undefined) {
      validated.retryDelayMs = this.validatePositiveInteger(updates.retryDelayMs, 'retryDelayMs');
    }

    if (updates.connectionTimeout !== undefined) {
      validated.connectionTimeout = this.validatePositiveInteger(
        updates.connectionTimeout,
        'connectionTimeout'
      );
    }

    // Validate strings
    if (updates.cameraDevice !== undefined) {
      validated.cameraDevice = String(updates.cameraDevice);
    }

    // Validate booleans
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

  /**
   * Validate URL format
   */
  isValidUrl(urlString) {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  /**
   * Validate positive integer
   */
  validatePositiveInteger(value, fieldName) {
    const num = parseInt(value);
    if (isNaN(num) || num <= 0) {
      throw new Error(`${fieldName} must be a positive integer`);
    }
    return num;
  }

  /**
   * Validate number in range
   */
  validateRange(value, min, max, fieldName) {
    const num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
      throw new Error(`${fieldName} must be between ${min} and ${max}`);
    }
    return num;
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults() {
    this.store.delete('apiConfig');
    this.loadConfig();
    return this.config;
  }

  /**
   * Test connection to API
   */
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

  /**
   * Sanitize config for logging (remove sensitive data if any)
   */
  sanitizeForLogging(config) {
    const sanitized = { ...config };
    // Add any sensitive field filtering here if needed in future
    return sanitized;
  }

  /**
   * Get all API endpoints with base URL
   */
  getEndpoint(path) {
    const baseUrl = this.config.apiUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * Get ML service endpoint
   */
  getMLEndpoint(path) {
    const baseUrl = this.config.mlServiceUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }
}

// Export singleton instance
const configService = new ConfigService();
module.exports = configService;
