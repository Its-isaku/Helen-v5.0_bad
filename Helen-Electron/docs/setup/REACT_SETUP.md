# ⚛️ React Setup Guide

Guía completa para configurar y trabajar con React en el proyecto Helen.

## 📋 Pre-requisitos

- ✅ [Development Environment Setup](./DEVELOPMENT_ENVIRONMENT.md)
- ✅ [Tauri Setup](./TAURI_SETUP.md)
- ✅ Node.js 18+ instalado

---

## 🏗️ Estructura del Proyecto React

```
frontend/src/
├── App.jsx                 # Componente principal
├── main.jsx               # Entry point
├── index.css              # Estilos globales
├── components/            # Componentes reutilizables
│   ├── Camera/
│   │   ├── CameraView.jsx
│   │   └── CameraControls.jsx
│   ├── Prediction/
│   │   ├── PredictionDisplay.jsx
│   │   └── GestureHistory.jsx
│   └── UI/
│       ├── Button.jsx
│       └── Card.jsx
├── services/              # Servicios y API calls
│   ├── api.js
│   ├── camera.js
│   └── mediapipe.js
├── hooks/                 # Custom React hooks
│   ├── useCamera.js
│   ├── usePrediction.js
│   └── useMediaPipe.js
├── utils/                 # Utilidades
│   ├── constants.js
│   └── helpers.js
└── styles/               # Estilos modulares
    ├── camera.css
    └── prediction.css
```

---

## 📦 Dependencias del Proyecto

### package.json

```json
{
  "name": "helen-frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tauri-apps/api": "^1.5.0",
    "@mediapipe/hands": "^0.4.1646424915",
    "@mediapipe/camera_utils": "^0.3.1620248357",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^1.5.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

### Instalación

```bash
cd frontend
npm install
```

---

## ⚙️ Configuración de Vite

### vite.config.js

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(async () => ({
  plugins: [react()],

  // Configuración del servidor de desarrollo
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  // Variables de entorno
  envPrefix: ["VITE_"],

  // Build optimizations
  build: {
    target: "esnext",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mediapipe': ['@mediapipe/hands', '@mediapipe/camera_utils']
        }
      }
    }
  },

  // Resolve aliases
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@services': '/src/services',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
    }
  }
}));
```

---

## 🎨 Configuración de Tailwind CSS

### 1. Instalar Tailwind

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        secondary: {
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
```

### 3. src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-slate-50 text-slate-900;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors;
  }
  
  .btn-secondary {
    @apply bg-secondary-600 hover:bg-secondary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6 border border-slate-200;
  }
}
```

---

## 🎥 Integración con MediaPipe

### Instalación de MediaPipe

```bash
npm install @mediapipe/hands @mediapipe/camera_utils @mediapipe/drawing_utils
```

### Custom Hook: useMediaPipe

**Archivo**: `src/hooks/useMediaPipe.js`

```javascript
import { useRef, useEffect, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export function useMediaPipe(onResults) {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Inicializar MediaPipe Hands
    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    // Inicializar cámara
    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
      width: 1280,
      height: 720
    });

    camera.start()
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });

    cameraRef.current = camera;

    // Cleanup
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [onResults]);

  return { videoRef, isLoading, error };
}
```

---

## 🔌 Integración con API

### Service: API Client

**Archivo**: `src/services/api.js`

```javascript
import { fetch } from '@tauri-apps/api/http';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class ApiService {
  static async predict(landmarks) {
    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ landmarks }),
        timeout: 5000,
      });

      if (response.ok) {
        return response.data;
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }

  static async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        timeout: 3000,
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
```

### Custom Hook: usePrediction

**Archivo**: `src/hooks/usePrediction.js`

```javascript
import { useState, useCallback } from 'react';
import { ApiService } from '@services/api';

export function usePrediction() {
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const predict = useCallback(async (landmarks) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ApiService.predict(landmarks);
      setPrediction(result);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPrediction(null);
    setError(null);
  }, []);

  return { prediction, isLoading, error, predict, reset };
}
```

---

## 🧩 Componentes Principales

### CameraView Component

**Archivo**: `src/components/Camera/CameraView.jsx`

```jsx
import React, { useRef, useEffect } from 'react';
import { useMediaPipe } from '@hooks/useMediaPipe';

export function CameraView({ onHandsDetected }) {
  const canvasRef = useRef(null);
  
  const { videoRef, isLoading, error } = useMediaPipe((results) => {
    // Dibujar en canvas
    if (canvasRef.current && results.multiHandLandmarks) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Dibujar landmarks
      results.multiHandLandmarks.forEach(landmarks => {
        drawLandmarks(ctx, landmarks);
      });
      
      // Callback con landmarks detectados
      onHandsDetected?.(results.multiHandLandmarks);
    }
  });

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (isLoading) {
    return <div className="loading">Cargando cámara...</div>;
  }

  return (
    <div className="camera-container relative">
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover"
        style={{ display: 'none' }}
      />
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="w-full h-full"
      />
    </div>
  );
}

function drawLandmarks(ctx, landmarks) {
  // Implementación de dibujo de landmarks
  ctx.fillStyle = '#00FF00';
  landmarks.forEach(({ x, y }) => {
    ctx.beginPath();
    ctx.arc(x * 1280, y * 720, 5, 0, 2 * Math.PI);
    ctx.fill();
  });
}
```

### PredictionDisplay Component

**Archivo**: `src/components/Prediction/PredictionDisplay.jsx`

```jsx
import React from 'react';

export function PredictionDisplay({ prediction, confidence }) {
  if (!prediction) {
    return (
      <div className="card text-center text-slate-500">
        <p>Esperando detección...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-2xl font-bold mb-4">Predicción</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Gesto:</span>
          <span className="text-3xl font-bold text-primary-600">
            {prediction}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Confianza:</span>
          <span className="font-semibold text-slate-900">
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 📱 App Component Principal

**Archivo**: `src/App.jsx`

```jsx
import React, { useState } from 'react';
import { CameraView } from '@components/Camera/CameraView';
import { PredictionDisplay } from '@components/Prediction/PredictionDisplay';
import { usePrediction } from '@hooks/usePrediction';

function App() {
  const [landmarks, setLandmarks] = useState(null);
  const { prediction, predict } = usePrediction();

  const handleHandsDetected = async (detectedLandmarks) => {
    if (detectedLandmarks && detectedLandmarks.length > 0) {
      setLandmarks(detectedLandmarks[0]);
      await predict(detectedLandmarks[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">
            Helen - Reconocimiento de Señas
          </h1>
          <p className="text-slate-600 mt-2">
            Sistema de reconocimiento en tiempo real
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CameraView onHandsDetected={handleHandsDetected} />
          </div>
          
          <div className="space-y-6">
            <PredictionDisplay
              prediction={prediction?.gesture}
              confidence={prediction?.confidence}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
```

---

## 🧪 Testing

### Instalar dependencias de testing

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Configurar Vitest

**Archivo**: `vite.config.js` (agregar)

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
  },
});
```

### Ejemplo de test

**Archivo**: `src/components/__tests__/PredictionDisplay.test.jsx`

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PredictionDisplay } from '../Prediction/PredictionDisplay';

describe('PredictionDisplay', () => {
  it('muestra mensaje cuando no hay predicción', () => {
    render(<PredictionDisplay prediction={null} />);
    expect(screen.getByText(/Esperando detección/i)).toBeInTheDocument();
  });

  it('muestra la predicción correctamente', () => {
    render(<PredictionDisplay prediction="A" confidence={0.95} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('95.0%')).toBeInTheDocument();
  });
});
```

---

## 🚀 Scripts de Desarrollo

### package.json (scripts)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext js,jsx",
    "lint:fix": "eslint . --ext js,jsx --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,css}\"",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

---

## ✅ Checklist de Setup React

- [ ] npm install completado
- [ ] Vite configurado correctamente
- [ ] Tailwind CSS funcionando
- [ ] MediaPipe inicializa correctamente
- [ ] Cámara se activa sin errores
- [ ] Componentes se renderizan correctamente
- [ ] API calls funcionan
- [ ] Tests pasan exitosamente

---

**Siguiente paso**: [API Setup](./API_SETUP.md) para configurar el backend.

---

**Última actualización**: Octubre 2025  
**Mantenido por**: Equipo Helen - 5ta Generación
