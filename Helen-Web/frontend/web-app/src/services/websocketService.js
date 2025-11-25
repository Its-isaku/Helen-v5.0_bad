/**
 * WebSocket Service - Communication with prediction server
 * Port: 5001
 * BASED ON Electron predictionService architecture
 */

import { io } from 'socket.io-client';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.listeners = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.url = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:5001';
        
        // Log WebSocketService initialization
        console.log('WebSocketService initialized');
    }

    /**
     * Connect to the WebSocket server
     */
    connect(customUrl = null) {
        if (this.socket) {
            // Warn if already connected
            console.warn('Already connected');
            return;
        }

        const url = customUrl || this.url;
        // Log WebSocket connection attempt
        console.log(`Connecting to WebSocket: ${url}`);
        
        this.socket = io(url, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts
        });

        // Setup event handlers
        this.setupEventHandlers();
    }

    /**
     * Set up event handlers
     */
  setupEventHandlers() {
    this.socket.on('connect', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        // Log successful WebSocket connection
        console.log('WebSocket connected');
        this.emit('connect');
    });

    this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        // Log WebSocket disconnection
        console.log(`WebSocket disconnected: ${reason}`);
        this.emit('disconnect', reason);
    });

    this.socket.on('connection_established', (data) => {
        this.emit('connection_established', data);
    });

    this.socket.on('buffer_status', (data) => {
        this.emit('buffer_status', data);
    });

    this.socket.on('prediction', (data) => {
        // Log received gesture prediction
        console.log(`Gesture: ${data.gesture} (${(data.confidence * 100).toFixed(1)}%)`);
        this.emit('prediction', data);
    });

    this.socket.on('error', (error) => {
        // Log WebSocket error
        console.error('WebSocket error:', error);
        this.emit('error', error);
    });

    this.socket.on('connect_error', (error) => {
        // Log connection error
        console.error('Connection error:', error.message);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            // Log if maximum reconnection attempts reached
            console.error('Max reconnection attempts reached');
            this.emit('max_reconnect_failed');
        }
    });
}

    /**
     * Send landmarks frame (126 features)
     */
    sendFrame(landmarks) {
        if (!this.isConnected || !this.socket) {
            return false;
        }

        if (!Array.isArray(landmarks) || landmarks.length !== 126) {
            return false;
        }
        
        this.socket.emit('add_frame', { landmarks });
        
        return true;
    }

    /**
     * Subscribe to events
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        
        // Return function to unsubscribe
        return () => {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }

    /**
     * Emit event to local listeners
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => {
                try {
                    cb(data);
                } catch (error) {
                    // Log error in event listener
                    console.error(`Error in listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            // Log manual WebSocket disconnection
            console.log('WebSocket disconnected manually');
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            socket: !!this.socket,
            url: this.url
        };
    }

    /**
     * Manually retry connection
     */
    reconnect() {
        if (this.socket) {
            this.disconnect();
        }
        this.reconnectAttempts = 0;
        this.connect();
    }
}

// Singleton instance
export const websocketService = new WebSocketService();
export default websocketService;