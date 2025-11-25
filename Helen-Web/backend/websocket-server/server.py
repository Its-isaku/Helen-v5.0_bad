"""
WebSocket server for Helen v5.0.2.

This module implements a Flask-based WebSocket server for real-time gesture recognition,
serving as the backend for the Helen system. It receives hand landmark frames from clients,
buffers them, and uses a trained LSTM model (GestureNet) to predict gestures. The server
exposes socket events for connection, disconnection, frame submission, and prediction results.

Dependencies:
    - backend/ml-service/model/model.py: Provides the GestureNet class for gesture prediction.
    - backend/ml-service/data/gestures_map.json: Maps gesture names to class indices.
    - frontend/web-app/src/services/websocketService.js: Consumes socket events and sends frames.

Notes:
    - All configuration is loaded from environment variables and .env file.
    - This server is the entry point for gesture prediction requests from the frontend.
    - Logging is configured for production use; only critical logs are kept.
"""

import os
import time
from pathlib import Path
from collections import deque
import torch
from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from dotenv import load_dotenv
import logging

###############################################################################
# Configuration and Constants
###############################################################################
load_dotenv()

###############################################################################
# Path Setup for ml-service
###############################################################################
ml_service_path = Path(__file__).parent.parent / 'ml-service'
import sys
sys.path.insert(0, str(ml_service_path))

from model.model import GestureNet

###############################################################################
# Logging Configuration
###############################################################################
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

###############################################################################
# Flask App and SocketIO Setup
###############################################################################
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

###############################################################################
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='threading',
    logger=True,
    engineio_logger=False
)

###############################################################################
# Model and Prediction Configuration
###############################################################################
FRAMES_REQUIRED = 40
FEATURE_SIZE = 126
CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.7'))

###############################################################################
# Model Paths
###############################################################################
MODEL_PATH = ml_service_path / 'trained_models' / 'model_final.pth'
GESTURES_MAP_PATH = ml_service_path / 'data' / 'gestures_map.json'
NORMALIZATION_STATS_PATH = ml_service_path / 'trained_models' / 'normalization_stats.pth'

###############################################################################
# Device Selection
###############################################################################
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

###############################################################################
# Global State
###############################################################################
model = None
gestures_map = {}
id_to_gesture = {}
normalization_stats = None
frame_buffers = {}
last_prediction_time = {}  # Track last prediction time per session (for cooldown)

def load_model():
    """
    Load the trained gesture recognition model and supporting data.
    
    Loads the gesture mapping, normalization statistics, and initializes the GestureNet
    model for inference. This function must be called before serving predictions.
    
    Returns:
        bool: True if the model and data were loaded successfully, False otherwise.
    """
    global model, gestures_map, id_to_gesture, normalization_stats
    try:
        logger.info("=" * 70)
        logger.info("Loading LSTM model for gesture recognition")
        logger.info("=" * 70)
        import json
        with open(GESTURES_MAP_PATH, 'r', encoding='utf-8') as f:
            gestures_map = json.load(f)
        id_to_gesture = {v: k for k, v in gestures_map.items()}
        logger.info(f"Gestures loaded: {list(gestures_map.keys())}")
        if NORMALIZATION_STATS_PATH.exists():
            normalization_stats = torch.load(NORMALIZATION_STATS_PATH, map_location=DEVICE)
            logger.info("Normalization stats loaded")
        model = GestureNet(
            input_size=FEATURE_SIZE,
            hidden_size=128,
            num_layers=3,
            output_size=len(gestures_map),
            dropout=0.35
        ).to(DEVICE)
        model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
        model.eval()
        logger.info(f"Model loaded on device: {DEVICE}")
        logger.info("=" * 70)
        return True
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return False

def predict_gesture(session_id):
    """
    Predict the gesture for a given session's frame buffer.
    
    Converts the buffered frames to a tensor, normalizes if stats are available,
    and runs inference using the loaded model. Returns the predicted gesture and confidence.
    
    Args:
        session_id (str): The session/client identifier.
    
    Returns:
        dict or None: Prediction result with gesture name, id, and confidence, or None on error.
    """
    import numpy as np  # Local import, only needed here
    try:
        buffer = frame_buffers[session_id]
        if len(buffer) < FRAMES_REQUIRED:
            return None
        sequence = np.array(list(buffer), dtype=np.float32)
        sequence_tensor = torch.FloatTensor(sequence).unsqueeze(0)
        if normalization_stats:
            mean = normalization_stats['mean'].to(DEVICE)
            std = normalization_stats['std'].to(DEVICE)
            sequence_tensor = (sequence_tensor - mean) / std
        sequence_tensor = sequence_tensor.to(DEVICE)
        with torch.no_grad():
            output = model(sequence_tensor)
            probabilities = torch.softmax(output, dim=1)
            confidence, predicted_class = torch.max(probabilities, 1)
        predicted_id = predicted_class.item()
        confidence_value = confidence.item()
        gesture_name = id_to_gesture.get(predicted_id, "unknown")
        logger.info(f"Predicted gesture: {gesture_name} (confidence: {confidence_value:.2f})")
        return {
            'gesture': gesture_name,
            'gesture_id': predicted_id,
            'confidence': confidence_value
        }
    except Exception as e:
        logger.error(f"Error in predict_gesture: {e}")
        return None

@socketio.on('connect')
def handle_connect():
    """
    Handle new client connection event.
    
    Initializes the frame buffer and cooldown timer for the session, and emits
    a connection established event to the client.
    """
    session_id = request.sid
    frame_buffers[session_id] = deque(maxlen=FRAMES_REQUIRED)
    last_prediction_time[session_id] = 0
    logger.info(f"Client connected: {session_id}")
    emit('connection_established', {
        'status': 'connected',
        'frames_required': FRAMES_REQUIRED,
        'session_id': session_id
    })

@socketio.on('disconnect')
def handle_disconnect():
    """
    Handle client disconnection event.
    
    Cleans up the frame buffer and cooldown timer for the session.
    """
    session_id = request.sid
    if session_id in frame_buffers:
        del frame_buffers[session_id]
    if session_id in last_prediction_time:
        del last_prediction_time[session_id]
    logger.info(f"Client disconnected: {session_id}")

@socketio.on('add_frame')
def handle_add_frame(data):
    """
    Handle incoming frame data from client for gesture prediction.
    
    Validates the landmarks, ensures two hands are present, manages the frame buffer,
    and triggers prediction when enough frames are collected. Emits prediction and buffer
    status events to the client.
    
    Args:
        data (dict): Dictionary containing 'landmarks' key with list of features.
    """
    session_id = request.sid
    try:
        logger.info(f"Received add_frame event from {session_id}")
        logger.info(f"Data keys: {list(data.keys()) if isinstance(data, dict) else 'not a dict'}")
        landmarks = data.get('landmarks')
        if not landmarks or not isinstance(landmarks, list):
            logger.error(f"Invalid landmarks type: {type(landmarks)}")
            emit('error', {'message': 'Invalid landmarks'})
            return
        logger.info(f"Landmarks count: {len(landmarks)}")
        if len(landmarks) != FEATURE_SIZE:
            logger.error(f"Wrong landmark count: {len(landmarks)} != {FEATURE_SIZE}")
            emit('error', {
                'message': f'Expected {FEATURE_SIZE}, got {len(landmarks)}'
            })
            return
        # Validate that both hands are present
        left_hand_data = landmarks[0:63]
        right_hand_data = landmarks[63:126]
        has_left = any(val != 0 for val in left_hand_data)
        has_right = any(val != 0 for val in right_hand_data)
        hand_count = int(has_left) + int(has_right)
        if hand_count != 2:
            logger.warning(f"Invalid hand count: {hand_count}/2 hands detected, clearing buffer")
            if session_id in frame_buffers and len(frame_buffers[session_id]) > 0:
                frame_buffers[session_id].clear()
                logger.info(f"Buffer cleared due to invalid hand count")
            return
        # Add frame to buffer
        frame_buffers[session_id].append(landmarks)
        frames_collected = len(frame_buffers[session_id])
        logger.info(f"Frame added to buffer: {frames_collected}/{FRAMES_REQUIRED} [2 hands detected]")
        emit('buffer_status', {
            'frames_collected': frames_collected,
            'frames_required': FRAMES_REQUIRED,
            'ready': frames_collected == FRAMES_REQUIRED
        })
        # Trigger prediction if buffer is full
        if frames_collected == FRAMES_REQUIRED:
            logger.info(f"Buffer full, checking prediction cooldown...")
            current_time = time.time()
            time_since_last_prediction = current_time - last_prediction_time.get(session_id, 0)
            PREDICTION_COOLDOWN = 2.0
            if time_since_last_prediction < PREDICTION_COOLDOWN:
                remaining_cooldown = PREDICTION_COOLDOWN - time_since_last_prediction
                logger.info(f"Prediction cooldown active - {remaining_cooldown:.1f}s remaining")
                for _ in range(10):
                    if len(frame_buffers[session_id]) > 0:
                        frame_buffers[session_id].popleft()
                return
            result = predict_gesture(session_id)
            if result and result['confidence'] >= CONFIDENCE_THRESHOLD:
                logger.info(f"Prediction passed threshold: {result['gesture']} ({result['confidence']:.2f})")
                emit('prediction', result)
                last_prediction_time[session_id] = current_time
                for _ in range(20):
                    if len(frame_buffers[session_id]) > 0:
                        frame_buffers[session_id].popleft()
                logger.info(f"Buffer partially cleared: {len(frame_buffers[session_id])}/{FRAMES_REQUIRED} frames remaining")
            elif result:
                logger.info(f"Low confidence: {result['gesture']} ({result['confidence']:.2f})")
    except Exception as e:
        logger.error(f"Error in handle_add_frame: {e}", exc_info=True)
        emit('error', {'message': str(e)})

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for monitoring server status.
    
    Returns a JSON object with server health and model status.
    """
    return {
        'status': 'healthy',
        'model_loaded': model is not None,
        'device': str(DEVICE),
        'frames_required': FRAMES_REQUIRED
    }

if __name__ == '__main__':
    """
    Main entrypoint for running the WebSocket server.
    Loads the model and starts the Flask-SocketIO server.
    """
    if not load_model():
        logger.error("Failed to load model. Exiting.")
        import sys
        sys.exit(1)
    port = int(os.getenv('WEBSOCKET_PORT', 5001))
    logger.info(f"WebSocket Server starting on port {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=False, allow_unsafe_werkzeug=True)