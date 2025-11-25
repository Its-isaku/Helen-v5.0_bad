# 🛠️ Development Environment Setup

Guía completa para configurar tu entorno de desarrollo para el proyecto Helen.

## 📋 Requisitos del Sistema

### Sistema Operativo
- **Linux**: Ubuntu 20.04+, Debian 11+, Fedora 36+
- **Windows**: Windows 10+ (64-bit)
- **macOS**: macOS 10.15+

### Hardware Mínimo
- **RAM**: 8GB (16GB recomendado)
- **Disco**: 10GB libres
- **CPU**: Procesador de 4 núcleos
- **GPU**: Opcional (NVIDIA CUDA para entrenamiento ML)

---

## 🔧 Instalación de Herramientas Base

### 1. Node.js y npm

**Linux (Ubuntu/Debian)**:
```bash
# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version  # debe mostrar v18.x.x
npm --version   # debe mostrar 9.x.x
```

**Windows**:
1. Descargar instalador desde [nodejs.org](https://nodejs.org/)
2. Ejecutar instalador y seguir wizard
3. Abrir PowerShell y verificar:
```powershell
node --version
npm --version
```

**macOS**:
```bash
# Usando Homebrew
brew install node@18

# Verificar instalación
node --version
npm --version
```

### 2. Python 3.10+

**Linux (Ubuntu/Debian)**:
```bash
# Instalar Python 3.10
sudo apt update
sudo apt install python3.10 python3.10-venv python3-pip

# Verificar instalación
python3 --version  # debe mostrar 3.10.x
pip3 --version
```

**Windows**:
1. Descargar instalador desde [python.org](https://www.python.org/downloads/)
2. **IMPORTANTE**: Marcar "Add Python to PATH"
3. Instalar y verificar en PowerShell:
```powershell
python --version
pip --version
```

**macOS**:
```bash
# Usando Homebrew
brew install python@3.10

# Verificar instalación
python3 --version
pip3 --version
```

### 3. Rust y Cargo

**Todas las plataformas**:
```bash
# Instalar Rust usando rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Seguir las instrucciones en pantalla
# Seleccionar instalación por defecto (opción 1)

# Recargar terminal o ejecutar:
source $HOME/.cargo/env  # Linux/macOS
# En Windows, reiniciar PowerShell

# Verificar instalación
rustc --version  # debe mostrar 1.70+
cargo --version
```

### 4. Git

**Linux (Ubuntu/Debian)**:
```bash
sudo apt install git
git --version
```

**Windows**:
1. Descargar desde [git-scm.com](https://git-scm.com/)
2. Instalar con configuración por defecto
3. Verificar en PowerShell:
```powershell
git --version
```

**macOS**:
```bash
brew install git
git --version
```

---

## 🎯 Dependencias Específicas

### Para Tauri (Linux)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# Fedora
sudo dnf install webkit2gtk4.0-devel \
    openssl-devel \
    curl \
    wget \
    file \
    libappindicator-gtk3-devel \
    librsvg2-devel

# Arch Linux
sudo pacman -S webkit2gtk \
    base-devel \
    curl \
    wget \
    file \
    openssl \
    appmenu-gtk-module \
    gtk3 \
    libappindicator-gtk3 \
    librsvg
```

### Para ML Service

```bash
# Instalar PyTorch (CPU o GPU según disponibilidad)

# CPU only
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# GPU (NVIDIA CUDA 11.8)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Verificar instalación
python -c "import torch; print(torch.__version__)"
```

---

## 📦 Instalación del Proyecto

### 1. Clonar Repositorio

```bash
git clone https://github.com/tu-usuario/helen-system.git
cd helen-system
```

### 2. Instalar Dependencias por Componente

#### Frontend (Tauri + React)
```bash
cd frontend
npm install
cd ..
```

#### Backend API
```bash
cd backend/api
python -m venv venv

# Activar entorno virtual
source venv/bin/activate  # Linux/macOS
# .\venv\Scripts\activate  # Windows PowerShell

pip install -r requirements.txt
cd ../..
```

#### ML Service
```bash
cd backend/ml-service
python -m venv venv

# Activar entorno virtual
source venv/bin/activate  # Linux/macOS
# .\venv\Scripts\activate  # Windows PowerShell

pip install -r requirements.txt
cd ../..
```

---

## 🔍 Verificación de Instalación

Ejecuta este script para verificar que todo está correctamente instalado:

```bash
#!/bin/bash
# verify_setup.sh

echo "🔍 Verificando instalación..."
echo ""

# Node.js
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo ""

# Python
echo "Python: $(python3 --version)"
echo "pip: $(pip3 --version)"
echo ""

# Rust
echo "Rust: $(rustc --version)"
echo "Cargo: $(cargo --version)"
echo ""

# Git
echo "Git: $(git --version)"
echo ""

echo "✅ Verificación completada"
```

**Windows (PowerShell)**:
```powershell
# verify_setup.ps1
Write-Host "🔍 Verificando instalación..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Node.js: $(node --version)"
Write-Host "npm: $(npm --version)"
Write-Host ""

Write-Host "Python: $(python --version)"
Write-Host "pip: $(pip --version)"
Write-Host ""

Write-Host "Rust: $(rustc --version)"
Write-Host "Cargo: $(cargo --version)"
Write-Host ""

Write-Host "Git: $(git --version)"
Write-Host ""

Write-Host "✅ Verificación completada" -ForegroundColor Green
```

---

## 🐛 Solución de Problemas Comunes

### Error: "command not found" después de instalar

**Solución**: Reinicia tu terminal o recarga el perfil:
```bash
# Linux/macOS
source ~/.bashrc  # o ~/.zshrc
```

### Error: Permisos en Linux

**Solución**: Agrega tu usuario al grupo docker y configura permisos:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Error: Puerto en uso

**Solución**: Mata el proceso usando el puerto:
```bash
# Linux/macOS
sudo lsof -i :8000
sudo kill -9 <PID>

# Windows PowerShell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Error: Python module not found

**Solución**: Verifica que el entorno virtual esté activado:
```bash
which python  # debe apuntar a tu venv
pip list      # debe mostrar tus dependencias instaladas
```

---

## 🌐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# .env
NODE_ENV=development
VITE_API_URL=http://localhost:8000
ML_MODEL_PATH=./backend/ml-service/trained_models
LOG_LEVEL=debug
```

---

## 📝 Próximos Pasos

Una vez completado este setup, continúa con:

1. **[Tauri Setup](./TAURI_SETUP.md)** - Configurar el frontend
2. **[React Setup](./REACT_SETUP.md)** - Configurar React y componentes
3. **[API Setup](./API_SETUP.md)** - Configurar el backend API
4. **[ML Setup](./ML_SETUP.md)** - Configurar el servicio de ML
5. **[Docker Setup](./DOCKER_SETUP.md)** - Configurar contenedores

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa la sección de troubleshooting
2. Consulta los logs de instalación
3. Busca en los issues del repositorio
4. Contacta al equipo de desarrollo

---

**Última actualización**: Octubre 2025  
**Mantenido por**: Equipo Helen - 5ta Generación
