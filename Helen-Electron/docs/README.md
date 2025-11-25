# 📚 Helen Documentation

Documentación completa del sistema Helen v5.0 - Sistema de Reconocimiento de Lenguaje de Señas.

## 🗂️ Estructura de la Documentación

```
docs/
├── README.md (este archivo)
├── frontend/          # Documentación del frontend
├── backend/           # Documentación del backend
└── architecture/      # Arquitectura del sistema
```

---

## 🎨 Frontend

Documentación del frontend construido con Tauri + React.

### 📂 [Frontend Documentation](./frontend/README.md)

#### React
- **[Frontend Guide](./frontend/react/FRONTEND_GUIDE.md)** - Guía completa de desarrollo
- **[Backend Integration](./frontend/react/BACKEND_INTEGRATION_GUIDE.md)** - Integración con API
- **[Performance Optimization](./frontend/react/PERFORMANCE_OPTIMIZATION.md)** - Optimizaciones

#### Tauri
- **[Software Architecture](./frontend/tauri/SOFTWARE_ARCHITECTURE.md)** - Arquitectura
- **[Build Targets](./frontend/tauri/TAURI_BUILD_TARGETS.md)** - Builds multiplataforma

---

## 🔧 Backend

Documentación del backend: API REST y ML Service.

### 📂 [Backend Documentation](./backend/README.md)

#### API REST
- **[API README](./backend/api/README.md)** - Información general
- **[Endpoints](./backend/api/endpoints.md)** - Documentación de endpoints
- **[Testing](./backend/api/testing.md)** - Guía de testing
- **[Deployment](./backend/api/deployment.md)** - Despliegue en producción

#### ML Service
- **[ML Service README](./backend/ml-service/README.md)** - Información general
- **[Data Preparation](./backend/ml-service/data-preparation.md)** - Preparación de datos
- **[Training](./backend/ml-service/training.md)** - Entrenamiento
- **[Model Architecture](./backend/ml-service/model-architecture.md)** - Arquitectura del modelo

#### AWS / Cloud
- **[AWS Deployment](./backend/aws/deployment.md)** - Despliegue en AWS EC2

---

## 🏗️ Architecture

Documentación de arquitectura del sistema.

### 📂 [Architecture Documentation](./architecture/)

- **[System Overview](./architecture/system-overview.md)** - Visión general del sistema
- **[Data Flow](./architecture/data-flow.md)** - Flujo de datos
- **[Tech Stack](./architecture/tech-stack.md)** - Stack tecnológico

---

## 🚀 Setup Guides

Guías de configuración paso a paso.

### 📂 [Setup Documentation](../setup/README.md)

- **[Development Environment](../setup/DEVELOPMENT_ENVIRONMENT.md)** - Setup inicial
- **[Tauri Setup](../setup/TAURI_SETUP.md)** - Configurar Tauri
- **[React Setup](../setup/REACT_SETUP.md)** - Configurar React
- **[API Setup](../setup/API_SETUP.md)** - Configurar API
- **[ML Setup](../setup/ML_SETUP.md)** - Configurar ML Service
- **[Docker Setup](../setup/DOCKER_SETUP.md)** - Configurar Docker

---

## 📖 Quick Links

### Para Desarrolladores

| Rol | Documentos Recomendados |
|-----|-------------------------|
| **Frontend Dev** | [Frontend Guide](./frontend/react/FRONTEND_GUIDE.md), [Tauri Setup](../setup/TAURI_SETUP.md) |
| **Backend Dev** | [API README](./backend/api/README.md), [API Setup](../setup/API_SETUP.md) |
| **ML Engineer** | [ML Service](./backend/ml-service/README.md), [Training Guide](./backend/ml-service/training.md) |
| **DevOps** | [Deployment](./backend/api/deployment.md), [Docker Setup](../setup/DOCKER_SETUP.md) |
| **Full Stack** | [System Overview](./architecture/system-overview.md), [Setup Guide](../setup/README.md) |

### Por Tarea

| Tarea | Documentos |
|-------|-----------|
| **Primer setup** | [Development Environment](../setup/DEVELOPMENT_ENVIRONMENT.md) |
| **Agregar gesto** | [Data Preparation](./backend/ml-service/data-preparation.md) |
| **Entrenar modelo** | [Training Guide](./backend/ml-service/training.md) |
| **Probar API** | [Testing](./backend/api/testing.md) |
| **Deploy a producción** | [Deployment](./backend/api/deployment.md) |
| **Optimizar performance** | [Performance Optimization](./frontend/react/PERFORMANCE_OPTIMIZATION.md) |

---

## 🎯 Getting Started

### Nuevo en el Proyecto

1. **Leer**: [System Overview](./architecture/system-overview.md)
2. **Setup**: [Development Environment](../setup/DEVELOPMENT_ENVIRONMENT.md)
3. **Elegir tu área**:
   - Frontend → [Frontend Guide](./frontend/react/FRONTEND_GUIDE.md)
   - Backend → [API README](./backend/api/README.md)
   - ML → [ML Service](./backend/ml-service/README.md)

### Quick Start por Componente

#### Frontend
```bash
cd frontend
npm install
npm run tauri dev
```
Ver: [Tauri Setup](../setup/TAURI_SETUP.md)

#### Backend API
```bash
cd backend/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python api_service.py
```
Ver: [API Setup](../setup/API_SETUP.md)

#### ML Service
```bash
cd backend/ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python train_solid.py
```
Ver: [ML Setup](../setup/ML_SETUP.md)

---

## 📚 Recursos Adicionales

### Documentos Externos al Repositorio
- [README Principal](../README.md) - README del proyecto
- [CHEATSHEET](../backend/CHEATSHEET.md) - Comandos rápidos

### Enlaces Útiles
- [PyTorch Documentation](https://pytorch.org/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Tauri Documentation](https://tauri.app/)
- [React Documentation](https://react.dev/)
- [MediaPipe Documentation](https://developers.google.com/mediapipe)

---

## 🤝 Contribuir

### Estructura de Documentación

Al agregar nueva documentación:
1. Ubicarla en la carpeta correcta (frontend/backend/architecture)
2. Actualizar el README correspondiente
3. Agregar enlaces cruzados
4. Seguir el formato Markdown establecido

### Convenciones

- **Títulos**: Usar emojis apropiados (🎨 Frontend, 🔧 Backend, etc.)
- **Code blocks**: Especificar el lenguaje
- **Enlaces**: Usar rutas relativas
- **Screenshots**: Guardar en carpeta `images/` (si es necesario)

---

## 📝 Notas de la 5ta Generación

Esta documentación fue reorganizada y actualizada por la 5ta Generación (Octubre 2025) durante la migración de ML tradicional a Redes Neuronales con PyTorch y de Electron a Tauri.

### Cambios Principales v5.0

- ✅ Migración a PyTorch
- ✅ Frontend con Tauri (reemplazo de Electron)
- ✅ Procesamiento en tiempo real
- ✅ Mejor organización de documentación
- ✅ Guías de setup mejoradas

---

**Última actualización**: Octubre 2025  
**Mantenido por**: Equipo Helen - 5ta Generación
