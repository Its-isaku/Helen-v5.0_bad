/**
 * API Service: Handle all HTTP communication with backend APIs
 * Uses configService for URLs, errorHandler for errors, endpoints for paths
 * Implements retry logic, timeouts, and request/response formatting
 */

const configService = require('./configService');
const errorHandler = require('./errorHandler');
const endpointsRegistry = require('./endpoints');
const validationService = require('./validationService');

class ApiService {
  constructor() {
    this.requestCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes default cache
  }

  /**
   * Generic HTTP request method
   */
  async request(method, url, data = null, options = {}) {
    const config = configService.getConfig();
    const controller = new AbortController();
    
    // Setup timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, options.timeout || config.apiTimeout);

    try {
      const requestOptions = {
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      };

      // Add body for POST, PUT, PATCH
      if (data && ['POST', 'PUT', 'PATCH'].includes(requestOptions.method)) {
        requestOptions.body = JSON.stringify(data);
      }

      if (config.enableDebugLogging) {
        console.log(`${method.toUpperCase()} ${url}`, data ? { data } : '');
      }

      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.statusCode = response.status;
        error.response = { status: response.status, data: errorData };
        throw error;
      }

      // Parse JSON response
      const responseData = await response.json();

      if (config.enableDebugLogging) {
        console.log(`Response from ${url}:`, responseData);
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle aborted requests (timeout)
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.name = 'AbortError';
        throw timeoutError;
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  async get(url, options = {}) {
    const config = configService.getConfig();
    
    // Check cache if enabled
    if (config.enableCaching && options.cache !== false) {
      const cached = this.getFromCache(url);
      if (cached) {
        if (config.enableDebugLogging) {
          console.log(`Cache hit for ${url}`);
        }
        return cached;
      }
    }

    const data = await this.request('GET', url, null, options);

    // Cache response if enabled
    if (config.enableCaching && options.cache !== false) {
      this.setCache(url, data, options.cacheExpiry);
    }

    return data;
  }

  /**
   * POST request
   */
  async post(url, data, options = {}) {
    return this.request('POST', url, data, options);
  }

  /**
   * PUT request
   */
  async put(url, data, options = {}) {
    return this.request('PUT', url, data, options);
  }

  /**
   * PATCH request
   */
  async patch(url, data, options = {}) {
    return this.request('PATCH', url, data, options);
  }

  /**
   * DELETE request
   */
  async delete(url, options = {}) {
    return this.request('DELETE', url, null, options);
  }

  /**
   * Request with automatic retry
   */
  async requestWithRetry(method, url, data = null, options = {}) {
    const config = configService.getConfig();
    const maxRetries = options.maxRetries || config.maxRetries;
    const retryDelay = options.retryDelay || config.retryDelayMs;

    return errorHandler.retryWithBackoff(
      () => this.request(method, url, data, options),
      maxRetries,
      retryDelay
    );
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.requestCache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiry) {
      this.requestCache.delete(key);
      return null;
    }

    return cached.data;
  }

  setCache(key, data, expiry = null) {
    const expiryTime = expiry || this.cacheExpiry;
    
    this.requestCache.set(key, {
      data,
      expiry: Date.now() + expiryTime,
    });
  }

  clearCache(key = null) {
    if (key) {
      this.requestCache.delete(key);
    } else {
      this.requestCache.clear();
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const url = endpointsRegistry.getUrl('HEALTH');
      const data = await this.get(url, { cache: false, timeout: 5000 });
      
      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Predict gesture from landmarks
   * Refactored to use validationService for consistency
   */
  async predict(landmarks, returnProbabilities = false) {
    try {
      // Validate landmarks using validation service
      const validation = validationService.validateLandmarksSequence(landmarks);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // ===== DETAILED LOGGING FOR DEBUGGING =====
      const url = endpointsRegistry.getUrl('PREDICT');
      console.log('\n===== EC2 PREDICTION REQUEST DEBUG =====');
      console.log('Target URL:', url);
      console.log('Data Dimensions:');
      console.log('- Total frames:', landmarks.length);
      console.log('- Features per frame:', landmarks.length > 0 ? landmarks[0].length : 0);
      
      // Validate data format
      const isValidFormat = landmarks.length === 40 && landmarks.every(frame => frame.length === 126);
      console.log('Format Validation:', isValidFormat ? 'PASSED' : 'FAILED');
      
      if (!isValidFormat) {
        console.error('INVALID DATA FORMAT DETECTED:');
        console.error('- Expected: 40 frames × 126 features');
        console.error('- Received:', landmarks.length, 'frames');
        if (landmarks.length > 0) {
          console.error('- Frame sizes:', landmarks.map(f => f.length).slice(0, 5), '...');
        }
      }
      
      // Sample first frame for debugging
      console.log('Sample Data (first frame, first 10 features):');
      if (landmarks.length > 0 && landmarks[0].length > 0) {
        console.log('  ', landmarks[0].slice(0, 10));
      } else {
        console.log('   [NO DATA]');
      }
      console.log('=========================================\n');

      const data = await this.post(url, {
        sequence: landmarks,  // EC2 expects "sequence" not "landmarks"
        return_probabilities: returnProbabilities,
      });

      console.log('EC2 Response received successfully:', data);
      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      // ===== DETAILED ERROR LOGGING =====
      console.error('\n===== EC2 PREDICTION ERROR =====');
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      
      // HTTP Status Code
      if (error.response) {
        console.error('HTTP Status:', error.response.status);
        console.error('Status Text:', error.response.statusText);
        console.error('Response Headers:', error.response.headers);
        console.error('Response Body:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('Network Error - No Response Received');
        console.error('Request Details:', error.request);
      } else {
        console.error('Error during request setup:', error.message);
      }
      
      // Stack trace
      console.error('Stack Trace:', error.stack);
      console.error('=====================================\n');
      
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Get list of available gestures
   */
  async getGestures() {
    try {
      const url = endpointsRegistry.getUrl('GESTURES_LIST');
      const data = await this.get(url);

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Get gesture by ID
   */
  async getGesture(id) {
    try {
      const url = endpointsRegistry.getUrl('GESTURES_GET', id);
      const data = await this.get(url);

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Create new gesture
   * Refactored to use validationService
   */
  async createGesture(gestureData) {
    try {
      // Validate gesture data
      const validation = validationService.validateGestureData(gestureData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const url = endpointsRegistry.getUrl('GESTURES_CREATE');
      const data = await this.post(url, gestureData);

      // Clear gestures cache
      this.clearCache(endpointsRegistry.getUrl('GESTURES_LIST'));

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Update gesture
   * Refactored to use validationService
   */
  async updateGesture(id, gestureData) {
    try {
      // Validate gesture data
      const validation = validationService.validateGestureData(gestureData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const url = endpointsRegistry.getUrl('GESTURES_UPDATE', id);
      const data = await this.put(url, gestureData);

      // Clear caches
      this.clearCache(endpointsRegistry.getUrl('GESTURES_LIST'));
      this.clearCache(endpointsRegistry.getUrl('GESTURES_GET', id));

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Delete gesture
   */
  async deleteGesture(id) {
    try {
      const url = endpointsRegistry.getUrl('GESTURES_DELETE', id);
      const data = await this.delete(url);

      // Clear caches
      this.clearCache(endpointsRegistry.getUrl('GESTURES_LIST'));
      this.clearCache(endpointsRegistry.getUrl('GESTURES_GET', id));

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Get gesture statistics
   */
  async getGestureStats() {
    try {
      const url = endpointsRegistry.getUrl('GESTURES_STATS');
      const data = await this.get(url);

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Get model information
   */
  async getModelInfo() {
    try {
      const url = endpointsRegistry.getUrl('MODEL_INFO');
      const data = await this.get(url);

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Get list of available models
   */
  async getModelList() {
    try {
      const url = endpointsRegistry.getUrl('MODEL_LIST');
      const data = await this.get(url);

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Load a specific model
   */
  async loadModel(modelPath) {
    try {
      const url = endpointsRegistry.getUrl('MODEL_LOAD');
      const data = await this.post(url, { model_path: modelPath });

      // Clear model info cache
      this.clearCache(endpointsRegistry.getUrl('MODEL_INFO'));

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Get model metrics
   */
  async getModelMetrics() {
    try {
      const url = endpointsRegistry.getUrl('MODEL_METRICS');
      const data = await this.get(url);

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Start training
   */
  async startTraining(trainingConfig) {
    try {
      const url = endpointsRegistry.getUrl('TRAINING_START');
      const data = await this.post(url, trainingConfig);

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Get training status
   */
  async getTrainingStatus() {
    try {
      const url = endpointsRegistry.getUrl('TRAINING_STATUS');
      const data = await this.get(url, { cache: false });

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Stop training
   */
  async stopTraining() {
    try {
      const url = endpointsRegistry.getUrl('TRAINING_STOP');
      const data = await this.post(url, {});

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Get training history
   */
  async getTrainingHistory() {
    try {
      const url = endpointsRegistry.getUrl('TRAINING_HISTORY');
      const data = await this.get(url);

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Validate trained model
   */
  async validateModel() {
    try {
      const url = endpointsRegistry.getUrl('TRAINING_VALIDATE');
      const data = await this.post(url, {});

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Upload training data
   */
  async uploadData(dataPayload) {
    try {
      const url = endpointsRegistry.getUrl('DATA_UPLOAD');
      const data = await this.post(url, dataPayload);

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Get list of uploaded data
   */
  async getDataList() {
    try {
      const url = endpointsRegistry.getUrl('DATA_LIST');
      const data = await this.get(url);

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }

  /**
   * Delete data by ID
   */
  async deleteData(id) {
    try {
      const url = endpointsRegistry.getUrl('DATA_DELETE', id);
      const data = await this.delete(url);

      // Clear data list cache
      this.clearCache(endpointsRegistry.getUrl('DATA_LIST'));

      return errorHandler.createSuccessResponse(data);
    } catch (error) {
      return errorHandler.createErrorResponse(error, {
        enableDebugLogging: configService.get('enableDebugLogging'),
      });
    }
  }
}

// Export singleton instance
const apiService = new ApiService();
module.exports = apiService;
