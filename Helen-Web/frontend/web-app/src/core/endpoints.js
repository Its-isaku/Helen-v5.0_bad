/**
 * API Endpoints Registry
 */

import configService from './configService.js';

class EndpointsRegistry {
  constructor() {
    this.endpoints = {
      HEALTH: '/health',
      PREDICT: '/predict',
      
      GESTURES_LIST: '/gestures',
      GESTURES_CREATE: '/gestures',
      GESTURES_GET: (id) => `/gestures/${id}`,
      GESTURES_UPDATE: (id) => `/gestures/${id}`,
      GESTURES_DELETE: (id) => `/gestures/${id}`,
      GESTURES_STATS: '/gestures/stats',
      
      MODEL_INFO: '/model/info',
      MODEL_LIST: '/model/list',
      MODEL_LOAD: '/model/load',
      MODEL_METRICS: '/model/metrics',
      MODEL_SWITCH: '/model/switch',
      
      TRAINING_START: '/training/start',
      TRAINING_STATUS: '/training/status',
      TRAINING_STOP: '/training/stop',
      TRAINING_HISTORY: '/training/history',
      TRAINING_VALIDATE: '/training/validate',
      
      DATA_UPLOAD: '/data/upload',
      DATA_LIST: '/data/list',
      DATA_DELETE: (id) => `/data/${id}`,
    };
  }

  getUrl(endpointKey, ...params) {
    const endpoint = this.endpoints[endpointKey];
    
    if (!endpoint) {
      throw new Error(`Unknown endpoint: ${endpointKey}`);
    }

    const path = typeof endpoint === 'function' ? endpoint(...params) : endpoint;
    return configService.getEndpoint(path);
  }

  getMLUrl(endpointKey, ...params) {
    const endpoint = this.endpoints[endpointKey];
    
    if (!endpoint) {
      throw new Error(`Unknown endpoint: ${endpointKey}`);
    }

    const path = typeof endpoint === 'function' ? endpoint(...params) : endpoint;
    return configService.getMLEndpoint(path);
  }

  getPath(endpointKey, ...params) {
    const endpoint = this.endpoints[endpointKey];
    
    if (!endpoint) {
      throw new Error(`Unknown endpoint: ${endpointKey}`);
    }

    return typeof endpoint === 'function' ? endpoint(...params) : endpoint;
  }

  listEndpoints() {
    return Object.keys(this.endpoints);
  }
}

const endpointsRegistry = new EndpointsRegistry();
export default endpointsRegistry;