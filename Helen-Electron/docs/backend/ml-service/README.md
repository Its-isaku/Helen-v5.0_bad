# 🧠 Helen ML Service - Machine Learning

Servicio de Machine Learning para entrenamiento y gestión del modelo de reconocimiento de gestos usando PyTorch.

## 📋 Descripción

El servicio ML de Helen se encarga de todo el ciclo de vida del modelo:
- Captura y preparación de datos
- Entrenamiento del modelo con PyTorch
- Validación y evaluación
- Exportación para producción

## 🏗️ Arquitectura

```
backend/ml-service/
├── train_solid.py           # ⭐ Script principal de entrenamiento (con menú)
├── data_prep.py            # Preparación y procesamiento de datos
├── grabarVideo.py          # Captura de gestos para dataset
├── test_system.py          # Tests del sistema
├── requirements.txt        # Dependencias Python
├── model/                  # Arquitectura del modelo
│   ├── __init__.py
│   └── solid_classifier.py
├── dataset_gestos/         # Dataset de gestos (carpetas por clase)
├── X_data.npy             # Datos de entrenamiento procesados
├── Y_labels.npy           # Etiquetas
├── gestures_map.json      # Mapeo gesto ↔ ID
├── model_final.pth        # ⭐ Modelo entrenado
└── normalization_stats.pth # Estadísticas de normalización
```

## 🚀 Quick Start

### Instalación

```bash
cd backend/ml-service
python3.12 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Uso del Menú Interactivo

```bash
python train_solid.py
```

**Opciones del menú:**
1. 🏋️ Entrenar modelo con gestos actuales
2. ➕ Agregar NUEVO gesto al dataset
3. 📹 Agregar MÁS VIDEOS a gesto existente
4. ❌ Salir

## 📚 Documentación Adicional

- **[Data Preparation](./data-preparation.md)** - Captura y preparación de datos
- **[Training](./training.md)** - Guía completa de entrenamiento
- **[Model Architecture](./model-architecture.md)** - Arquitectura del modelo

## 🎯 Flujo de Trabajo Típico

### 1. Crear Nuevo Gesto

```bash
# Opción A: Menú interactivo
python train_solid.py
# → Opción 2: Agregar NUEVO gesto

# Opción B: Línea de comandos
python grabarVideo.py <nombre_gesto> ../dataset_gestos
```

### 2. Procesar Datos

```bash
# Se ejecuta automáticamente al salir del menú
# O manualmente:
python data_prep.py --dataset ../dataset_gestos --output . --seq-length 40
```

### 3. Entrenar Modelo

```bash
python train_solid.py
# → Opción 1: Entrenar modelo
```

### 4. Validar Sistema

```bash
python test_system.py
```

### 5. Copiar a API

```bash
cp model_final.pth ../api/
cp gestures_map.json ../api/
cp normalization_stats.pth ../api/
```

## 📊 Archivos Generados

| Archivo | Descripción | Tamaño típico |
|---------|-------------|---------------|
| `model_final.pth` | Modelo entrenado | ~5MB |
| `gestures_map.json` | Mapeo de gestos | <1KB |
| `normalization_stats.pth` | Stats de normalización | <1KB |
| `X_data.npy` | Datos de entrenamiento | Variable |
| `Y_labels.npy` | Etiquetas | Variable |

## 🔧 Requisitos del Sistema

### Hardware Mínimo
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 10GB libres

### Hardware Recomendado
- **CPU**: 8+ cores
- **RAM**: 16GB+
- **GPU**: NVIDIA con CUDA (opcional, acelera entrenamiento)

### Software
- Python 3.10+
- PyTorch 2.0+
- OpenCV 4.8+
- MediaPipe 0.10+

## 📈 Performance

### Tiempo de Entrenamiento

| Condiciones | Tiempo (30 épocas) |
|-------------|-------------------|
| CPU (4 cores) | 5-10 minutos |
| CPU (8 cores) | 3-5 minutos |
| GPU (CUDA) | 1-2 minutos |

### Precisión Típica

Con 20 videos por gesto:
- **Training Accuracy**: 95-98%
- **Validation Accuracy**: 85-95%

## 🐛 Troubleshooting Común

### Error: "ModuleNotFoundError: torch"

```bash
cd backend/ml-service
source venv/bin/activate
pip install torch torchvision
```

### Error: "No such file: X_data.npy"

```bash
# Ejecutar preparación de datos
python data_prep.py --dataset ../dataset_gestos --output .
```

### Error: "Webcam not found"

```bash
# Verificar cámaras disponibles
ls /dev/video*

# Si no hay cámaras, el sistema no puede capturar gestos
# Usar videos pregrabados o conectar cámara
```

### Bajo Validation Accuracy

- **Causa**: Dataset pequeño o desbalanceado
- **Solución**: Grabar más videos por gesto (mínimo 15, óptimo 20-25)

## 🎓 Mejores Prácticas

### Captura de Datos

✅ **DO:**
- Grabar en diferentes condiciones de iluminación
- Variar el fondo
- Usar diferentes velocidades
- Mantener mano centrada
- Mínimo 15 videos por gesto

❌ **DON'T:**
- Grabar todos los videos en mismo lugar
- Usar siempre misma velocidad
- Dejar mano fuera del encuadre
- Menos de 10 videos por gesto

### Entrenamiento

✅ **DO:**
- Empezar con 30 épocas
- Monitorear validation accuracy
- Guardar checkpoints
- Probar modelo antes de desplegar

❌ **DON'T:**
- Sobre-entrenar (overfitting)
- Ignorar validation loss
- Desplegar sin probar

## 🔗 Enlaces Útiles

- [Setup del ML Service](../../../setup/ML_SETUP.md)
- [API Documentation](../api/README.md)
- [Arquitectura del Sistema](../../architecture/system-overview.md)

---

**Última actualización**: Octubre 2025  
**Mantenido por**: Equipo Helen - 5ta Generación
