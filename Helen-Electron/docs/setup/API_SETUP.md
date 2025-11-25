# 🔌 API Setup Guide

Guía completa para configurar y ejecutar la API REST del proyecto Helen.

## 📋 Pre-requisitos

- ✅ [Development Environment Setup](./DEVELOPMENT_ENVIRONMENT.md)
- ✅ Python 3.10+ instalado
- ✅ pip funcionando correctamente

---

## 🏗️ Estructura del Proyecto API

```
backend/api/
├── api_service.py          # Servidor FastAPI principal
├── requirements.txt        # Dependencias Python
├── .env                   # Variables de entorno
├── models/                # Modelos de datos (Pydantic)
│   ├── __init__.py
│   ├── prediction.py
│   └── response.py
├── services/              # Lógica de negocio
│   ├── __init__.py
│   ├── predictor.py      # Servicio de predicción
│   └── model_loader.py   # Carga del modelo ML
├── middleware/            # Middleware personalizado
│   ├── __init__.py
│   └── cors.py
└── tests/                 # Tests unitarios
    ├── __init__.py
    └── test_api.py
```

---

## 📦 Instalación

### 1. Navegar al directorio de la API

```bash
cd backend/api
```

### 2. Crear entorno virtual

**Linux/macOS**:
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows PowerShell**:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows CMD**:
```cmd
python -m venv venv
.\venv\Scripts\activate.bat
```

### 3. Actualizar pip

```bash
pip install --upgrade pip
```

### 4. Instalar dependencias

```bash
pip install -r requirements.txt
```

---

## 📝 Dependencias (requirements.txt)

```txt
# API Framework
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0

# CORS y Middleware
python-multipart==0.0.6

# Machine Learning
torch==2.1.0
torchvision==0.16.0
numpy==1.24.3

# Utilidades
python-dotenv==1.0.0
aiofiles==23.2.1

# Logging y Monitoreo
loguru==0.7.2

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
```

### Instalación de PyTorch

**CPU only (más ligero)**:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

**GPU (NVIDIA CUDA 11.8)**:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**GPU (NVIDIA CUDA 12.1)**:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

---

## ⚙️ Configuración

### Variables de Entorno

**Archivo**: `.env`

```bash
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=True
API_DEBUG=True

# Model Configuration
MODEL_PATH=../ml-service/trained_models/best_model.pth
MODEL_DEVICE=cpu  # cpu o cuda

# CORS Configuration
CORS_ORIGINS=http://localhost:1420,tauri://localhost
CORS_CREDENTIALS=true
CORS_METHODS=*
CORS_HEADERS=*

# Logging
LOG_LEVEL=DEBUG  # DEBUG, INFO, WARNING, ERROR
LOG_FILE=logs/api.log

# Performance
MAX_CONCURRENT_REQUESTS=100
REQUEST_TIMEOUT=30
```

### Cargar Variables de Entorno

**Archivo**: `config.py`

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
    api_debug: bool = True
    
    # Model
    model_path: str = "../ml-service/trained_models/best_model.pth"
    model_device: str = "cpu"
    
    # CORS
    cors_origins: List[str] = [
        "http://localhost:1420",
        "tauri://localhost"
    ]
    cors_credentials: bool = True
    cors_methods: List[str] = ["*"]
    cors_headers: List[str] = ["*"]
    
    # Logging
    log_level: str = "DEBUG"
    log_file: str = "logs/api.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

---

## 🚀 API Service Principal

**Archivo**: `api_service.py`

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import numpy as np
from typing import List
import uvicorn
from loguru import logger

from config import settings
from services.predictor import GesturePredictor

# Inicializar FastAPI
app = FastAPI(
    title="Helen API",
    description="API para reconocimiento de gestos en tiempo real",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_credentials,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)

# Inicializar predictor
predictor = GesturePredictor(
    model_path=settings.model_path,
    device=settings.model_device
)

# Modelos de datos
class LandmarkInput(BaseModel):
    """Modelo para entrada de landmarks"""
    landmarks: List[List[float]]
    
    class Config:
        json_schema_extra = {
            "example": {
                "landmarks": [
                    [0.5, 0.5, 0.1],
                    [0.6, 0.6, 0.1],
                    # ... 21 landmarks en total
                ]
            }
        }

class PredictionResponse(BaseModel):
    """Modelo para respuesta de predicción"""
    gesture: str
    confidence: float
    processing_time: float

# Endpoints
@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "Helen API - Sistema de Reconocimiento de Señas",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": predictor.is_loaded(),
        "device": settings.model_device
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_gesture(input_data: LandmarkInput):
    """
    Predecir gesto desde landmarks de la mano
    
    Args:
        input_data: Landmarks de la mano (21 puntos, 3 coordenadas c/u)
    
    Returns:
        PredictionResponse con gesto, confianza y tiempo de procesamiento
    """
    try:
        # Validar que hay 21 landmarks
        if len(input_data.landmarks) != 21:
            raise HTTPException(
                status_code=400,
                detail=f"Se esperan 21 landmarks, recibidos: {len(input_data.landmarks)}"
            )
        
        # Convertir a numpy array
        landmarks_array = np.array(input_data.landmarks, dtype=np.float32)
        
        # Realizar predicción
        result = predictor.predict(landmarks_array)
        
        logger.info(f"Predicción: {result['gesture']} (confianza: {result['confidence']:.2%})")
        
        return PredictionResponse(
            gesture=result['gesture'],
            confidence=result['confidence'],
            processing_time=result['processing_time']
        )
        
    except ValueError as e:
        logger.error(f"Error de validación: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"Error en predicción: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/gestures")
async def get_available_gestures():
    """Obtener lista de gestos disponibles"""
    return {
        "gestures": predictor.get_gesture_names(),
        "total": len(predictor.get_gesture_names())
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    """Evento de inicio"""
    logger.info("Iniciando Helen API...")
    logger.info(f"Modelo cargado desde: {settings.model_path}")
    logger.info(f"Dispositivo: {settings.model_device}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Evento de cierre"""
    logger.info("Cerrando Helen API...")

# Main
if __name__ == "__main__":
    uvicorn.run(
        "api_service:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
        log_level=settings.log_level.lower()
    )
```

---

## 🧠 Servicio de Predicción

**Archivo**: `services/predictor.py`

```python
import torch
import numpy as np
import time
from pathlib import Path
from loguru import logger

class GesturePredictor:
    """Servicio para realizar predicciones de gestos"""
    
    def __init__(self, model_path: str, device: str = "cpu"):
        """
        Inicializar predictor
        
        Args:
            model_path: Ruta al modelo entrenado
            device: 'cpu' o 'cuda'
        """
        self.device = torch.device(device)
        self.model = None
        self.gesture_names = None
        
        # Cargar modelo
        self._load_model(model_path)
    
    def _load_model(self, model_path: str):
        """Cargar modelo desde archivo"""
        try:
            model_file = Path(model_path)
            
            if not model_file.exists():
                raise FileNotFoundError(f"Modelo no encontrado: {model_path}")
            
            checkpoint = torch.load(model_file, map_location=self.device)
            
            # Cargar arquitectura del modelo
            from model.solid_classifier import GestureClassifier
            self.model = GestureClassifier(
                input_size=63,  # 21 landmarks * 3 coordenadas
                num_classes=checkpoint['num_classes']
            )
            
            # Cargar pesos
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.model.to(self.device)
            self.model.eval()
            
            # Cargar nombres de gestos
            self.gesture_names = checkpoint.get('gesture_names', [])
            
            logger.info(f"Modelo cargado exitosamente: {len(self.gesture_names)} gestos")
            
        except Exception as e:
            logger.error(f"Error cargando modelo: {e}")
            raise
    
    def predict(self, landmarks: np.ndarray) -> dict:
        """
        Realizar predicción
        
        Args:
            landmarks: Array de landmarks (21, 3)
        
        Returns:
            dict con 'gesture', 'confidence', 'processing_time'
        """
        start_time = time.time()
        
        try:
            # Preprocesar
            landmarks_flat = landmarks.flatten()
            landmarks_tensor = torch.FloatTensor(landmarks_flat).unsqueeze(0)
            landmarks_tensor = landmarks_tensor.to(self.device)
            
            # Predicción
            with torch.no_grad():
                outputs = self.model(landmarks_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                confidence, predicted = torch.max(probabilities, 1)
            
            # Obtener nombre del gesto
            gesture_idx = predicted.item()
            gesture_name = self.gesture_names[gesture_idx] if self.gesture_names else str(gesture_idx)
            confidence_value = confidence.item()
            
            processing_time = time.time() - start_time
            
            return {
                'gesture': gesture_name,
                'confidence': confidence_value,
                'processing_time': processing_time
            }
            
        except Exception as e:
            logger.error(f"Error en predicción: {e}")
            raise
    
    def is_loaded(self) -> bool:
        """Verificar si el modelo está cargado"""
        return self.model is not None
    
    def get_gesture_names(self) -> list:
        """Obtener lista de nombres de gestos"""
        return self.gesture_names or []
```

---

## 🧪 Testing

### Test Unitarios

**Archivo**: `tests/test_api.py`

```python
import pytest
from fastapi.testclient import TestClient
from api_service import app

client = TestClient(app)

def test_root():
    """Test del endpoint raíz"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_health_check():
    """Test de health check"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_predict_valid():
    """Test de predicción válida"""
    landmarks = [[0.5, 0.5, 0.1] for _ in range(21)]
    
    response = client.post("/predict", json={"landmarks": landmarks})
    assert response.status_code == 200
    
    data = response.json()
    assert "gesture" in data
    assert "confidence" in data
    assert 0 <= data["confidence"] <= 1

def test_predict_invalid_landmarks():
    """Test con número incorrecto de landmarks"""
    landmarks = [[0.5, 0.5, 0.1] for _ in range(10)]  # Solo 10 en vez de 21
    
    response = client.post("/predict", json={"landmarks": landmarks})
    assert response.status_code == 400

def test_get_gestures():
    """Test de obtención de gestos"""
    response = client.get("/gestures")
    assert response.status_code == 200
    assert "gestures" in response.json()
```

### Ejecutar Tests

```bash
# Todos los tests
pytest

# Con coverage
pytest --cov=. --cov-report=html

# Verbose
pytest -v

# Test específico
pytest tests/test_api.py::test_predict_valid
```

---

## 🚀 Ejecución

### Modo Desarrollo

```bash
# Activar entorno virtual
source venv/bin/activate  # Linux/macOS
# .\venv\Scripts\Activate.ps1  # Windows

# Ejecutar servidor
python api_service.py
```

La API estará disponible en:
- **URL**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Modo Producción

```bash
# Usando Uvicorn directamente
uvicorn api_service:app --host 0.0.0.0 --port 8000 --workers 4

# Con Gunicorn (Linux/macOS)
gunicorn api_service:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 📊 Monitoreo y Logs

### Configurar Logging

**Archivo**: `logging_config.py`

```python
from loguru import logger
import sys

def setup_logging(log_level: str = "INFO", log_file: str = "logs/api.log"):
    """Configurar sistema de logging"""
    
    # Remover handler por defecto
    logger.remove()
    
    # Agregar handler para consola
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
        level=log_level,
        colorize=True
    )
    
    # Agregar handler para archivo
    logger.add(
        log_file,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function} - {message}",
        level=log_level,
        rotation="10 MB",
        retention="7 days",
        compression="zip"
    )
    
    return logger
```

---

## 🐛 Troubleshooting

### Error: "Model file not found"

```bash
# Verificar que el modelo existe
ls -la ../ml-service/trained_models/

# Si no existe, entrenar el modelo primero:
cd ../ml-service
python train_solid.py
```

### Error: "CUDA out of memory"

```bash
# Cambiar a CPU en .env
MODEL_DEVICE=cpu
```

### Error: "Port already in use"

```bash
# Linux/macOS
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# O cambiar puerto en .env
API_PORT=8001
```

### Error: ModuleNotFoundError

```bash
# Verificar que el venv está activado
which python  # debe apuntar a tu venv

# Reinstalar dependencias
pip install -r requirements.txt
```

---

## 📈 Performance Tips

### 1. Usar GPU si está disponible

```bash
# En .env
MODEL_DEVICE=cuda
```

### 2. Optimizar workers

```bash
# Número de workers = (2 x CPU cores) + 1
uvicorn api_service:app --workers 8
```

### 3. Cachear predicciones

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def cached_prediction(landmarks_tuple):
    # Tu lógica de predicción
    pass
```

---

## ✅ Checklist de Setup API

- [ ] Entorno virtual creado y activado
- [ ] Dependencias instaladas
- [ ] Variables de entorno configuradas
- [ ] Modelo ML disponible
- [ ] API inicia sin errores
- [ ] Health check responde correctamente
- [ ] Endpoint /predict funciona
- [ ] Tests pasan exitosamente
- [ ] Logs funcionan correctamente

---

**Siguiente paso**: [ML Setup](./ML_SETUP.md) para configurar el servicio de Machine Learning.

---

**Última actualización**: Octubre 2025  
**Mantenido por**: Equipo Helen - 5ta Generación
