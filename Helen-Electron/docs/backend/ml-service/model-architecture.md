# 🏗️ Model Architecture - Arquitectura del Modelo

Documentación técnica de la arquitectura del modelo PyTorch.

## Arquitectura del Modelo

El modelo utiliza una arquitectura de red neuronal totalmente conectada (Fully Connected).

### Input
- 40 frames × 63 features = Secuencia temporal de landmarks (1 mano, duplicar features pra 2 manos)

### Layers
1. FC Layer 1: 63 → 256
2. FC Layer 2: 256 → 512  
3. FC Layer 3: 512 → 256
4. FC Layer 4: 256 → 128
5. Output Layer: 128 → num_classes

## Ver Implementación

Código completo en: `backend/ml-service/model/solid_classifier.py`
