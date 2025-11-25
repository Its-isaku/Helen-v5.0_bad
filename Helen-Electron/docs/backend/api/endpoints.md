# 📡 API Endpoints - Documentación Completa

Documentación detallada de todos los endpoints disponibles en Helen API.

## 🌐 Base URL

```
http://localhost:5000  # Desarrollo
http://<IP-EC2>:5000   # Producción
```

---

## Endpoints

### 1. GET `/` - Info del Servicio

Obtiene información básica del servicio API.

**Request:**
```bash
curl http://localhost:5000/
```

**Response:**
```json
{
  "service": "Helen API",
  "version": "5.0",
  "status": "running",
  "model_loaded": true
}
```

---

### 2. GET `/gestures` - Lista de Gestos

Obtiene la lista de todos los gestos que el modelo puede reconocer.

**Request:**
```bash
curl http://localhost:5000/gestures
```

**Response:**
```json
{
  "gestures": ["inicio", "clima", "noticias", "alarma", "dispositivos"],
  "total": 5
}
```

**Campos:**
- `gestures`: Array con nombres de todos los gestos disponibles
- `total`: Número total de gestos

---

### 3. GET `/health` - Health Check

Verifica el estado del servicio y si el modelo está cargado correctamente.

**Request:**
```bash
curl http://localhost:5000/health
```

**Response (Exitoso):**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2025-10-26T12:00:00Z"
}
```

**Response (Error):**
```json
{
  "status": "unhealthy",
  "model_loaded": false,
  "error": "Model file not found"
}
```

**HTTP Status Codes:**
- `200`: Servicio funcionando correctamente
- `503`: Servicio no disponible (modelo no cargado)

---

### 4. POST `/predict` - Predicción de Gesto

Realiza la predicción de un gesto basado en una secuencia de landmarks.

**Request:**
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "sequence": [
      [0.5, 0.6, 0.1, ...],  # Frame 1 (63 features)
      [0.5, 0.6, 0.1, ...],  # Frame 2
      ...                     # 40 frames total
    ]
  }'
```

**Body Parameters:**
- `sequence` (required): Array de 40 frames
  - Cada frame: Array de 63 features (21 landmarks × 3 coordenadas)
  - Formato: `[[x, y, z] para cada landmark]` aplanado

**Response (Exitoso):**
```json
{
  "prediccion_gesto": "clima",
  "probabilidad_maxima": 0.9532,
  "todas_probabilidades": {
    "clima": 0.9532,
    "inicio": 0.0245,
    "noticias": 0.0123,
    "alarma": 0.0065,
    "dispositivos": 0.0035
  },
  "tiempo_inferencia_ms": 45.23
}
```

**Campos de Response:**
- `prediccion_gesto`: Nombre del gesto predicho
- `probabilidad_maxima`: Confianza de la predicción (0-1)
- `todas_probabilidades`: Probabilidades para todos los gestos
- `tiempo_inferencia_ms`: Tiempo de procesamiento en milisegundos

**Errores Posibles:**

**400 Bad Request - Secuencia vacía:**
```json
{
  "error": "Missing required field",
  "details": "'sequence' field is required"
}
```

**400 Bad Request - Longitud incorrecta:**
```json
{
  "error": "Invalid sequence length",
  "details": "Expected sequence of 40 frames, got 10"
}
```

**400 Bad Request - Features incorrectos:**
```json
{
  "error": "Invalid feature count",
  "details": "Expected 63 features per frame, got 42"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Prediction failed",
  "details": "Model inference error"
}
```

---

## 📊 Formato de Datos

### Estructura de Landmarks

Los landmarks de MediaPipe deben ser enviados en el siguiente formato:

```python
# 21 landmarks de la mano, cada uno con (x, y, z)
landmarks = [
    [x0, y0, z0],  # Landmark 0: Wrist
    [x1, y1, z1],  # Landmark 1: Thumb CMC
    [x2, y2, z2],  # Landmark 2: Thumb MCP
    # ... hasta landmark 20
]

# Aplanar para enviar
sequence_frame = landmarks.flatten()  # 63 features

# Secuencia completa (40 frames)
sequence = [sequence_frame] * 40
```

### Orden de Landmarks MediaPipe

```
0:  WRIST
1:  THUMB_CMC
2:  THUMB_MCP
3:  THUMB_IP
4:  THUMB_TIP
5:  INDEX_FINGER_MCP
6:  INDEX_FINGER_PIP
7:  INDEX_FINGER_DIP
8:  INDEX_FINGER_TIP
9:  MIDDLE_FINGER_MCP
10: MIDDLE_FINGER_PIP
11: MIDDLE_FINGER_DIP
12: MIDDLE_FINGER_TIP
13: RING_FINGER_MCP
14: RING_FINGER_PIP
15: RING_FINGER_DIP
16: RING_FINGER_TIP
17: PINKY_MCP
18: PINKY_PIP
19: PINKY_DIP
20: PINKY_TIP
```

---

## 🔧 Ejemplos de Uso

### Python con requests

```python
import requests
import numpy as np

# Crear secuencia de prueba
sequence = np.random.rand(40, 63).tolist()

# Hacer predicción
response = requests.post(
    'http://localhost:5000/predict',
    json={'sequence': sequence}
)

if response.status_code == 200:
    result = response.json()
    print(f"Gesto: {result['prediccion_gesto']}")
    print(f"Confianza: {result['probabilidad_maxima']:.2%}")
else:
    print(f"Error: {response.json()['error']}")
```

### JavaScript/TypeScript

```javascript
const sequence = Array(40).fill(null).map(() => 
  Array(63).fill(0).map(() => Math.random())
);

const response = await fetch('http://localhost:5000/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ sequence })
});

const result = await response.json();
console.log(`Gesto: ${result.prediccion_gesto}`);
console.log(`Confianza: ${(result.probabilidad_maxima * 100).toFixed(2)}%`);
```

### curl

```bash
# Con archivo JSON
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d @sequence.json

# Inline (pequeño ejemplo)
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"sequence": [[0.5, 0.6, 0.1, ...], ...]}'
```

---

## ⚡ Performance

### Latencia Típica

| Condición | Latencia |
|-----------|----------|
| Óptima (CPU) | 40-50ms |
| Normal (CPU) | 50-70ms |
| Con carga | 70-100ms |

### Throughput

- **CPU**: ~20-22 predicciones/segundo
- **Con optimizaciones**: ~25-30 predicciones/segundo

### Recomendaciones

1. **Batch Predictions**: Para múltiples predicciones, considera implementar batch processing
2. **Caché**: Implementar caché para secuencias similares
3. **Rate Limiting**: Implementar rate limiting para evitar sobrecarga

---

## 🔒 Seguridad

### Headers Recomendados

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -H "User-Agent: HelenApp/5.0" \
  -H "X-Request-ID: unique-request-id" \
  -d @data.json
```

### Rate Limiting (Futuro)

En producción se recomienda implementar:
- Límite de requests por IP
- Límite de requests por usuario/API key
- Timeout de requests largos

---

## 📝 Notas Importantes

1. **Normalización**: Los landmarks deben estar normalizados (0-1)
2. **Secuencia completa**: Siempre enviar 40 frames completos
3. **Orden**: Mantener el orden correcto de landmarks
4. **Timeout**: Requests con timeout de 30 segundos por defecto

---

## 🔗 Ver También

- [README del API](./README.md)
- [Testing con example_client](./testing.md)
- [Deployment](./deployment.md)
- [Arquitectura del Modelo](../ml-service/model-architecture.md)

---

**Última actualización**: Octubre 2025  
**Mantenido por**: Equipo Helen - 5ta Generación
