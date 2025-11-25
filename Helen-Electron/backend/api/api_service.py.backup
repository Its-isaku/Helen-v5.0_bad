"""
Servicio Flask API para Inferencia de Gestos en Tiempo Real
Endpoint /predict recibe secuencias de landmarks y retorna predicciones
"""

import os
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import numpy as np
import json
import logging
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Importar desde la ruta correcta (ahora está en ../ml-service/model/)
import sys
ml_service_path = Path(os.getenv('ML_SERVICE_PATH', '../ml-service'))
sys.path.insert(0, str(ml_service_path))

from model.model import GestureNet

# Configurar logging
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.getenv('LOG_FILE', 'api.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configurar CORS desde variable de entorno
cors_origins = os.getenv('CORS_ORIGINS', '*')
if cors_origins != '*':
    cors_origins = cors_origins.split(',')
CORS(app, origins=cors_origins)

# --- Configuración Global desde .env ---
MODEL_PATH = Path(os.getenv('MODEL_PATH', '../ml-service/trained_models/model_final.pth'))
GESTURES_MAP_PATH = Path(os.getenv('GESTURES_MAP_PATH', '../ml-service/data/gestures_map.json'))
NORMALIZATION_STATS_PATH = Path(os.getenv('NORMALIZATION_STATS_PATH', '../ml-service/trained_models/normalization_stats.pth'))

# Device configuration
device_config = os.getenv('DEVICE', 'auto')
if device_config == 'auto':
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
else:
    DEVICE = torch.device(device_config)

# Variables globales para el modelo
MODEL = None
GESTURES_INVERSE_MAP = {}  # {id_numerico: nombre_gesto}
NORMALIZATION_STATS = None


def load_model_and_config():
    """
    Carga el modelo entrenado y configuraciones al iniciar Flask
    """
    global MODEL, GESTURES_INVERSE_MAP, NORMALIZATION_STATS
    
    try:
        logger.info("=" * 70)
        logger.info("🚀 INICIANDO CARGA DEL MODELO")
        logger.info("=" * 70)
        
        # 1. Cargar mapeo de gestos
        if not GESTURES_MAP_PATH.exists():
            raise FileNotFoundError(f"❌ No se encontró {GESTURES_MAP_PATH}")
        
        logger.info(f"📁 Cargando gestures_map desde: {GESTURES_MAP_PATH}")
        with open(GESTURES_MAP_PATH, 'r') as f:
            gestures_map = json.load(f)
        
        # Crear mapeo inverso (id -> nombre)
        GESTURES_INVERSE_MAP = {v: k for k, v in gestures_map.items()}
        n_classes = len(gestures_map)
        
        logger.info(f"✅ Mapeo de gestos cargado: {n_classes} clases")
        for idx, name in GESTURES_INVERSE_MAP.items():
            logger.info(f"  [{idx}] {name}")
        
        # 2. Cargar estadísticas de normalización
        if NORMALIZATION_STATS_PATH.exists():
            logger.info(f"📊 Cargando estadísticas de normalización desde: {NORMALIZATION_STATS_PATH}")
            NORMALIZATION_STATS = torch.load(NORMALIZATION_STATS_PATH, map_location=DEVICE)
            logger.info(f"✅ Estadísticas de normalización cargadas")
        else:
            logger.warning(f"⚠️  Advertencia: No se encontraron estadísticas de normalización en {NORMALIZATION_STATS_PATH}")
        
        # 3. Cargar modelo
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"❌ No se encontró el modelo en {MODEL_PATH}")
        
        logger.info(f"🧠 Cargando modelo desde: {MODEL_PATH}")
        logger.info(f"🖥️  Usando device: {DEVICE}")
        
        MODEL = GestureNet(output_size=n_classes).to(DEVICE)
        MODEL.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
        MODEL.eval()
        
        logger.info(f"✅ Modelo cargado exitosamente")
        logger.info(f"📐 Arquitectura: {MODEL.get_model_info()}")
        logger.info("=" * 70)
        
    except Exception as e:
        logger.error(f"❌ ERROR AL CARGAR EL MODELO: {e}")
        logger.error("=" * 70)
        raise


@app.route('/health', methods=['GET'])
def health_check():
    """
    Endpoint de health check para verificar que la API esté funcionando
    """
    return jsonify({
        "status": "healthy",
        "model_loaded": MODEL is not None,
        "device": str(DEVICE),
        "n_gestures": len(GESTURES_INVERSE_MAP)
    }), 200


@app.route('/predict', methods=['POST'])
def predict():
    """
    Endpoint principal de predicción
    
    Recibe:
        {
            "landmarks": [[x1, y1, z1], [x2, y2, z2], ...],  # Lista de 126 valores (42 landmarks * 3)
            "return_probabilities": false  # Opcional
        }
    
    Retorna:
        {
            "gesture": "nombre_gesto",
            "confidence": 0.95,
            "probabilities": {...}  # Opcional si return_probabilities=true
        }
    """
    global MODEL, NORMALIZATION_STATS
    
    try:
        # Validar que el modelo esté cargado
        if MODEL is None:
            logger.error("❌ Modelo no cargado")
            return jsonify({"error": "Modelo no cargado"}), 500
        
        # Obtener datos del request
        data = request.get_json()
        
        if 'landmarks' not in data:
            logger.warning("⚠️  Request sin campo 'landmarks'")
            return jsonify({"error": "Falta campo 'landmarks' en el request"}), 400
        
        landmarks = data['landmarks']
        return_probabilities = data.get('return_probabilities', False)
        
        # Convertir a numpy array y validar dimensiones
        landmarks_array = np.array(landmarks, dtype=np.float32)
        
        # Validar forma: debe ser (seq_length, 126) o (1, seq_length, 126)
        if landmarks_array.ndim == 2:
            # Agregar dimensión de batch
            landmarks_array = landmarks_array[np.newaxis, :]  # (1, seq_length, 126)
        
        if landmarks_array.shape[-1] != 126:
            logger.warning(f"⚠️  Dimensión incorrecta: {landmarks_array.shape}")
            return jsonify({
                "error": f"Esperado 126 features por frame, recibido {landmarks_array.shape[-1]}"
            }), 400
        
        # Convertir a tensor
        landmarks_tensor = torch.FloatTensor(landmarks_array).to(DEVICE)
        
        # Normalizar si tenemos las estadísticas
        if NORMALIZATION_STATS is not None:
            mean = NORMALIZATION_STATS['mean'].to(DEVICE)
            std = NORMALIZATION_STATS['std'].to(DEVICE)
            landmarks_tensor = (landmarks_tensor - mean) / std
        
        # Predicción
        with torch.no_grad():
            output = MODEL(landmarks_tensor)
            probabilities = torch.softmax(output, dim=1)
            predicted_class = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0, predicted_class].item()
        
        # Obtener nombre del gesto
        gesture_name = GESTURES_INVERSE_MAP.get(predicted_class, "unknown")
        
        logger.info(f"🎯 Predicción: {gesture_name} (confianza: {confidence:.2%})")
        
        # Preparar respuesta
        response = {
            "gesture": gesture_name,
            "gesture_id": predicted_class,
            "confidence": float(confidence)
        }
        
        # Agregar probabilidades si se solicitan
        if return_probabilities:
            probs_dict = {
                GESTURES_INVERSE_MAP[i]: float(probabilities[0, i].item())
                for i in range(len(GESTURES_INVERSE_MAP))
            }
            response["probabilities"] = probs_dict
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"❌ Error en predicción: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/gestures', methods=['GET'])
def get_gestures():
    """
    Retorna la lista de gestos disponibles
    """
    return jsonify({
        "gestures": list(GESTURES_INVERSE_MAP.values()),
        "n_gestures": len(GESTURES_INVERSE_MAP),
        "gestures_map": GESTURES_INVERSE_MAP
    }), 200


if __name__ == '__main__':
    # Cargar modelo al iniciar
    load_model_and_config()
    
    # Obtener configuración del servidor desde .env
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 8000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"🚀 Iniciando servidor en {host}:{port}")
    logger.info(f"🐛 Debug mode: {debug}")
    
    app.run(
        host=host,
        port=port,
        debug=debug
    )
