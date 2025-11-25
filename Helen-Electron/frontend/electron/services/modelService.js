/**
 * Model Service: Handle model management operations
 * Model information, switching, metrics, and file operations
 */

const apiService = require('../core/apiService');
const stateService = require('../core/stateService');

class ModelService {
  /**
   * Get current model information
   */
  async getModelInfo() {
    const response = await apiService.getModelInfo();

    if (response.success && response.data) {
      // Update state with model info
      stateService.updateModel({
        name: response.data.model_name || response.data.name,
        version: response.data.version,
        accuracy: response.data.accuracy,
        nGestures: response.data.n_gestures || response.data.num_gestures,
        info: response.data,
      });
    }

    return response;
  }

  /**
   * Get list of available models
   */
  async getModelList() {
    return apiService.getModelList();
  }

  /**
   * Load a specific model
   */
  async loadModel(modelPath) {
    const response = await apiService.loadModel(modelPath);

    if (response.success) {
      // Refresh model info
      await this.getModelInfo();
    }

    return response;
  }

  /**
   * Switch to a different model
   */
  async switchModel(modelIdentifier) {
    // If switching by path
    if (typeof modelIdentifier === 'string' && modelIdentifier.includes('/')) {
      return this.loadModel(modelIdentifier);
    }

    // If switching by name/id, first get model list to find path
    const listResponse = await this.getModelList();
    
    if (!listResponse.success) {
      return listResponse;
    }

    const models = listResponse.data.models || [];
    const targetModel = models.find(m => 
      m.name === modelIdentifier || 
      m.id === modelIdentifier
    );

    if (!targetModel) {
      return {
        success: false,
        error: `Model not found: ${modelIdentifier}`,
      };
    }

    return this.loadModel(targetModel.path);
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics() {
    return apiService.getModelMetrics();
  }

  /**
   * Get model info from state
   */
  getModelFromState() {
    return stateService.get('model');
  }

  /**
   * Check if model is loaded
   */
  isModelLoaded() {
    return stateService.get('model.loaded') || false;
  }

  /**
   * Get model name
   */
  getModelName() {
    return stateService.get('model.name') || 'Unknown';
  }

  /**
   * Get model accuracy
   */
  getModelAccuracy() {
    return stateService.get('model.accuracy');
  }

  /**
   * Get number of gestures
   */
  getGestureCount() {
    return stateService.get('model.nGestures') || 0;
  }

  /**
   * Refresh model information
   */
  async refresh() {
    return this.getModelInfo();
  }

  /**
   * Unload current model
   */
  unloadModel() {
    stateService.clearModel();
    
    return {
      success: true,
      message: 'Model unloaded from state',
    };
  }
}

// Export singleton instance
const modelService = new ModelService();
module.exports = modelService;
