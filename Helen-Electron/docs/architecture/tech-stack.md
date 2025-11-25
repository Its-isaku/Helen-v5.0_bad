# 🛠️ Tech Stack - Stack Tecnológico

Stack tecnológico completo del sistema Helen v5.0.

## Frontend

### Framework Principal
- **Tauri 1.5** - Framework para aplicaciones desktop (Rust + WebView)
- **React 18** - Biblioteca UI
- **JavaScript 5** - js normalito

### Build & Dev Tools
- **Vite 5** - Build tool y dev server
- **npm** - Package manager

### UI & Styling
- **CSS 3** - CSS 
- **PostCSS** - CSS processor

### Computer Vision
- **MediaPipe Hands 0.10** - Detección de landmarks de manos
- **MediaPipe Camera Utils** - Utilidades de cámara

### HTTP Client
- **@tauri-apps/api** - Cliente HTTP integrado con Tauri

## Backend API

### Framework
- **FastAPI 0.104** - Framework web moderno y rápido
- **Python 3.12** - Lenguaje de programación

### Server
- **Uvicorn** - ASGI server (desarrollo)
- **Gunicorn** - WSGI server (producción)

### Machine Learning
- **PyTorch 2.1** - Framework de deep learning
- **NumPy 1.24** - Procesamiento numérico

### Validación
- **Pydantic 2** - Validación de datos

## ML Service

### Deep Learning
- **PyTorch 2.1** - Entrenamiento y inferencia
- **TorchVision** - Utilidades de visión

### Computer Vision
- **OpenCV 4.8** - Procesamiento de imágenes
- **MediaPipe 0.10** - Detección de landmarks

### Data Science
- **NumPy 1.24** - Arrays y operaciones numéricas
- **Pandas** - Manipulación de datos (opcional)

## DevOps & Deployment

### Containerization
- **Docker** - Containerización
- **Docker Compose** - Orquestación multi-container

### CI/CD
- **GitHub Actions** - Integración continua

### Cloud
- **AWS EC2** - Hosting del API
- **Ubuntu 24.04 LTS** - Sistema operativo

### Process Management
- **systemd** - Gestión de servicios en Linux

## Development Tools

### Version Control
- **Git** - Control de versiones
- **GitHub** - Hosting de repositorio

### IDE/Editors
- VS Code
- PyCharm
- Rust Analyzer

### Testing
- **pytest** - Testing Python
- **Vitest** - Testing JavaScript/TypeScript

## Versiones Específicas

```txt
# Frontend
@tauri-apps/api: ^1.5.0
react: ^18.2.0
vite: ^5.0.0
tailwindcss: ^3.4.0
@mediapipe/hands: ^0.4.1646424915

# Backend API
fastapi==0.104.1
uvicorn[standard]==0.24.0
torch==2.1.0
numpy==1.24.3

# ML Service
torch==2.1.0
opencv-python==4.8.1.78
mediapipe==0.10.8
```

Ver [System Overview](./system-overview.md) para arquitectura completa.
