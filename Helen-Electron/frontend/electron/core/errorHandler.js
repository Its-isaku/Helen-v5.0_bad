/**
 * Error Handler Service: Centralized error handling and user-friendly error messages
 * Categorizes errors, provides retry logic, and formats errors for UI display
 */

class ErrorHandler {
  constructor() {
    this.errorCategories = {
      NETWORK: 'network',
      TIMEOUT: 'timeout',
      API: 'api',
      VALIDATION: 'validation',
      CAMERA: 'camera',
      MEDIAPIPE: 'mediapipe',
      UNKNOWN: 'unknown',
    };

    this.errorMessages = {
      // Network errors
      'Failed to fetch': 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      'Network request failed': 'Error de red. Por favor, intenta nuevamente.',
      ECONNREFUSED: 'El servidor no está disponible. Verifica que el backend esté ejecutándose.',
      ETIMEDOUT: 'La conexión tardó demasiado. Verifica tu conexión a internet.',
      
      // API errors
      400: 'Solicitud inválida. Verifica los datos enviados.',
      401: 'No autorizado. Por favor, inicia sesión nuevamente.',
      403: 'Acceso denegado.',
      404: 'Recurso no encontrado.',
      422: 'Datos inválidos. Verifica la información ingresada.',
      500: 'Error interno del servidor. Por favor, intenta más tarde.',
      502: 'Error de conexión con el servidor.',
      503: 'Servicio no disponible. Intenta nuevamente en unos momentos.',
      
      // Validation errors
      INVALID_LANDMARKS: 'Datos de landmarks inválidos. Asegúrate de enviar 40 frames con 21 puntos cada uno.',
      INVALID_GESTURE_DATA: 'Datos de gesto inválidos.',
      INVALID_CONFIG: 'Configuración inválida.',
      
      // Camera errors
      CAMERA_NOT_FOUND: 'No se encontró ninguna cámara disponible.',
      CAMERA_PERMISSION_DENIED: 'Permiso de cámara denegado. Por favor, habilita el acceso a la cámara en la configuración del sistema.',
      CAMERA_IN_USE: 'La cámara está siendo usada por otra aplicación.',
      
      // MediaPipe errors
      MEDIAPIPE_INIT_FAILED: 'Error al inicializar MediaPipe. Recarga la aplicación.',
      MEDIAPIPE_PROCESSING_ERROR: 'Error al procesar el video.',
      
      // Default
      DEFAULT: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
    };
  }

  /**
   * Handle and categorize error
   */
  handleError(error, context = {}) {
    const categorizedError = this.categorizeError(error);
    const userMessage = this.getUserMessage(categorizedError);
    
    const errorInfo = {
      category: categorizedError.category,
      message: userMessage,
      originalError: error.message || error,
      context,
      timestamp: new Date().toISOString(),
      shouldRetry: this.shouldRetry(categorizedError),
      retryable: this.isRetryable(categorizedError),
    };

    // Log error for debugging
    if (context.enableDebugLogging) {
      console.error('Error handled:', errorInfo);
    }

    return errorInfo;
  }

  /**
   * Categorize error by type
   */
  categorizeError(error) {
    // Network errors
    if (
      error.message?.includes('fetch') ||
      error.message?.includes('Network') ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET'
    ) {
      return {
        category: this.errorCategories.NETWORK,
        code: error.code,
        statusCode: null,
      };
    }

    // Timeout errors
    if (
      error.message?.includes('timeout') ||
      error.message?.includes('aborted') ||
      error.code === 'ETIMEDOUT' ||
      error.name === 'AbortError'
    ) {
      return {
        category: this.errorCategories.TIMEOUT,
        code: error.code,
        statusCode: null,
      };
    }

    // API errors (HTTP status codes)
    if (error.response || error.statusCode) {
      const statusCode = error.response?.status || error.statusCode;
      return {
        category: this.errorCategories.API,
        code: null,
        statusCode,
        apiMessage: error.response?.data?.message || error.message,
      };
    }

    // Validation errors
    if (
      error.message?.includes('invalid') ||
      error.message?.includes('validation') ||
      error.name === 'ValidationError'
    ) {
      return {
        category: this.errorCategories.VALIDATION,
        code: error.code || error.message,
        statusCode: null,
      };
    }

    // Camera errors
    if (
      error.message?.includes('camera') ||
      error.message?.includes('Camera') ||
      error.name === 'NotFoundError' ||
      error.name === 'NotAllowedError' ||
      error.name === 'NotReadableError'
    ) {
      return {
        category: this.errorCategories.CAMERA,
        code: error.name,
        statusCode: null,
      };
    }

    // MediaPipe errors
    if (error.message?.includes('MediaPipe') || error.message?.includes('mediapipe')) {
      return {
        category: this.errorCategories.MEDIAPIPE,
        code: null,
        statusCode: null,
      };
    }

    // Unknown
    return {
      category: this.errorCategories.UNKNOWN,
      code: error.code,
      statusCode: null,
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(categorizedError) {
    const { category, code, statusCode, apiMessage } = categorizedError;

    // Check for specific error messages first
    if (code && this.errorMessages[code]) {
      return this.errorMessages[code];
    }

    if (statusCode && this.errorMessages[statusCode]) {
      return this.errorMessages[statusCode];
    }

    // Use API message if available
    if (apiMessage) {
      return apiMessage;
    }

    // Category-based messages
    switch (category) {
      case this.errorCategories.NETWORK:
        return this.errorMessages['Failed to fetch'];
      case this.errorCategories.TIMEOUT:
        return this.errorMessages['ETIMEDOUT'];
      case this.errorCategories.VALIDATION:
        return this.errorMessages['INVALID_GESTURE_DATA'];
      case this.errorCategories.CAMERA:
        return this.errorMessages['CAMERA_NOT_FOUND'];
      case this.errorCategories.MEDIAPIPE:
        return this.errorMessages['MEDIAPIPE_PROCESSING_ERROR'];
      default:
        return this.errorMessages.DEFAULT;
    }
  }

  /**
   * Determine if error should trigger retry
   */
  shouldRetry(categorizedError) {
    const { category, statusCode } = categorizedError;

    // Retryable categories
    if (category === this.errorCategories.NETWORK || category === this.errorCategories.TIMEOUT) {
      return true;
    }

    // Retryable status codes
    if (statusCode && [408, 429, 500, 502, 503, 504].includes(statusCode)) {
      return true;
    }

    return false;
  }

  /**
   * Check if error is retryable by user action
   */
  isRetryable(categorizedError) {
    const { category } = categorizedError;

    // Non-retryable categories
    if (
      category === this.errorCategories.VALIDATION ||
      category === this.errorCategories.CAMERA
    ) {
      return false;
    }

    return true;
  }

  /**
   * Retry logic with exponential backoff
   */
  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        const categorizedError = this.categorizeError(error);
        
        // Don't retry if not retryable
        if (!this.shouldRetry(categorizedError)) {
          throw error;
        }

        // Last attempt - throw error
        if (attempt === maxRetries - 1) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s...
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate landmarks data structure
   * Expected format: 40 frames × 126 features (flattened)
   * 2 hands × 21 landmarks × 3 coords (x,y,z) = 126 features per frame
   */
  validateLandmarks(landmarks) {
    if (!Array.isArray(landmarks)) {
      throw new Error('INVALID_LANDMARKS: Landmarks must be an array');
    }

    if (landmarks.length !== 40) {
      throw new Error(`INVALID_LANDMARKS: Expected 40 frames, got ${landmarks.length}`);
    }

    for (let i = 0; i < landmarks.length; i++) {
      const frame = landmarks[i];
      
      if (!Array.isArray(frame)) {
        throw new Error(`INVALID_LANDMARKS: Frame ${i} must be an array`);
      }

      // Check for flattened format (126 features)
      if (frame.length !== 126) {
        throw new Error(`INVALID_LANDMARKS: Frame ${i} expected 126 features (2 hands x 21 landmarks x 3 coords), got ${frame.length}`);
      }

      // Validate all features are numbers
      for (let j = 0; j < frame.length; j++) {
        if (typeof frame[j] !== 'number') {
          throw new Error(`INVALID_LANDMARKS: Frame ${i}, feature ${j} must be a number, got ${typeof frame[j]}`);
        }
      }
    }

    return true;
  }

  /**
   * Validate gesture data
   */
  validateGestureData(gesture) {
    if (!gesture || typeof gesture !== 'object') {
      throw new Error('INVALID_GESTURE_DATA: Gesture must be an object');
    }

    if (!gesture.name || typeof gesture.name !== 'string') {
      throw new Error('INVALID_GESTURE_DATA: Gesture name is required');
    }

    return true;
  }

  /**
   * Create standardized error response
   */
  createErrorResponse(error, context = {}) {
    const errorInfo = this.handleError(error, context);
    
    return {
      success: false,
      error: errorInfo.message,
      category: errorInfo.category,
      retryable: errorInfo.retryable,
      timestamp: errorInfo.timestamp,
    };
  }

  /**
   * Create success response
   */
  createSuccessResponse(data) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
const errorHandler = new ErrorHandler();
module.exports = errorHandler;
