# 🔌 Helen API - REST Service

API REST construida con FastAPI para inferencia de gestos en tiempo real.

## 📋 Descripción

El servicio API de Helen es el puente entre el frontend y el modelo de Machine Learning. Recibe secuencias de landmarks de MediaPipe y devuelve predicciones de gestos en tiempo real.

## 🏗️ Arquitectura

```
backend/api/
├── api_service.py          # Servidor FastAPI principal
├── requirements.txt        # Dependencias Python
├── example_client.py       # Cliente de ejemplo para testing
├── test_system.py          # Tests del sistema
├── model_final.pth         # Modelo PyTorch entrenado
├── gestures_map.json       # Mapeo gesto ↔ ID
└── normalization_stats.pth # Estadísticas de normalización
```

## 🚀 Quick Start

### Instalación

```bash
cd backend/api
python3.12 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Iniciar API

```bash
# Desarrollo
python api_service.py

# API corriendo en: http://localhost:5000
```

### Probar API

```bash
# Health check
curl http://localhost:5000/health

# Listar gestos disponibles
curl http://localhost:5000/gestures
```

## 📚 Documentación Adicional

- **[Endpoints y Uso](./endpoints.md)** - Documentación completa de endpoints
- **[Testing](./testing.md)** - Cómo probar la API con example_client.py
- **[Deployment](./deployment.md)** - Deploy en producción y AWS EC2

## 🔧 Dependencias Principales

```txt
flask==3.0.0
torch==2.1.0
numpy==1.24.3
```

## 📊 Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Info del servicio |
| GET | `/gestures` | Lista de gestos disponibles |
| GET | `/health` | Health check |
| POST | `/predict` | Predicción de gesto |

Ver [endpoints.md](./endpoints.md) para detalles completos.

## 🐛 Troubleshooting

### Error: "Modelo no cargado"

```bash
# Verificar archivos necesarios
ls model_final.pth gestures_map.json normalization_stats.pth

# Si faltan, copiarlos desde ml-service:
cp ../ml-service/model_final.pth .
cp ../ml-service/gestures_map.json .
cp ../ml-service/normalization_stats.pth .
```

### Puerto 5000 en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :5000

# Matar proceso
sudo kill -9 <PID>

# O cambiar puerto en api_service.py
```

Ver más en [troubleshooting completo](./deployment.md#troubleshooting).

## 🔗 Enlaces Útiles

- [Documentación de ML Service](../ml-service/README.md)
- [Setup del API](../../../setup/API_SETUP.md)
- [Arquitectura del Sistema](../../architecture/system-overview.md)

---

**Última actualización**: Octubre 2025  
**Mantenido por**: Equipo Helen - 5ta Generación
