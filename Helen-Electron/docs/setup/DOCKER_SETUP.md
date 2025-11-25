# 🐳 Docker Setup Guide

Guía completa para configurar Docker y containerizar el proyecto Helen.

## 📋 Pre-requisitos

- ✅ [Development Environment Setup](./DEVELOPMENT_ENVIRONMENT.md)
- ✅ Docker instalado
- ✅ Docker Compose instalado (opcional)

---

## 🔧 Instalación de Docker

### Linux (Ubuntu/Debian)

```bash
# Actualizar repositorios
sudo apt update

# Instalar dependencias
sudo apt install apt-transport-https ca-certificates curl software-properties-common

# Agregar clave GPG oficial de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Agregar repositorio de Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalación
sudo docker --version
sudo docker compose version
```

### Windows

1. Descargar **Docker Desktop** desde [docker.com](https://www.docker.com/products/docker-desktop)
2. Ejecutar instalador
3. Reiniciar computadora
4. Verificar en PowerShell:

```powershell
docker --version
docker compose version
```

### macOS

```bash
# Usando Homebrew
brew install --cask docker

# O descargar Docker Desktop desde docker.com
```

### Configuración Post-Instalación (Linux)

```bash
# Agregar usuario al grupo docker (evitar sudo)
sudo usermod -aG docker $USER

# Aplicar cambios (logout/login o ejecutar)
newgrp docker

# Verificar que funciona sin sudo
docker run hello-world
```

---

## 🏗️ Estructura de Docker

```
helen-system/
├── docker-compose.yml          # Orquestación de servicios
├── Dockerfile.frontend        # Dockerfile para frontend (opcional)
├── backend/
│   ├── api/
│   │   └── Dockerfile        # Dockerfile para API
│   └── ml-service/
│       └── Dockerfile        # Dockerfile para ML Service
└── infrastructure/
    ├── nginx/
    │   ├── Dockerfile
    │   └── nginx.conf
    └── postgres/
        └── init.sql
```

---

## 🐋 Dockerfiles

### 1. Backend API Dockerfile

**Archivo**: `backend/api/Dockerfile`

```dockerfile
# Imagen base
FROM python:3.10-slim

# Metadata
LABEL maintainer="helen-team@example.com"
LABEL description="Helen API - Servicio de inferencia"

# Variables de entorno
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Crear usuario no-root
RUN useradd -m -u 1000 helen && chown -R helen:helen /app
USER helen

# Exponer puerto
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando de inicio
CMD ["uvicorn", "api_service:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. ML Service Dockerfile

**Archivo**: `backend/ml-service/Dockerfile`

```dockerfile
FROM python:3.10-slim

LABEL maintainer="helen-team@example.com"
LABEL description="Helen ML Service - Entrenamiento y gestión de modelos"

# Variables de entorno
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar PyTorch CPU (más ligero)
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Instalar otras dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Crear directorios necesarios
RUN mkdir -p data/processed trained_models logs

# Usuario no-root
RUN useradd -m -u 1000 helen && chown -R helen:helen /app
USER helen

# Comando por defecto
CMD ["python", "train_solid.py"]
```

### 3. Frontend Dockerfile (Opcional - para web)

**Archivo**: `frontend/Dockerfile`

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 🎼 Docker Compose

### docker-compose.yml (Completo)

```yaml
version: '3.8'

services:
  # API Backend
  api:
    build:
      context: ./backend/api
      dockerfile: Dockerfile
    container_name: helen-api
    ports:
      - "8000:8000"
    environment:
      - API_HOST=0.0.0.0
      - API_PORT=8000
      - MODEL_PATH=/models/best_model.pth
      - MODEL_DEVICE=cpu
      - LOG_LEVEL=INFO
    volumes:
      - ./backend/api:/app
      - ./backend/ml-service/trained_models:/models:ro
      - api-logs:/app/logs
    networks:
      - helen-network
    restart: unless-stopped
    depends_on:
      - ml-service
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ML Service
  ml-service:
    build:
      context: ./backend/ml-service
      dockerfile: Dockerfile
    container_name: helen-ml
    environment:
      - PYTHONUNBUFFERED=1
    volumes:
      - ./backend/ml-service:/app
      - ml-data:/app/data
      - ml-models:/app/trained_models
      - ml-logs:/app/logs
    networks:
      - helen-network
    restart: unless-stopped

  # Nginx (opcional - para frontend web)
  nginx:
    image: nginx:alpine
    container_name: helen-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - helen-network
    restart: unless-stopped
    depends_on:
      - api

  # PostgreSQL (opcional - para persistencia)
  postgres:
    image: postgres:15-alpine
    container_name: helen-postgres
    environment:
      - POSTGRES_DB=helen_db
      - POSTGRES_USER=helen_user
      - POSTGRES_PASSWORD=helen_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./infrastructure/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - helen-network
    restart: unless-stopped

  # Redis (opcional - para caché)
  redis:
    image: redis:7-alpine
    container_name: helen-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - helen-network
    restart: unless-stopped
    command: redis-server --appendonly yes

networks:
  helen-network:
    driver: bridge
    name: helen-network

volumes:
  api-logs:
    name: helen-api-logs
  ml-data:
    name: helen-ml-data
  ml-models:
    name: helen-ml-models
  ml-logs:
    name: helen-ml-logs
  postgres-data:
    name: helen-postgres-data
  redis-data:
    name: helen-redis-data
```

---

## 🚀 Comandos de Docker

### Comandos Básicos

```bash
# Construir imágenes
docker compose build

# Construir sin caché
docker compose build --no-cache

# Iniciar servicios
docker compose up

# Iniciar en background
docker compose up -d

# Ver logs
docker compose logs

# Logs en tiempo real
docker compose logs -f

# Logs de un servicio específico
docker compose logs -f api

# Detener servicios
docker compose down

# Detener y eliminar volúmenes
docker compose down -v

# Reiniciar un servicio
docker compose restart api
```

### Comandos Avanzados

```bash
# Ejecutar comando en contenedor
docker compose exec api bash

# Ver estado de servicios
docker compose ps

# Ver recursos usados
docker stats

# Limpiar sistema
docker system prune -a

# Ver imágenes
docker images

# Eliminar imagen
docker rmi helen-api:latest

# Ver volúmenes
docker volume ls

# Inspeccionar volumen
docker volume inspect helen-ml-models
```

---

## 📦 Scripts de Automatización

### build.sh

```bash
#!/bin/bash
# Script para construir todos los contenedores

echo "🏗️  Construyendo contenedores..."

# API
echo "Building API..."
docker build -t helen-api:latest ./backend/api

# ML Service
echo "Building ML Service..."
docker build -t helen-ml:latest ./backend/ml-service

# Frontend (opcional)
# echo "Building Frontend..."
# docker build -t helen-frontend:latest ./frontend

echo "✅ Build completado!"
```

### start.sh

```bash
#!/bin/bash
# Script para iniciar todos los servicios

echo "🚀 Iniciando servicios Helen..."

# Verificar que Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo"
    exit 1
fi

# Iniciar con docker compose
docker compose up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios inicien..."
sleep 10

# Verificar health checks
docker compose ps

echo "✅ Servicios iniciados!"
echo "📊 API disponible en: http://localhost:8000"
echo "📚 Docs disponibles en: http://localhost:8000/docs"
```

### stop.sh

```bash
#!/bin/bash
# Script para detener todos los servicios

echo "🛑 Deteniendo servicios Helen..."

docker compose down

echo "✅ Servicios detenidos"
```

---

## 🔒 Seguridad

### Archivo .dockerignore

```
# Git
.git
.gitignore

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
*.egg-info/

# Logs
*.log
logs/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Datos sensibles
.env
*.pem
*.key

# Archivos grandes
*.weights
*.h5
dataset/
```

### Variables de Entorno Seguras

**Archivo**: `.env.example`

```bash
# Copiar este archivo a .env y actualizar valores

# API
API_SECRET_KEY=your-secret-key-here
API_DEBUG=false

# Database
POSTGRES_PASSWORD=change-this-password
POSTGRES_DB=helen_db

# ML
MODEL_DEVICE=cpu

# Redis
REDIS_PASSWORD=change-this-too
```

---

## 📊 Monitoreo

### Ver Logs en Tiempo Real

```bash
# Todos los servicios
docker compose logs -f

# Solo API
docker compose logs -f api

# Solo ML Service
docker compose logs -f ml-service

# Últimas 100 líneas
docker compose logs --tail=100 api
```

### Métricas de Recursos

```bash
# Ver uso de recursos
docker stats

# Formato personalizado
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

---

## 🐛 Troubleshooting

### Puerto ya en uso

```bash
# Ver qué usa el puerto 8000
lsof -i :8000

# Matar proceso
kill -9 <PID>

# O cambiar puerto en docker-compose.yml
ports:
  - "8001:8000"  # host:container
```

### Contenedor no inicia

```bash
# Ver logs detallados
docker compose logs api

# Ver últimos eventos
docker compose events

# Inspeccionar contenedor
docker inspect helen-api
```

### Error de permisos

```bash
# Dar permisos a volúmenes
sudo chown -R $USER:$USER ./backend/ml-service/trained_models

# O ejecutar como root (no recomendado)
docker compose exec --user root api bash
```

### Limpiar todo y empezar de nuevo

```bash
# Detener todo
docker compose down -v

# Limpiar imágenes
docker rmi $(docker images -q helen-*)

# Limpiar volúmenes
docker volume prune -f

# Rebuild
docker compose up --build
```

---

## 🚀 Producción

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  api:
    image: helen-api:${VERSION:-latest}
    environment:
      - API_DEBUG=false
      - LOG_LEVEL=WARNING
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        max_attempts: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Usar en producción

```bash
# Build para producción
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## ✅ Checklist de Setup Docker

- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Dockerfiles creados
- [ ] docker-compose.yml configurado
- [ ] Variables de entorno configuradas
- [ ] Contenedores construyen sin errores
- [ ] Servicios inician correctamente
- [ ] Health checks pasan
- [ ] API responde en http://localhost:8000
- [ ] Logs accesibles

---

## 📚 Recursos Adicionales

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Best Practices for Dockerfiles](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Security](https://docs.docker.com/engine/security/)

---

**¡Setup de Docker completado!** 🎉

---

**Última actualización**: Octubre 2025  
**Mantenido por**: Equipo Helen - 5ta Generación
