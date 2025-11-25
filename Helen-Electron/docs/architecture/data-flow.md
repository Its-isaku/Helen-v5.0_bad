# 🔄 Data Flow - Flujo de Datos

Diagrama y explicación del flujo de datos en el sistema Helen.

## Flujo Completo de Predicción

```
┌───────────┐
│  Usuario  │ Hace seña
│   hace    │
│   seña    │
└─────┬─────┘
      │
      ▼
┌─────────────┐
│   Webcam    │ Captura video
│             │
└──────┬──────┘
       │ Video Stream
       ▼
┌──────────────────┐
│ MediaPipe Hands  │ Detecta landmarks
│ (21 puntos × 3D) │
└────────┬─────────┘
         │ Landmarks (x, y, z)
         ▼
┌──────────────────┐
│  Buffer (40)     │ Acumula frames
│  frames          │
└────────┬─────────┘
         │ Secuencia completa (40×63)
         ▼
┌──────────────────┐
│ Frontend React   │ Envía POST /predict
│                  │
└────────┬─────────┘
         │ HTTP Request
         │ JSON: {sequence: [[...], ...]}
         ▼
┌──────────────────┐
│  Backend API     │ Valida input
│  (FastAPI)       │
└────────┬─────────┘
         │ Normalized sequence
         ▼
┌──────────────────┐
│  PyTorch Model   │ Inferencia
│  (Neural Net)    │
└────────┬─────────┘
         │ Predictions + probabilities
         ▼
┌──────────────────┐
│  Backend API     │ Formatea respuesta
│                  │
└────────┬─────────┘
         │ HTTP Response
         │ JSON: {gesto, confianza, ...}
         ▼
┌──────────────────┐
│ Frontend React   │ Muestra resultado
│                  │
└────────┬─────────┘
         │
         ▼
┌───────────┐
│  Usuario  │ Ve predicción
│   ve      │
│ resultado │
└───────────┘
```

## Formato de Datos

### Landmarks
```
21 puntos × 3 coordenadas (x, y, z) = 63 features por frame
40 frames = Secuencia completa
```

### API Request
```json
{
  "sequence": [
    [x0,y0,z0, x1,y1,z1, ..., x20,y20,z20],  // Frame 1
    [...],                                     // Frame 2
    ...                                        // 40 frames
  ]
}
```

### API Response
```json
{
  "prediccion_gesto": "clima",
  "probabilidad_maxima": 0.9532,
  "todas_probabilidades": {...},
  "tiempo_inferencia_ms": 45.23
}
```

Ver [System Overview](./system-overview.md) para más detalles.
