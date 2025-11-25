/**
 * WiFi Service: handles WiFi operations including QR code generation
 * Ready for backend integration (Rust API)
 */

import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/constants';

class WiFiService {
    constructor() {
        this.currentNetwork = null;
        this.availableNetworks = [];
    }

    /**
     * Get list of available WiFi networks
     * @returns {Promise<Array>} List of WiFi networks
     */
    async getAvailableNetworks() {
        const response = await apiClient.get(
            API_CONFIG.RUST_ENDPOINTS.WIFI_LIST,
            {},
            'rust'
        );

        this.availableNetworks = response.networks || [];
        return this.availableNetworks;
    }

    /**
     * Connect to a WiFi network
     * @param {string} ssid - Network SSID
     * @param {string} password - Network password
     * @param {string} security - Security type (WPA2, WPA3, etc.)
     * @returns {Promise<Object>} Connection result
     */
    async connectToNetwork(ssid, password, security = 'WPA2') {
        const response = await apiClient.post(
            API_CONFIG.RUST_ENDPOINTS.WIFI_CONNECT,
            {
                ssid,
                password,
                security,
            },
            {},
            'rust'
        );

        if (response.success) {
            this.currentNetwork = {
                ssid,
                security,
                connected: true,
            };
        }

        return response;
    }

    /**
     * Generate QR code for WiFi connection
     * @param {string} ssid - Network SSID
     * @param {string} password - Network password
     * @param {string} security - Security type (WPA, WPA2, WEP, nopass)
     * @returns {Promise<Object>} QR code data (base64 image or SVG)
     */
    async generateWiFiQR(ssid, password, security = 'WPA2') {
        const response = await apiClient.post(
            API_CONFIG.RUST_ENDPOINTS.WIFI_QR_GENERATE,
            {
                ssid,
                password,
                security,
                format: 'svg', // or 'png'
            },
            {},
            'rust'
        );

        return {
            qrCode: response.qr_code, // Base64 or SVG string
            format: response.format,
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
        const response = await apiClient.get(
            API_CONFIG.RUST_ENDPOINTS.WIFI_STATUS,
            {},
            'rust'
        );

        this.currentNetwork = response.current_network;
        return response;
    }

    /**
     * Disconnect from current network
     * @returns {Promise<Object>} Disconnect result
     */
    async disconnect() {
        const response = await apiClient.post(
            API_CONFIG.RUST_ENDPOINTS.WIFI_CONNECT,
            { action: 'disconnect' },
            {},
            'rust'
        );

        this.currentNetwork = null;
        return response;
    }
}

export const wifiService = new WiFiService();