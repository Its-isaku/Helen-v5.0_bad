/**
 * Gesture Service: Manage gesture CRUD operations and statistics
 * Handles all gesture-related API calls
 */

import apiService from '../core/apiService';
import stateService from '../core/stateService';

class GestureService {
  /**
   * Get list of all gestures
   */
  async getGestures() {
    const response = await apiService.getGestures();

    if (response.success) {
      // Update state with gestures list
      const gesturesList = response.data.gestures || [];
      stateService.updateGestures(gesturesList);

      // Update model gesture count
      if (response.data.n_gestures !== undefined) {
        stateService.updateModel({
          nGestures: response.data.n_gestures,
        });
      }
    }

    return response;
  }

  /**
   * Get gesture by ID
   */
  async getGesture(id) {
    return apiService.getGesture(id);
  }

  /**
   * Create new gesture
   */
  async createGesture(gestureData) {
    const response = await apiService.createGesture(gestureData);

    if (response.success) {
      // Refresh gestures list
      await this.getGestures();
    }

    return response;
  }

  /**
   * Update existing gesture
   */
  async updateGesture(id, gestureData) {
    const response = await apiService.updateGesture(id, gestureData);

    if (response.success) {
      // Refresh gestures list
      await this.getGestures();
    }

    return response;
  }

  /**
   * Delete gesture
   */
  async deleteGesture(id) {
    const response = await apiService.deleteGesture(id);

    if (response.success) {
      // Refresh gestures list
      await this.getGestures();
    }

    return response;
  }

  /**
   * Get gesture statistics
   */
  async getGestureStats() {
    return apiService.getGestureStats();
  }

  /**
   * Get gesture from state
   */
  getGestureFromState(name) {
    const gestures = stateService.get('gestures.list');
    
    if (!Array.isArray(gestures)) {
      return null;
    }

    return gestures.find(g => g === name || g.name === name);
  }

  /**
   * Get all gestures from state
   */
  getGesturesFromState() {
    return stateService.get('gestures.list') || [];
  }

  /**
   * Check if gestures are loaded
   */
  areGesturesLoaded() {
    return stateService.get('gestures.loaded') || false;
  }
}

// Export singleton instance
export const gestureService = new GestureService();
export default gestureService;