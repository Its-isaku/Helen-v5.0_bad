/**
 * State Service: Manage application state for backend-related data
 * WEB VERSION - Uses custom EventEmitter
 */

// Simple EventEmitter for web
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(...args));
  }
}

class StateService extends EventEmitter {
  constructor() {
    super();
    
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
  }

  getState() {
    return { ...this.state };
  }

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

  updateConnection(isConnected, error = null) {
    this.state.connection = {
      isConnected,
      lastChecked: new Date().toISOString(),
      error,
    };

    this.emit('connection:changed', this.state.connection);
  }

  updateModel(modelData) {
    this.state.model = {
      ...this.state.model,
      ...modelData,
      loaded: true,
    };

    this.emit('model:changed', this.state.model);
  }

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

  updateGestures(gesturesList) {
    this.state.gestures = {
      list: gesturesList,
      loaded: true,
      lastUpdated: new Date().toISOString(),
    };

    this.emit('gestures:changed', this.state.gestures);
  }

  addPrediction(prediction) {
    const predictionEntry = {
      ...prediction,
      timestamp: new Date().toISOString(),
    };

    this.state.prediction.lastPrediction = predictionEntry;
    this.state.prediction.history.unshift(predictionEntry);

    if (this.state.prediction.history.length > this.state.prediction.maxHistorySize) {
      this.state.prediction.history = this.state.prediction.history.slice(
        0,
        this.state.prediction.maxHistorySize
      );
    }

    this.state.stats.totalPredictions++;
    if (prediction.success) {
      this.state.stats.successfulPredictions++;
      
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

  setPredictionActive(isActive) {
    this.state.prediction.isActive = isActive;
    this.emit('prediction:activeChanged', isActive);
  }

  clearPredictionHistory() {
    this.state.prediction.history = [];
    this.state.prediction.lastPrediction = null;
    this.emit('prediction:historyCleared');
  }

  updateTraining(trainingData) {
    const wasTraining = this.state.training.isTraining;
    
    this.state.training = {
      ...this.state.training,
      ...trainingData,
    };

    if (!wasTraining && this.state.training.isTraining) {
      this.emit('training:started', this.state.training);
    } else if (wasTraining && !this.state.training.isTraining) {
      this.emit('training:stopped', this.state.training);
    }

    this.emit('training:changed', this.state.training);
  }

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

  stopTraining(error = null) {
    this.state.training.isTraining = false;
    this.state.training.error = error;

    this.emit('training:stopped', this.state.training);
  }

  getPredictionHistory(limit = null) {
    if (limit) {
      return this.state.prediction.history.slice(0, limit);
    }
    return [...this.state.prediction.history];
  }

  getStats() {
    return { ...this.state.stats };
  }

  resetStats() {
    this.state.stats = {
      totalPredictions: 0,
      successfulPredictions: 0,
      failedPredictions: 0,
      averageConfidence: 0,
    };

    this.emit('stats:reset');
  }

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

  subscribe(event, callback) {
    this.on(event, callback);
    
    return () => {
      this.off(event, callback);
    };
  }
}

const stateService = new StateService();
export default stateService;