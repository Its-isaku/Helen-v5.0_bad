/**
 * Error Handler Service: Centralized error handling
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
      'Failed to fetch': 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      'Network request failed': 'Error de red. Por favor, intenta nuevamente.',
      ECONNREFUSED: 'El servidor no está disponible. Verifica que el backend esté ejecutándose.',
      ETIMEDOUT: 'La conexión tardó demasiado. Verifica tu conexión a internet.',
      
      400: 'Solicitud inválida. Verifica los datos enviados.',
      401: 'No autorizado. Por favor, inicia sesión nuevamente.',
      403: 'Acceso denegado.',
      404: 'Recurso no encontrado.',
      422: 'Datos inválidos. Verifica la información ingresada.',
      500: 'Error interno del servidor. Por favor, intenta más tarde.',
      502: 'Error de conexión con el servidor.',
      503: 'Servicio no disponible. Intenta nuevamente en unos momentos.',
      
      INVALID_LANDMARKS: 'Datos de landmarks inválidos. Asegúrate de enviar 40 frames con 21 puntos cada uno.',
      INVALID_GESTURE_DATA: 'Datos de gesto inválidos.',
      INVALID_CONFIG: 'Configuración inválida.',
      
      CAMERA_NOT_FOUND: 'No se encontró ninguna cámara disponible.',
      CAMERA_PERMISSION_DENIED: 'Permiso de cámara denegado. Por favor, habilita el acceso a la cámara en la configuración del sistema.',
      CAMERA_IN_USE: 'La cámara está siendo usada por otra aplicación.',
      
      MEDIAPIPE_INIT_FAILED: 'Error al inicializar MediaPipe. Recarga la aplicación.',
      MEDIAPIPE_PROCESSING_ERROR: 'Error al procesar el video.',
      
      DEFAULT: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
    };
  }

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

    if (context.enableDebugLogging) {
      console.error('❌ Error handled:', errorInfo);
    }

    return errorInfo;
  }

  categorizeError(error) {
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

    if (error.response || error.statusCode) {
      const statusCode = error.response?.status || error.statusCode;
      return {
        category: this.errorCategories.API,
        code: null,
        statusCode,
        apiMessage: error.response?.data?.message || error.message,
      };
    }

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

    if (error.message?.includes('MediaPipe') || error.message?.includes('mediapipe')) {
      return {
        category: this.errorCategories.MEDIAPIPE,
        code: null,
        statusCode: null,
      };
    }

    return {
      category: this.errorCategories.UNKNOWN,
      code: error.code,
      statusCode: null,
    };
  }

  getUserMessage(categorizedError) {
    const { category, code, statusCode, apiMessage } = categorizedError;

    if (code && this.errorMessages[code]) {
      return this.errorMessages[code];
    }

    if (statusCode && this.errorMessages[statusCode]) {
      return this.errorMessages[statusCode];
    }

    if (apiMessage) {
      return apiMessage;
    }

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

  shouldRetry(categorizedError) {
    const { category, statusCode } = categorizedError;

    if (category === this.errorCategories.NETWORK || category === this.errorCategories.TIMEOUT) {
      return true;
    }

    if (statusCode && [408, 429, 500, 502, 503, 504].includes(statusCode)) {
      return true;
    }

    return false;
  }

  isRetryable(categorizedError) {
    const { category } = categorizedError;

    if (
      category === this.errorCategories.VALIDATION ||
      category === this.errorCategories.CAMERA
    ) {
      return false;
    }

    return true;
  }

  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        const categorizedError = this.categorizeError(error);
        
        if (!this.shouldRetry(categorizedError)) {
          throw error;
        }

        if (attempt === maxRetries - 1) {
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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

      if (frame.length !== 126) {
        throw new Error(`INVALID_LANDMARKS: Frame ${i} expected 126 features, got ${frame.length}`);
      }

      for (let j = 0; j < frame.length; j++) {
        if (typeof frame[j] !== 'number') {
          throw new Error(`INVALID_LANDMARKS: Frame ${i}, feature ${j} must be a number`);
        }
      }
    }

    return true;
  }

  validateGestureData(gesture) {
    if (!gesture || typeof gesture !== 'object') {
      throw new Error('INVALID_GESTURE_DATA: Gesture must be an object');
    }

    if (!gesture.name || typeof gesture.name !== 'string') {
      throw new Error('INVALID_GESTURE_DATA: Gesture name is required');
    }

    return true;
  }

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

  createSuccessResponse(data) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}

const errorHandler = new ErrorHandler();
export default errorHandler;