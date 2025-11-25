/**
 * Training Service: Handle model training operations
 * Manages training lifecycle, progress tracking, and validation
 */

const apiService = require('../core/apiService');
const stateService = require('../core/stateService');

class TrainingService {
  constructor() {
    this.statusCheckInterval = null;
    this.statusCheckIntervalMs = 1000; // Check every second
  }

  /**
   * Start training with configuration
   */
  async startTraining(trainingConfig) {
    const response = await apiService.startTraining(trainingConfig);

    if (response.success) {
      // Update state
      stateService.startTraining(trainingConfig.epochs || 0);

      // Start polling for status updates
      this.startStatusPolling();
    }

    return response;
  }

  /**
   * Stop training
   */
  async stopTraining() {
    const response = await apiService.stopTraining();

    // Stop polling
    this.stopStatusPolling();

    // Update state
    stateService.stopTraining();

    return response;
  }

  /**
   * Get training status
   */
  async getTrainingStatus() {
    const response = await apiService.getTrainingStatus();

    if (response.success && response.data) {
      // Update state with training progress
      const trainingData = response.data;

      if (trainingData.is_training !== undefined) {
        stateService.updateTraining({
          isTraining: trainingData.is_training,
        });
      }

      if (trainingData.current_epoch !== undefined && trainingData.total_epochs !== undefined) {
        stateService.updateTrainingProgress(
          trainingData.current_epoch,
          trainingData.loss,
          trainingData.accuracy
        );
      }

      // Stop polling if training finished
      if (!trainingData.is_training && this.statusCheckInterval) {
        this.stopStatusPolling();
      }
    }

    return response;
  }

  /**
   * Start polling for training status
   */
  startStatusPolling() {
    // Clear existing interval
    this.stopStatusPolling();

    // Start new interval
    this.statusCheckInterval = setInterval(async () => {
      await this.getTrainingStatus();
    }, this.statusCheckIntervalMs);
  }

  /**
   * Stop polling for training status
   */
  stopStatusPolling() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  /**
   * Get training history
   */
  async getTrainingHistory() {
    return apiService.getTrainingHistory();
  }

  /**
   * Validate trained model
   */
  async validateModel() {
    return apiService.validateModel();
  }

  /**
   * Upload training data
   */
  async uploadData(dataPayload) {
    return apiService.uploadData(dataPayload);
  }

  /**
   * Get list of training data
   */
  async getDataList() {
    return apiService.getDataList();
  }

  /**
   * Delete training data
   */
  async deleteData(id) {
    return apiService.deleteData(id);
  }

  /**
   * Get training state from store
   */
  getTrainingState() {
    return stateService.get('training');
  }

  /**
   * Check if training is active
   */
  isTraining() {
    return stateService.get('training.isTraining') || false;
  }

  /**
   * Get training progress
   */
  getProgress() {
    return stateService.get('training.progress') || 0;
  }

  /**
   * Cleanup when service is destroyed
   */
  cleanup() {
    this.stopStatusPolling();
  }
}

// Export singleton instance
const trainingService = new TrainingService();
module.exports = trainingService;
