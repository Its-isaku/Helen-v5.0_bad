import { API_CONFIG } from '../../config/constants';

/**
 * theme service: handles theme persistence with backend
 */

class ThemeService {
    /**
     * get saved theme from backend
     * @return {Promise<string>} theme id
     */
    async getTheme() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.THEME_GET}`);

            if (!response.ok) {
                throw new Error('Error loading theme');
            }

            const data = await response.json();
            return data.themeId || 'ocean'; // default theme
        } catch (error) {
            console.error('Error loading theme:', error);
            return localStorage.getItem('themeId') || 'ocean'; // fallback to localStorage
        }
    }
    
    /**
     * save theme preference to backend
     * @param {string} themeId - theme identifier
     * @return {Promise<boolean>} success status
     */
    async setTheme(themeId) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.THEME_UPDATE}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ themeId }),
            });

            if (!response.ok) {
                throw new Error('Error saving theme');
            }

            localStorage.setItem('theme', themeId);
            return true;
        } catch (error) {
            console.error('Error saving theme:', error);
            localStorage.setItem('theme', themeId); // fallback to localStorage
            return false;
        }
    }
}

export const themeService = new ThemeService();