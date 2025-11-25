/**
 * Prediction Service: Handle prediction requests with queuing and debouncing
 * Accumulates 40 frames, manages request queue, implements debouncing
 */

const { BrowserWindow } = require('electron');
const apiService = require('../core/apiService');
const stateService = require('../core/stateService');
const configService = require('../core/configService');
const validationService = require('../core/validationService');

class PredictionService {
  constructor() {
    this.frameBuffer = [];
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastPredictionTime = 0;
    this.debounceTimer = null;
  }

  /**
   * Add frame to buffer and trigger prediction when ready
   * Refactored to use validationService for cleaner code
   */
  addFrame(landmarks) {
    const config = configService.getConfig();
    
    // Validate landmarks format using validation service
    const validation = validationService.validateFrame(landmarks);
    if (!validation.valid) {
      console.warn(`${validation.error}, skipping`);
      return {
        success: false,
        error: validation.error,
      };
    }

    // Validate that BOTH hands are detected
    const handCount = validationService.countHands(landmarks);
    if (handCount !== 2) {
      console.warn(`Invalid hand count: ${handCount}/2 hands detected, skipping frame`);
      // Clear buffer if user stopped showing 2 hands
      if (this.frameBuffer.length > 0) {
        console.log('Clearing buffer due to invalid hand count');
        this.clearBuffer();
      }
      return {
        success: false,
        error: `Invalid hand count: ${handCount}/2 hands detected`,
        handCount: handCount
      };
    }

    // Add to buffer
    this.frameBuffer.push(landmarks);
    
    // Log buffer status
    console.log(`Frame buffer: ${this.frameBuffer.length}/${config.framesRequired} frames collected [2 hands ✓]`);

    // Keep only the required number of frames
    if (this.frameBuffer.length > config.framesRequired) {
      this.frameBuffer.shift(); // Remove oldest frame
    }

    // Check if we have enough frames
    if (this.frameBuffer.length === config.framesRequired) {
      console.log(`Buffer full! Triggering prediction with ${this.frameBuffer.length} frames`);
      // Trigger prediction with debouncing
      this.debouncedPredict();
    }

    return {
      success: true,
      framesCollected: this.frameBuffer.length,
      framesRequired: config.framesRequired,
    };
  }



  /**
   * Debounced prediction
   */
  debouncedPredict() {
    const config = configService.getConfig();

    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Check detection interval
    const now = Date.now();
    const timeSinceLastPrediction = now - this.lastPredictionTime;

    if (timeSinceLastPrediction < config.detectionIntervalMs) {
      // Still in cooldown period
      return;
    }

    // Set debounce timer
    this.debounceTimer = setTimeout(() => {
      this.triggerPrediction();
    }, 100); // Small debounce to batch rapid calls
  }

  /**
   * Trigger prediction with current frame buffer
   */
  async triggerPrediction() {
    const config = configService.getConfig();

    if (this.frameBuffer.length < config.framesRequired) {
      return {
        success: false,
        error: `Not enough frames: ${this.frameBuffer.length}/${config.framesRequired}`,
      };
    }

    // Update last prediction time
    this.lastPredictionTime = Date.now();

    // Convert buffer to format expected by API
    const landmarksSequence = this.frameBufferToSequence();

    // Queue or process immediately
    if (config.enablePredictionQueue) {
      return this.queuePrediction(landmarksSequence);
    } else {
      return this.processPrediction(landmarksSequence);
    }
  }

  /**
   * Convert frame buffer to API format
   * Frame buffer already has correct format: array of 40 frames, each with 126 numbers
   * Each frame: [left_hand(63), right_hand(63)]
   * Each hand: 21 landmarks × 3 coords = 63 values
   */
  frameBufferToSequence() {
    // Frame buffer is already in the correct format
    // Just return it directly
    return this.frameBuffer;
  }

  /**
   * Queue prediction request
   */
  async queuePrediction(landmarksSequence) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        landmarks: landmarksSequence,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process prediction queue
   */
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    stateService.setPredictionActive(true);

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();

      try {
        const result = await this.processPrediction(request.landmarks);
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      // Small delay between requests to prevent overwhelming backend
      await this.sleep(100);
    }

    this.isProcessing = false;
    stateService.setPredictionActive(false);
  }

  /**
   * Process single prediction
   */
  async processPrediction(landmarksSequence) {
    const config = configService.getConfig();

    try {
      console.log(`Sending to EC2: ${landmarksSequence.length} frames × ${landmarksSequence[0]?.length || 0} features`);
      
      // Call API
      const response = await apiService.predict(landmarksSequence, false);

      if (!response.success) {
        console.error('Prediction failed:', response.error);
        // Add to state as failed prediction
        stateService.addPrediction({
          success: false,
          error: response.error,
          timestamp: Date.now()
        });

        return response;
      }

      // Extract prediction data
      const { prediccion_gesto, probabilidad_maxima } = response.data;

      // Send to Renderer via IPC (before confidence check)
      if (prediccion_gesto) {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          console.log(`Sending gesture to renderer: ${prediccion_gesto} (${probabilidad_maxima})`);
          mainWindow.webContents.send('prediction:result', {
            gesture: prediccion_gesto,
            confidence: probabilidad_maxima,
            timestamp: Date.now()
          });
        }
      }

      // Filter by confidence threshold
      const confidence = probabilidad_maxima || response.data.confidence;
      if (confidence < config.confidenceThreshold) {
        if (config.enableDebugLogging) {
          console.log(
            `Low confidence prediction: ${prediccion_gesto} (${confidence.toFixed(2)})`
          );
        }

        return {
          success: true,
          data: {
            ...response.data,
            belowThreshold: true,
          },
        };
      }

      // Add successful prediction to state
      stateService.addPrediction({
        success: true,
        gesture: prediccion_gesto,
        confidence: probabilidad_maxima,
        timestamp: Date.now()
      });

      if (config.enableDebugLogging) {
        console.log(
          `Prediction: ${prediccion_gesto} (${confidence.toFixed(2)})`
        );
      }

      return response;
    } catch (error) {
      console.error('Prediction error:', error);

      stateService.addPrediction({
        success: false,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clear frame buffer
   */
  clearBuffer() {
    this.frameBuffer = [];
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Get current buffer status
   */
  getBufferStatus() {
    const config = configService.getConfig();
    
    return {
      framesCollected: this.frameBuffer.length,
      framesRequired: config.framesRequired,
      isReady: this.frameBuffer.length >= config.framesRequired,
      queueSize: this.requestQueue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Force prediction with current buffer
   */
  async forcePrediction() {
    if (this.frameBuffer.length === 0) {
      return {
        success: false,
        error: 'No frames in buffer',
      };
    }

    const landmarksSequence = this.frameBufferToSequence();
    return this.processPrediction(landmarksSequence);
  }

  /**
   * Clear prediction queue
   */
  clearQueue() {
    // Reject all pending requests
    this.requestQueue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });

    this.requestQueue = [];
  }

  /**
   * Reset service
   */
  reset() {
    this.clearBuffer();
    this.clearQueue();
    this.isProcessing = false;
    this.lastPredictionTime = 0;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get prediction statistics
   */
  getStats() {
    return stateService.getStats();
  }

  /**
   * Get prediction history
   */
  getHistory(limit = null) {
    return stateService.getPredictionHistory(limit);
  }

  /**
   * Clear prediction history
   */
  clearHistory() {
    stateService.clearPredictionHistory();
  }
}

// Export singleton instance
const predictionService = new PredictionService();
module.exports = predictionService;
