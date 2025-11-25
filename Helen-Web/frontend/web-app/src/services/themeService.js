import { API_CONFIG } from '../config/constants';

/**
 * Theme Service: Handles theme persistence with backend
 */

class ThemeService {
    /**
     * Get saved theme from backend
     * @return {Promise<string>} Theme ID
     */
    async getTheme() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.THEME_GET}`);

            if (!response.ok) {
                // Throw error if unable to get theme from backend
                throw new Error('Error retrieving theme from backend');
            }

            const data = await response.json();
            return data.themeId || 'ocean'; // Default theme
        } catch (error) {
            // Log error if unable to get theme from backend
            console.error('Error retrieving theme from backend:', error);
            return localStorage.getItem('themeId') || 'ocean'; // Fallback to localStorage
        }
    }
    
    /**
     * Save theme preference to backend
     * @param {string} themeId - Theme identifier
     * @return {Promise<boolean>} Success status
     */
    async setTheme(themeId) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.THEME_UPDATE}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ themeId }),
            });

            if (!response.ok) {
                // Throw error if unable to save theme to backend
                throw new Error('Error saving theme to backend');
            }

            localStorage.setItem('theme', themeId);
            return true;
        } catch (error) {
            // Log error if unable to save theme to backend
            console.error('Error saving theme to backend:', error);
            localStorage.setItem('theme', themeId); // Fallback to localStorage
            return false;
        }
    }
}

export const themeService = new ThemeService();