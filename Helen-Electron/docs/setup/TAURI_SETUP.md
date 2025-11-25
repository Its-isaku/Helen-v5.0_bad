# 🪟 Tauri Setup Guide

Guía completa para configurar y trabajar con Tauri en el proyecto Helen.

## 📋 Pre-requisitos

Antes de continuar, asegúrate de haber completado:
- ✅ [Development Environment Setup](./DEVELOPMENT_ENVIRONMENT.md)
- ✅ Node.js 18+ instalado
- ✅ Rust y Cargo instalados
- ✅ Dependencias del sistema para Tauri

---

## 🔧 Verificación de Dependencias

### Linux

```bash
# Verificar que WebKit2GTK esté instalado
pkg-config --modversion webkit2gtk-4.0

# Debería mostrar versión 2.40+ o similar
```

Si no está instalado:
```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.0-dev

# Fedora
sudo dnf install webkit2gtk4.0-devel

# Arch
sudo pacman -S webkit2gtk
```

### Windows

Tauri en Windows requiere:
- Microsoft Visual C++ Redistributable
- WebView2 (incluido en Windows 11, instalable en Windows 10)

```powershell
# Verificar si WebView2 está instalado
Get-AppxPackage -Name "Microsoft.WebView2"
```

Si no está instalado, descarga desde: https://developer.microsoft.com/microsoft-edge/webview2/

### macOS

```bash
# Verificar Xcode Command Line Tools
xcode-select -p

# Si no está instalado:
xcode-select --install
```

---

## 📦 Instalación del Frontend

### 1. Navegar al directorio del frontend

```bash
cd frontend
```

### 2. Instalar dependencias de Node

```bash
npm install
```

Esto instalará:
- React y React DOM
- Vite (build tool)
- Tauri CLI
- Dependencias de UI (Tailwind, etc.)

### 3. Instalar dependencias de Rust

```bash
# Tauri CLI se instalará automáticamente con npm
# Pero puedes verificar:
npx tauri --version
```

---

## 🏗️ Estructura del Proyecto Tauri

```
frontend/
├── src/                    # Código React
│   ├── App.jsx            # Componente principal
│   ├── main.jsx           # Entry point React
│   └── components/        # Componentes React
├── src-tauri/             # Backend Rust de Tauri
│   ├── src/
│   │   └── main.rs        # Entry point Rust
│   ├── Cargo.toml         # Dependencias Rust
│   ├── tauri.conf.json    # Configuración Tauri
│   └── icons/             # Iconos de la app
├── index.html             # Template HTML
├── vite.config.js         # Configuración Vite
└── package.json           # Dependencias Node
```

---

## ⚙️ Configuración de Tauri

### Archivo: `src-tauri/tauri.conf.json`

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:1420",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Helen",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "http": {
        "all": true,
        "request": true,
        "scope": ["http://localhost:8000/*"]
      }
    },
    "bundle": {
      "active": true,
      "targets": ["deb", "rpm"],
      "identifier": "com.helen.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "Helen - Reconocimiento de Señas",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  }
}
```

### Configuraciones Importantes

#### 1. Permisos (Allowlist)

```json
"allowlist": {
  "http": {
    "all": true,
    "scope": ["http://localhost:8000/*"]  // Solo permite API local
  }
}
```

#### 2. Build Targets

Ver documento completo: [TAURI_BUILD_TARGETS.md](../TAURI_BUILD_TARGETS.md)

**Linux**:
```json
"targets": ["deb", "rpm"]  // Ubuntu + Fedora
"targets": ["appimage"]     // Universal
```

**Windows**:
```json
"targets": ["msi", "nsis"]
```

**macOS**:
```json
"targets": ["dmg", "app"]
```

---

## 🚀 Comandos de Desarrollo

### Modo Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run tauri dev
```

Esto:
1. Inicia Vite dev server (React) en puerto 1420
2. Compila el backend Rust
3. Abre ventana de la aplicación con hot-reload

### Build de Producción

```bash
# Compilar aplicación para distribución
npm run tauri build
```

Los binarios estarán en:
```
src-tauri/target/release/bundle/
├── deb/           # Instaladores .deb
├── rpm/           # Instaladores .rpm
└── appimage/      # Archivos .AppImage
```

### Limpiar Build Cache

```bash
# Limpiar cache de Rust
cd src-tauri
cargo clean
cd ..

# Limpiar cache de Node
rm -rf node_modules dist
npm install
```

---

## 🔌 Integración con API Backend

### 1. Configurar URL de API

**Archivo**: `src/config.js`
```javascript
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  endpoints: {
    predict: '/predict',
    health: '/health'
  }
};
```

### 2. Archivo `.env` en frontend

```bash
# frontend/.env
VITE_API_URL=http://localhost:8000
```

### 3. Hacer Requests HTTP desde Tauri

```javascript
// src/services/api.js
import { fetch } from '@tauri-apps/api/http';
import { API_CONFIG } from '../config';

export async function predictGesture(landmarks) {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ landmarks })
    });
    
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

---

## 🎨 Personalización de Iconos

### Generar iconos para todas las plataformas

1. **Preparar imagen base**: PNG de 1024x1024px

2. **Usar herramienta de generación**:
```bash
cd src-tauri
npm install @tauri-apps/cli
npx tauri icon /path/to/your/icon.png
```

Esto generará:
```
icons/
├── 32x32.png
├── 128x128.png
├── 128x128@2x.png
├── icon.icns      # macOS
└── icon.ico       # Windows
```

---

## 🔒 Seguridad

### Content Security Policy (CSP)

```json
"security": {
  "csp": "default-src 'self'; connect-src 'self' http://localhost:8000"
}
```

### Scope de HTTP Requests

Solo permite requests a tu API:
```json
"http": {
  "scope": [
    "http://localhost:8000/*",
    "https://tu-api-produccion.com/*"
  ]
}
```

---

## 🐛 Troubleshooting

### Error: "webkit2gtk not found"

**Linux**:
```bash
sudo apt install libwebkit2gtk-4.0-dev
```

### Error: "cargo command not found"

```bash
# Recargar path
source $HOME/.cargo/env

# O reiniciar terminal
```

### Error: "Port 1420 already in use"

```bash
# Matar proceso en el puerto
lsof -ti:1420 | xargs kill -9

# O cambiar puerto en vite.config.js:
export default {
  server: {
    port: 1421  // Nuevo puerto
  }
}
```

### Error al compilar: "linker error"

**Linux**: Instalar build tools
```bash
sudo apt install build-essential
```

**Windows**: Instalar Visual Studio Build Tools

### Aplicación se cierra inmediatamente

Revisa logs:
```bash
# Ver logs de Tauri
RUST_LOG=debug npm run tauri dev
```

---

## 📊 Optimización de Build

### Reducir tamaño del binario

**Archivo**: `src-tauri/Cargo.toml`
```toml
[profile.release]
opt-level = "z"     # Optimización de tamaño
lto = true          # Link Time Optimization
codegen-units = 1   # Mejor optimización
strip = true        # Remover símbolos de debug
```

### Build incremental más rápido

```toml
[profile.dev]
incremental = true
```

---

## 🧪 Testing

### Test del frontend React

```bash
npm run test
```

### Test del backend Rust

```bash
cd src-tauri
cargo test
```

---

## 📈 Performance

### Habilitar release optimizations

```bash
npm run tauri build -- --release
```

### Monitorear performance

```javascript
// En tu código React
import { invoke } from '@tauri-apps/api/tauri';

async function measurePerformance() {
  const start = performance.now();
  await invoke('tu_comando_rust');
  const end = performance.now();
  console.log(`Tiempo: ${end - start}ms`);
}
```

---

## 📚 Recursos Adicionales

- [Documentación oficial de Tauri](https://tauri.app/)
- [Tauri API Reference](https://tauri.app/v1/api/js/)
- [Rust Tauri Plugins](https://github.com/tauri-apps/plugins-workspace)
- [Ejemplos de Tauri](https://github.com/tauri-apps/tauri/tree/dev/examples)

---

## ✅ Checklist de Setup Completado

- [ ] Dependencias del sistema instaladas
- [ ] Node.js y npm funcionando
- [ ] Rust y Cargo funcionando
- [ ] `npm install` ejecutado sin errores
- [ ] `npm run tauri dev` funciona correctamente
- [ ] Se puede compilar con `npm run tauri build`
- [ ] La app se comunica con la API backend
- [ ] Los iconos están configurados

---

**Siguiente paso**: [React Setup](./REACT_SETUP.md) para configurar los componentes de React.

---

**Última actualización**: Octubre 2025  
**Mantenido por**: Equipo Helen - 5ta Generación
