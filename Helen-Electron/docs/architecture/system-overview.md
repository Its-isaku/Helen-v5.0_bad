# 🏛️ System Overview - Visión General del Sistema

Visión general de la arquitectura del sistema Helen v5.0.

## 📋 Descripción del Sistema

Helen es un sistema de reconocimiento de lenguaje de señas en tiempo real que utiliza:
- **Frontend**: Tauri (Rust + React) para aplicación desktop multiplataforma
- **Backend API**: FastAPI para inferencia en tiempo real
- **ML Service**: PyTorch para entrenamiento y gestión de modelos
- **Computer Vision**: MediaPipe para detección de landmarks de manos

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     HELEN SYSTEM v5.0                       │
└─────────────────────────────────────────────────────────────┘

┌────────────────┐         ┌──────────────┐         ┌─────────────┐
│                │         │              │         │             │
│   Frontend     │◄───────►│  Backend API │◄───────►│ ML Service  │
│  (Tauri+React) │  HTTP   │  (FastAPI)   │  Model  │  (PyTorch)  │
│                │         │              │         │             │
└────────┬───────┘         └──────────────┘         └─────────────┘
         │
         │ MediaPipe
         ▼
    ┌─────────┐
    │ Webcam  │
    └─────────┘
```

## 📦 Componentes Principales

### 1. Frontend (Tauri + React)

**Responsabilidades:**
- Captura de video desde webcam
- Detección de landmarks con MediaPipe
- Interfaz de usuario
- Comunicación con API

**Tecnologías:**
- Tauri (Rust)
- React 18
- Javascript
- CSS
- MediaPipe Hands

### 2. Backend API (FastAPI)

**Responsabilidades:**
- Recibir secuencias de landmarks
- Realizar inferencia con modelo PyTorch
- Retornar predicciones
- Health checks y monitoreo

**Tecnologías:**
- FastAPI
- PyTorch (inferencia)
- Uvicorn/Gunicorn

### 3. ML Service (PyTorch)

**Responsabilidades:**
- Captura y preparación de datos
- Entrenamiento de modelos
- Validación y evaluación
- Exportación de modelos

**Tecnologías:**
- PyTorch
- OpenCV
- MediaPipe
- NumPy

## 🔄 Flujo de Datos

Ver [Data Flow](./data-flow.md) para diagrama detallado.

**Flujo simplificado:**

1. Usuario hace seña frente a cámara
2. Frontend captura video con MediaPipe
3. MediaPipe detecta landmarks (21 puntos × 3 coordenadas)
4. Frontend acumula 40 frames
5. Frontend envía secuencia al API
6. API realiza inferencia con modelo PyTorch
7. API retorna predicción (gesto + confianza)
8. Frontend muestra resultado al usuario

## Objetivos de la 5ta Generación

### Mejoras Implementadas

✅ **Migración de ML a Redes Neuronales**
- De ML tradicional a PyTorch CNN/LSTM
- Mejor precisión y rendimiento

✅ **Optimización de Frontend**
- De Electron a Tauri (menos recursos)
- Interfaz más amigable

✅ **Procesamiento en Tiempo Real**
- De imágenes estáticas a video continuo
- Menor latencia

### Problemas Resueltos

✅ **Cámara siempre encendida**
- Implementar control manual de cámara

✅ **Activación prematura**
- Mejor umbral de confianza y confirmación

✅ **Mala detección con diferentes condiciones**
- Dataset más robusto con variedad de condiciones
- Data augmentation

✅ **Vocabulario limitado**
- Arquitectura escalable para más gestos


## 🔐 Seguridad

### Medidas Implementadas

- ✅ Control manual de cámara (no siempre activa)
- ✅ Procesamiento local (sin envío de video a cloud)
- ✅ CORS configurado en API
- ✅ Rate limiting en API (futuro)
- ✅ Validación de inputs
- ✅ Sanitización de datos

## 🚀 Escalabilidad

### Horizontal

- Múltiples instancias del API con load balancer
- Caché de predicciones frecuentes
- CDN para assets estáticos

### Vertical

- GPU para inferencia más rápida
- Optimización de modelo (quantization, pruning)
- Batch processing de predicciones

## 🔗 Enlaces Relacionados

- [Data Flow Diagram](./data-flow.md)
- [Tech Stack Detallado](./tech-stack.md)
- [Frontend Documentation](../frontend/README.md)
- [Backend Documentation](../backend/README.md)

---

**Última actualización**: Octubre 2025  
**Mantenido por**: Equipo Helen - 5ta Generación
