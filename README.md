# Helen v5.0 - Asistente Inteligente con LSM

Sistema de asistente doméstico inteligente controlado por gestos en Lenguaje de Señas Mexicano (LSM), diseñado para hacer la tecnología smart home accesible a la comunidad sorda.

## Acerca del Proyecto

Helen utiliza reconocimiento de gestos en LSM para permitir que personas con discapacidad auditiva controlen dispositivos domésticos inteligentes. El proyecto aborda la exclusión digital que enfrentan aproximadamente 2.3 millones de mexicanos que no pueden usar asistentes de voz como Alexa o Google Home.

**Contexto Académico:**
- FCITEC - Universidad Autónoma de Baja California (UABC)

**Evolución del Proyecto:**

La 5ta generación de Helen implementó mejoras significativas sobre las versiones anteriores:
- Migración de ML tradicional a Red Neuronal LSTM con PyTorch
- Optimización para hardware embebido (Raspberry Pi 5 + NVIDIA Jetson)
- Procesamiento de video en tiempo real (antes solo imágenes estáticas)
- Reducción del 90% en consumo de recursos con arquitectura web

---

## Estructura del Repositorio

```
helen-v5/
├── Helen-Web/          # Versión Web App (optimizada para Raspberry Pi)
├── Helen-Electron/     # Versión Electron (aplicación de escritorio)
└── README.md          # Este archivo
```

---

## Dos Implementaciones Disponibles

La 5ta generación desarrolló **dos implementaciones completas** de Helen v5.0, cada una optimizada para diferentes casos de uso.

### Helen-Web

Aplicación web moderna que corre en navegador, diseñada específicamente para deployment en Raspberry Pi 5 como thin client.

**Características principales:**
- **Arquitectura de 3 capas:** React (frontend) + WebSocket Server + PyTorch LSTM (backend)
- **Deployment en la nube:** AWS EC2 con Nginx y Gunicorn
- **Performance optimizado:** 90%+ accuracy, latencia <50ms
- **Consumo eficiente:** ~80MB RAM en Raspberry Pi (90% menos que Electron)
- **Privacidad:** MediaPipe.js procesa video localmente, solo envía landmarks (126 números/frame)
- **Actualizaciones:** Automáticas con solo refrescar navegador

**Stack tecnológico:**
- Frontend: React 18, MediaPipe.js, Socket.IO Client
- Backend: Flask-SocketIO, PyTorch, Gunicorn
- Infrastructure: AWS EC2, Nginx, systemd
- Hardware: Raspberry Pi 5 en modo kiosk (Chromium fullscreen)

**[Ver documentación completa →](./Helen-Web/README.md)**

---

### Helen-Electron

Aplicación de escritorio standalone que integra frontend y backend en un único ejecutable multiplataforma.

**Características principales:**
- **Arquitectura integrada:** Electron + React + Flask API local embebido
- **Deployment:** Instaladores nativos para Windows/Linux/macOS
- **Performance:** 80-85% accuracy
- **Consumo:** ~400MB RAM
- **Comunicación:** IPC (Inter-Process Communication) entre renderer y main process
- **Persistencia:** electron-store para almacenamiento local de datos

**Stack tecnológico:**
- Framework: Electron 28
- Frontend: React 18, Vite
- Backend: Flask API local
- Build: electron-builder para crear instaladores

**Casos de uso:**
- Computadoras personales sin conexión constante a internet
- Demostraciones offline del proyecto
- Desarrollo y testing local

**[Ver documentación completa →](./Helen-Electron/README.md)**

---

## Comparación de Versiones

| Característica | Helen-Web | Helen-Electron |
|----------------|-----------|----------------|
| **Plataforma** | Navegador web | Aplicación de escritorio |
| **Instalación** | No requiere (solo URL) | Instalación local requerida |
| **Recursos (RAM)** | ~80MB | ~400MB |
| **Accuracy** | 90%+ | 80-85% |
| **Actualizaciones** | Automáticas (refresh) | Manual (reinstalar) |
| **Hardware objetivo** | Raspberry Pi 5 (kiosk) | Laptops/PCs |
| **Backend** | Remoto (AWS EC2) | Local (embebido) |
| **Conexión internet** | Requerida | Opcional |
| **Distribución** | URL única | Múltiples instaladores |
| **Privacidad video** | Local (MediaPipe.js) | Local (MediaPipe nativo) |

**Recomendación de uso:**
- **Helen-Web:** Producción con Raspberry Pi 5, fácil mantenimiento, actualizaciones frecuentes
- **Helen-Electron:** Demostraciones offline, uso personal en laptops, desarrollo local

---

## Gestos LSM Reconocidos

Helen v5.0 reconoce **10 gestos** en Lenguaje de Señas Mexicano, organizados en tres categorías funcionales:

**Navegación (5 gestos):**
- HOME - Pantalla principal
- ALARMA - Gestión de alarmas
- CLIMA - Información meteorológica
- DISPOSITIVOS - Control de dispositivos IoT
- CONFIGURACIÓN - Ajustes del sistema

**Modalidades (2 gestos):**
- WIFI - Gestión de red inalámbrica
- COLORES - Cambio de tema visual

**Acciones (3 gestos):**
- CÁMARA - Toggle de cámara (activar/desactivar)
- AGREGAR - Añadir nuevos elementos
- EDITAR - Modificar elementos existentes

**Dataset:**
- 400 videos por gesto (4,000 videos totales)
- Grabados en múltiples escenarios (universidad, CONALEP, espacios exteriores)
- Múltiples participantes para diversidad del modelo

---

## Arquitectura General (Helen-Web)

```
┌─────────────────────────────────────┐
│      Raspberry Pi 5 (Thin Client)   │
│   ┌─────────────────────────────┐   │
│   │  Chromium (Kiosk Mode)      │   │
│   │  ├─ React UI                │   │
│   │  └─ MediaPipe.js            │   │  ← Detección local de manos
│   │     (video no sale device)  │   │
│   └─────────────┬───────────────┘   │
└─────────────────┼───────────────────┘
                  │ WebSocket
                  │ (solo landmarks: 126 números)
                  ▼
┌─────────────────────────────────────┐
│        AWS EC2 Instance             │
│   ┌─────────────────────────────┐   │
│   │  Nginx (:3000)              │   │
│   │  Sirve React App estático   │   │
│   └─────────────────────────────┘   │
│   ┌─────────────────────────────┐   │
│   │  WebSocket Server (:5001)   │   │
│   │  ├─ Flask-SocketIO          │   │
│   │  ├─ LSTM Model (inference)  │   │  ← Reconocimiento de gestos
│   │  └─ 699,722 parámetros      │   │
│   └─────────────────────────────┘   │
│   ┌─────────────────────────────┐   │
│   │  Flask API (:5000)          │   │
│   │  ├─ Gestión de modelos      │   │
│   │  └─ Training endpoints      │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Flujo de procesamiento:**
1. Usuario realiza gesto LSM
2. MediaPipe.js detecta manos y extrae 21 landmarks por mano (42 total)
3. Calcula 126 features (x, y, z para cada landmark)
4. Envía landmarks via WebSocket al servidor
5. LSTM procesa secuencia de 40 frames
6. Predice gesto con confidence score
7. Servidor envía resultado al cliente
8. UI actualiza en tiempo real

---

## Quick Start

### Helen-Web

```bash
# Frontend (local development)
cd Helen-Web/frontend
npm install
npm run dev

# Backend (en EC2)
cd backend/websocket-server
pip install -r requirements.txt --break-system-packages
python server.py
```

**URLs de producción:**
- Web App: http://13.58.208.156:3000
- WebSocket: ws://13.58.208.156:5001
- Flask API: http://13.58.208.156:5000

### Helen-Electron

```bash
cd Helen-Electron/frontend
npm install
npm run dev
```

**Crear instaladores:**
```bash
npm run build:win      # Windows
npm run build:linux    # Linux (deb, AppImage)
npm run build:mac      # macOS
```

---

## Tecnologías Clave

**Machine Learning:**
- PyTorch 2.0+ con CUDA support
- Red LSTM bidireccional (699,722 parámetros)
- MediaPipe Hands para detección de landmarks

**Frontend:**
- React 18 con hooks
- Socket.IO Client para WebSocket
- React Router para navegación SPA

**Backend:**
- Flask-SocketIO para comunicación bidireccional
- Gunicorn como WSGI server
- Nginx como reverse proxy

**Infraestructura:**
- AWS EC2 para hosting
- systemd para gestión de servicios
- Raspberry Pi 5 (8GB RAM) como thin client

---

## Equipo de Desarrollo

** 5ta Generación:**
- Isai
- Gareth
- Jesús Eduardo
- Sofía

**Institución:** FCITEC - Universidad Autónoma de Baja California (UABC)
