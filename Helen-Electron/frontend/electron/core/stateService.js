/**
 * State Service: Manage application state for backend-related data
 * Tracks connection status, model state, gestures, predictions, training progress
 */

const { EventEmitter } = require('events');

class StateService extends EventEmitter {
  constructor() {
    super();
    
    this.state = {
      // Connection state
      connection: {
        isConnected: false,
        lastChecked: null,
        error: null,
      },

      // Model state
      model: {
        loaded: false,
        name: null,
        version: null,
        accuracy: null,
        nGestures: 0,
        info: null,
      },

      // Gestures
      gestures: {
        list: [],
        loaded: false,
        lastUpdated: null,
      },

      // Prediction state
      prediction: {
        isActive: false,
        lastPrediction: null,
        history: [],
        maxHistorySize: 50,
      },

      // Training state
      training: {
        isTraining: false,
        progress: 0,
        currentEpoch: 0,
        totalEpochs: 0,
        loss: null,
        accuracy: null,
        startTime: null,
        error: null,
      },

      // Statistics
      stats: {
        totalPredictions: 0,
        successfulPredictions: 0,
        failedPredictions: 0,
        averageConfidence: 0,
      },
    };
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get specific state slice
   */
  get(path) {
    const keys = path.split('.');
    let value = this.state;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Update connection state
   */
  updateConnection(isConnected, error = null) {
    this.state.connection = {
      isConnected,
      lastChecked: new Date().toISOString(),
      error,
    };

    this.emit('connection:changed', this.state.connection);
  }

  /**
   * Update model state
   */
  updateModel(modelData) {
    this.state.model = {
      ...this.state.model,
      ...modelData,
      loaded: true,
    };

    this.emit('model:changed', this.state.model);
  }

  /**
   * Clear model state
   */
  clearModel() {
    this.state.model = {
      loaded: false,
      name: null,
      version: null,
      accuracy: null,
      nGestures: 0,
      info: null,
    };

    this.emit('model:changed', this.state.model);
  }

  /**
   * Update gestures list
   */
  updateGestures(gesturesList) {
    this.state.gestures = {
      list: gesturesList,
      loaded: true,
      lastUpdated: new Date().toISOString(),
    };

    this.emit('gestures:changed', this.state.gestures);
  }

  /**
   * Add prediction to history
   */
  addPrediction(prediction) {
    const predictionEntry = {
      ...prediction,
      timestamp: new Date().toISOString(),
    };

    this.state.prediction.lastPrediction = predictionEntry;
    this.state.prediction.history.unshift(predictionEntry);

    // Limit history size
    if (this.state.prediction.history.length > this.state.prediction.maxHistorySize) {
      this.state.prediction.history = this.state.prediction.history.slice(
        0,
        this.state.prediction.maxHistorySize
      );
    }

    // Update statistics
    this.state.stats.totalPredictions++;
    if (prediction.success) {
      this.state.stats.successfulPredictions++;
      
      // Update average confidence
      const totalConfidence = this.state.prediction.history
        .filter(p => p.success && p.data?.confidence)
        .reduce((sum, p) => sum + p.data.confidence, 0);
      
      const successfulCount = this.state.stats.successfulPredictions;
      this.state.stats.averageConfidence = successfulCount > 0 
        ? totalConfidence / successfulCount 
        : 0;
    } else {
      this.state.stats.failedPredictions++;
    }

    this.emit('prediction:added', predictionEntry);
    this.emit('stats:updated', this.state.stats);
  }

  /**
   * Set prediction active state
   */
  setPredictionActive(isActive) {
    this.state.prediction.isActive = isActive;
    this.emit('prediction:activeChanged', isActive);
  }

  /**
   * Clear prediction history
   */
  clearPredictionHistory() {
    this.state.prediction.history = [];
    this.state.prediction.lastPrediction = null;
    this.emit('prediction:historyCleared');
  }

  /**
   * Update training state
   */
  updateTraining(trainingData) {
    const wasTraining = this.state.training.isTraining;
    
    this.state.training = {
      ...this.state.training,
      ...trainingData,
    };

    // Emit specific events
    if (!wasTraining && this.state.training.isTraining) {
      this.emit('training:started', this.state.training);
    } else if (wasTraining && !this.state.training.isTraining) {
      this.emit('training:stopped', this.state.training);
    }

    this.emit('training:changed', this.state.training);
  }

  /**
   * Start training
   */
  startTraining(totalEpochs) {
    this.state.training = {
      isTraining: true,
      progress: 0,
      currentEpoch: 0,
      totalEpochs,
      loss: null,
      accuracy: null,
      startTime: new Date().toISOString(),
      error: null,
    };

    this.emit('training:started', this.state.training);
  }

  /**
   * Update training progress
   */
  updateTrainingProgress(epoch, loss, accuracy) {
    if (!this.state.training.isTraining) {
      return;
    }

    this.state.training.currentEpoch = epoch;
    this.state.training.loss = loss;
    this.state.training.accuracy = accuracy;
    this.state.training.progress = 
      this.state.training.totalEpochs > 0 
        ? (epoch / this.state.training.totalEpochs) * 100 
        : 0;

    this.emit('training:progress', this.state.training);
  }

  /**
   * Stop training
   */
  stopTraining(error = null) {
    this.state.training.isTraining = false;
    this.state.training.error = error;

    this.emit('training:stopped', this.state.training);
  }

  /**
   * Get prediction history
   */
  getPredictionHistory(limit = null) {
    if (limit) {
      return this.state.prediction.history.slice(0, limit);
    }
    return [...this.state.prediction.history];
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.state.stats };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.state.stats = {
      totalPredictions: 0,
      successfulPredictions: 0,
      failedPredictions: 0,
      averageConfidence: 0,
    };

    this.emit('stats:reset');
  }

  /**
   * Reset all state
   */
  resetAll() {
    this.state = {
      connection: {
        isConnected: false,
        lastChecked: null,
        error: null,
      },
      model: {
        loaded: false,
        name: null,
        version: null,
        accuracy: null,
        nGestures: 0,
        info: null,
      },
      gestures: {
        list: [],
        loaded: false,
        lastUpdated: null,
      },
      prediction: {
        isActive: false,
        lastPrediction: null,
        history: [],
        maxHistorySize: 50,
      },
      training: {
        isTraining: false,
        progress: 0,
        currentEpoch: 0,
        totalEpochs: 0,
        loss: null,
        accuracy: null,
        startTime: null,
        error: null,
      },
      stats: {
        totalPredictions: 0,
        successfulPredictions: 0,
        failedPredictions: 0,
        averageConfidence: 0,
      },
    };

    this.emit('state:reset');
  }

  /**
   * Subscribe to state changes
   */
  subscribe(event, callback) {
    this.on(event, callback);
    
    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }
}

// Export singleton instance
const stateService = new StateService();
module.exports = stateService;
