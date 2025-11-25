/**
 * API Endpoints Registry: Centralize all API endpoint paths
 * All endpoints are loaded from configService - no hardcoding
 */

const configService = require('./configService');

class EndpointsRegistry {
  constructor() {
    this.endpoints = {
      // Health & Status
      HEALTH: '/health',
      
      // Prediction
      PREDICT: '/predict',
      
      // Gestures
      GESTURES_LIST: '/gestures',
      GESTURES_CREATE: '/gestures',
      GESTURES_GET: (id) => `/gestures/${id}`,
      GESTURES_UPDATE: (id) => `/gestures/${id}`,
      GESTURES_DELETE: (id) => `/gestures/${id}`,
      GESTURES_STATS: '/gestures/stats',
      
      // Model Management
      MODEL_INFO: '/model/info',
      MODEL_LIST: '/model/list',
      MODEL_LOAD: '/model/load',
      MODEL_METRICS: '/model/metrics',
      MODEL_SWITCH: '/model/switch',
      
      // Training
      TRAINING_START: '/training/start',
      TRAINING_STATUS: '/training/status',
      TRAINING_STOP: '/training/stop',
      TRAINING_HISTORY: '/training/history',
      TRAINING_VALIDATE: '/training/validate',
      
      // Data Management
      DATA_UPLOAD: '/data/upload',
      DATA_LIST: '/data/list',
      DATA_DELETE: (id) => `/data/${id}`,
    };
  }

  /**
   * Get full URL for an endpoint
   */
  getUrl(endpointKey, ...params) {
    const endpoint = this.endpoints[endpointKey];
    
    if (!endpoint) {
      throw new Error(`Unknown endpoint: ${endpointKey}`);
    }

    // If endpoint is a function, call it with params
    const path = typeof endpoint === 'function' ? endpoint(...params) : endpoint;
    
    // Get base URL from config
    return configService.getEndpoint(path);
  }

  /**
   * Get ML service URL for an endpoint
   */
  getMLUrl(endpointKey, ...params) {
    const endpoint = this.endpoints[endpointKey];
    
    if (!endpoint) {
      throw new Error(`Unknown endpoint: ${endpointKey}`);
    }

    // If endpoint is a function, call it with params
    const path = typeof endpoint === 'function' ? endpoint(...params) : endpoint;
    
    // Get ML service URL from config
    return configService.getMLEndpoint(path);
  }

  /**
   * Get endpoint path only (without base URL)
   */
  getPath(endpointKey, ...params) {
    const endpoint = this.endpoints[endpointKey];
    
    if (!endpoint) {
      throw new Error(`Unknown endpoint: ${endpointKey}`);
    }

    return typeof endpoint === 'function' ? endpoint(...params) : endpoint;
  }

  /**
   * List all available endpoints
   */
  listEndpoints() {
    return Object.keys(this.endpoints);
  }
}

// Export singleton instance
const endpointsRegistry = new EndpointsRegistry();
module.exports = endpointsRegistry;
