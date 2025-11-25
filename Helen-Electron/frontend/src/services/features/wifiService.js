/**
 * WiFi Service: handles WiFi operations including QR code generation
 * TODO: Implement with Electron backend when needed
 */

import { API_CONFIG } from '../../config/constants';

class WiFiService {
    constructor() {
        this.currentNetwork = null;
        this.availableNetworks = [];
        console.warn('WiFiService: WiFi features disabled - backend integration pending');
    }

    /**
     * Get list of available WiFi networks
     * @returns {Promise<Array>} List of WiFi networks
     */
    async getAvailableNetworks() {
        console.warn('WiFi features not yet implemented in Electron backend');
        return [];
    }

    /**
     * Connect to a WiFi network
     * @param {string} ssid - Network SSID
     * @param {string} password - Network password
     * @param {string} security - Security type (WPA2, WPA3, etc.)
     * @returns {Promise<Object>} Connection result
     */
    async connectToNetwork(ssid, password, security = 'WPA2') {
        console.warn('WiFi connect not yet implemented in Electron backend');
        return { success: false, message: 'WiFi features not implemented' };
    }

    /**
     * Generate QR code for WiFi connection
     * @param {string} ssid - Network SSID
     * @param {string} password - Network password
     * @param {string} security - Security type (WPA, WPA2, WEP, nopass)
     * @returns {Promise<Object>} QR code data (base64 image or SVG)
     */
    async generateWiFiQR(ssid, password, security = 'WPA2') {
        // Return WiFi string for now - could integrate with QR library later
        return {
            qrCode: null,
            format: 'string',
            wifiString: this.generateWiFiString(ssid, password, security),
        };
    }

    /**
     * Generate WiFi QR string format
     * Format: WIFI:T:WPA;S:ssid;P:password;H:false;;
     * @param {string} ssid - Network SSID
     * @param {string} password - Network password
     * @param {string} security - Security type
     * @returns {string} WiFi QR string
     */
    generateWiFiString(ssid, password, security = 'WPA2') {
        const securityMap = {
            'WPA': 'WPA',
            'WPA2': 'WPA',
            'WPA3': 'WPA',
            'WEP': 'WEP',
            'nopass': 'nopass',
        };

        const secType = securityMap[security] || 'WPA';
        const hidden = 'false'; // Set to 'true' if network is hidden

        return `WIFI:T:${secType};S:${this.escapeString(ssid)};P:${this.escapeString(password)};H:${hidden};;`;
    }

    /**
     * Escape special characters for QR string
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeString(str) {
        return str.replace(/[\\;,:]/g, '\\$&');
    }

    /**
     * Get current WiFi connection status
     * @returns {Promise<Object>} Connection status
     */
    async getConnectionStatus() {
        return {
            connected: false,
            current_network: null,
            message: 'WiFi status not implemented'
        };
    }

    /**
     * Disconnect from current network
     * @returns {Promise<Object>} Disconnect result
     */
    async disconnect() {
        return { success: false, message: 'WiFi features not implemented' };
    }
}

export const wifiService = new WiFiService();
