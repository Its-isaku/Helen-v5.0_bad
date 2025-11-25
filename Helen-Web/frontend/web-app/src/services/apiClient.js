/**
 * apiClient.js - DEPRECATED
 * This file is deprecated and kept only for backward compatibility.
 * Services should use Electron IPC or electronBackend.js instead.
 */

console.warn(`
⚠️  DEPRECATION WARNING: apiClient.js
This module is deprecated. Services should use:
- electronBackend.js for Electron IPC communication
- Direct service implementations in electron/services/
`);

/**
 * Stub API client for backward compatibility
 * Services using this should be migrated to Electron IPC
 */
class ApiClient {
    constructor() {
        console.warn('ApiClient: This class is deprecated');
    }

    /**
     * @deprecated Use electronBackend instead
     */
    async get(endpoint, params = {}, backend = 'python') {
        console.warn(`ApiClient.get() is deprecated. Endpoint: ${endpoint}`);
        throw new Error('ApiClient is deprecated. Please migrate to electronBackend.js');
    }

    /**
     * @deprecated Use electronBackend instead
     */
    async post(endpoint, data = {}, params = {}, backend = 'python') {
        console.warn(`ApiClient.post() is deprecated. Endpoint: ${endpoint}`);
        throw new Error('ApiClient is deprecated. Please migrate to electronBackend.js');
    }

    /**
     * @deprecated Use electronBackend instead
     */
    async put(endpoint, data = {}, params = {}, backend = 'python') {
        console.warn(`ApiClient.put() is deprecated. Endpoint: ${endpoint}`);
        throw new Error('ApiClient is deprecated. Please migrate to electronBackend.js');
    }

    /**
     * @deprecated Use electronBackend instead
     */
    async delete(endpoint, params = {}, backend = 'python') {
        console.warn(`ApiClient.delete() is deprecated. Endpoint: ${endpoint}`);
        throw new Error('ApiClient is deprecated. Please migrate to electronBackend.js');
    }
}

export const apiClient = new ApiClient();
