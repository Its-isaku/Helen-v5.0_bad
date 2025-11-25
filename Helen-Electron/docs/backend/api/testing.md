# 🧪 Testing del API - Guía Completa

Guía para probar y validar el funcionamiento del API de Helen.

## 📋 Herramientas de Testing

### 1. example_client.py

Cliente Python completo para testing del API con múltiples demos.

**Ubicación**: `backend/api/example_client.py`

### 2. test_system.py

Suite de tests automatizados para validación del sistema.

**Ubicación**: `backend/ml-service/test_system.py`

---

## 🚀 Usando example_client.py

### Instalación

```bash
cd backend/api
source venv/bin/activate
# Las dependencias ya están en requirements.txt
```

### Uso Básico

```bash
# Test básico de conexión
python example_client.py --demo basic

# Test de latencia (10 predicciones)
python example_client.py --demo latency

# Test de manejo de errores
python example_client.py --demo errors

# Ejecutar todos los demos
python example_client.py --demo all
```

### Opciones de Línea de Comandos

```bash
python example_client.py [OPTIONS]

Opciones:
  --url URL         URL del API (default: http://localhost:5000)
  --demo TYPE       Tipo de demo: basic, latency, errors, all
  --help            Mostrar ayuda
```

---

## 📊 Demos Disponibles

### Demo 1: Basic - Test de Conexión

Verifica conectividad y funcionalidad básica.

```bash
python example_client.py --demo basic
```

**Salida esperada:**
```
================================================================================
🚀 DEMO: Verificación Básica del API
================================================================================

✅ Conexión al API exitosa
✅ Modelo cargado correctamente

📋 Gestos disponibles:
  1. inicio
  2. clima
  3. noticias
  4. alarma
  5. dispositivos

🎯 Realizando predicción de prueba...
✅ Predicción exitosa!
  Gesto predicho: clima
  Confianza: 95.32%
  Tiempo: 45.23 ms

✅ Todos los tests básicos pasaron correctamente
================================================================================
```

---

### Demo 2: Latency - Test de Performance

Mide la latencia y throughput del API.

```bash
python example_client.py --demo latency
```

**Salida esperada:**
```
================================================================================
🚀 DEMO: Test de Latencia
================================================================================

Realizando 10 predicciones...
  [1/10] clima        (95.32%) - 45.23 ms
  [2/10] inicio       (92.10%) - 42.15 ms
  [3/10] noticias     (88.45%) - 48.67 ms
  [4/10] clima        (94.23%) - 43.89 ms
  [5/10] inicio       (91.34%) - 44.12 ms
  [6/10] noticias     (89.67%) - 47.23 ms
  [7/10] clima        (96.12%) - 41.98 ms
  [8/10] inicio       (93.45%) - 43.76 ms
  [9/10] noticias     (87.89%) - 49.01 ms
  [10/10] clima       (95.67%) - 42.34 ms

📊 Estadísticas de latencia:
  Promedio: 44.84 ms
  Mínimo:   41.98 ms
  Máximo:   49.01 ms

💡 El API puede procesar ~22 predicciones por segundo
================================================================================
```

**Análisis de resultados:**
- **< 50ms**: Excelente performance ✅
- **50-70ms**: Buena performance ⚠️
- **> 70ms**: Performance degradada, investigar ❌

---

### Demo 3: Errors - Test de Manejo de Errores

Verifica que el API maneja errores correctamente.

```bash
python example_client.py --demo errors
```

**Salida esperada:**
```
================================================================================
🚀 DEMO: Manejo de Errores
================================================================================

[Test 1] Secuencia vacía:
❌ Error capturado correctamente
  Mensaje: 'sequence' field is required

[Test 2] Features incorrectos (10 en vez de 63):
❌ Error capturado correctamente
  Mensaje: Expected 63 features per frame, got 10

[Test 3] Longitud incorrecta (10 frames en vez de 40):
❌ Error capturado correctamente
  Mensaje: Expected sequence of 40 frames, got 10

✅ El API maneja errores correctamente
================================================================================
```

---

### Demo All - Todos los Tests

Ejecuta todos los demos en secuencia.

```bash
python example_client.py --demo all
```

Ejecuta:
1. ✅ Basic - Verificación de conexión
2. ✅ Latency - Test de performance
3. ✅ Errors - Manejo de errores

---

## 🌐 Testing API en Producción/EC2

### Probar API Desplegada

```bash
# Cambiar URL al API en EC2
python example_client.py --url http://<IP-PUBLICA-EC2>:5000 --demo all

# Solo verificar conexión
python example_client.py --url http://<IP-PUBLICA-EC2>:5000 --demo basic
```

### Ejemplo de Salida en Producción

```bash
python example_client.py --url http://54.123.45.67:5000 --demo basic
```

```
================================================================================
🚀 DEMO: Verificación Básica del API
================================================================================

🌐 Conectando a: http://54.123.45.67:5000
✅ Conexión al API exitosa
✅ Modelo cargado correctamente
...
```

---

## 💻 Uso Programático

Puedes usar el cliente en tus propios scripts:

### Ejemplo Básico

```python
from example_client import HelenAPIClient
import numpy as np

# Crear cliente
client = HelenAPIClient(base_url="http://localhost:5000")

# Verificar conexión
if client.check_connection():
    print("✅ API disponible!")
    
    # Obtener gestos
    gestures = client.get_gestures()
    print(f"Gestos disponibles: {gestures}")
    
    # Hacer predicción
    sequence = np.random.rand(40, 63).tolist()
    result = client.predict(sequence)
    
    print(f"Gesto: {result['prediccion_gesto']}")
    print(f"Confianza: {result['probabilidad_maxima']:.2%}")
else:
    print("❌ API no disponible")
```

### Ejemplo con Datos Reales de MediaPipe

```python
import cv2
import mediapipe as mp
from example_client import HelenAPIClient

# Inicializar MediaPipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5
)

# Inicializar cliente API
client = HelenAPIClient(base_url="http://localhost:5000")

# Capturar video
cap = cv2.VideoCapture(0)
sequence_buffer = []

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    # Procesar con MediaPipe
    results = hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    
    if results.multi_hand_landmarks:
        # Extraer landmarks
        landmarks = []
        for hand_landmarks in results.multi_hand_landmarks:
            for landmark in hand_landmarks.landmark:
                landmarks.extend([landmark.x, landmark.y, landmark.z])
        
        # Agregar a buffer
        sequence_buffer.append(landmarks)
        
        # Cuando tengamos 40 frames, predecir
        if len(sequence_buffer) == 40:
            result = client.predict(sequence_buffer)
            print(f"Gesto: {result['prediccion_gesto']} "
                  f"({result['probabilidad_maxima']:.1%})")
            sequence_buffer = []
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

### Manejo de Errores

```python
from example_client import HelenAPIClient

client = HelenAPIClient(base_url="http://localhost:5000")

try:
    result = client.predict(sequence)
    print(f"✅ Predicción: {result['prediccion_gesto']}")
except ConnectionError:
    print("❌ No se pudo conectar al API")
except ValueError as e:
    print(f"❌ Error en datos: {e}")
except Exception as e:
    print(f"❌ Error inesperado: {e}")
```

---

## 🧪 Test del Sistema Completo

### test_system.py

Script para validar todo el sistema de ML.

```bash
cd backend/ml-service
source venv/bin/activate
python test_system.py
```

**Qué valida:**
1. ✅ Carga de archivos de datos
2. ✅ Inicialización del modelo
3. ✅ Inferencia con datos de prueba
4. ✅ Formato de salida correcto
5. ✅ Performance aceptable

**Salida esperada:**
```
=== HELEN v5.0 - System Test ===

[1/5] Verificando archivos...
✅ X_data.npy encontrado
✅ Y_labels.npy encontrado
✅ model_final.pth encontrado
✅ gestures_map.json encontrado

[2/5] Cargando datos...
✅ Datos cargados: 150 muestras

[3/5] Inicializando modelo...
✅ Modelo cargado exitosamente

[4/5] Realizando predicciones de prueba...
✅ Predicción 1: clima (95.32%)
✅ Predicción 2: inicio (92.10%)
✅ Predicción 3: noticias (88.45%)

[5/5] Validando performance...
✅ Latencia promedio: 12.45ms
✅ Todas las pruebas pasaron correctamente!

=================================
📊 RESULTADO FINAL: EXITOSO ✅
=================================
```

---

## 📈 Benchmarking

### Script de Benchmark

```python
import time
import numpy as np
from example_client import HelenAPIClient

def benchmark_api(client, num_requests=100):
    """Benchmark del API"""
    sequence = np.random.rand(40, 63).tolist()
    
    latencies = []
    errors = 0
    
    print(f"🚀 Ejecutando {num_requests} requests...")
    
    for i in range(num_requests):
        try:
            start = time.time()
            result = client.predict(sequence)
            latency = (time.time() - start) * 1000  # ms
            latencies.append(latency)
            
            if (i + 1) % 10 == 0:
                print(f"  [{i+1}/{num_requests}] "
                      f"Latencia: {latency:.2f}ms")
        except Exception as e:
            errors += 1
            print(f"  ❌ Error en request {i+1}: {e}")
    
    # Estadísticas
    print(f"\n📊 Resultados del Benchmark:")
    print(f"  Total requests: {num_requests}")
    print(f"  Exitosos: {len(latencies)}")
    print(f"  Errores: {errors}")
    print(f"  Latencia promedio: {np.mean(latencies):.2f}ms")
    print(f"  Latencia mínima: {np.min(latencies):.2f}ms")
    print(f"  Latencia máxima: {np.max(latencies):.2f}ms")
    print(f"  Percentil 95: {np.percentile(latencies, 95):.2f}ms")
    print(f"  Throughput: {1000 / np.mean(latencies):.2f} req/s")

if __name__ == "__main__":
    client = HelenAPIClient("http://localhost:5000")
    benchmark_api(client, num_requests=100)
```

---

## ✅ Flujo de Testing Recomendado

```
1. Entrenar modelo localmente
   ↓
2. Ejecutar test_system.py
   (Verificar que el modelo funciona)
   ↓
3. Copiar modelo a API
   ↓
4. Iniciar API localmente
   ↓
5. Ejecutar example_client.py --demo all
   (Verificar que el API funciona)
   ↓
6. Si todo pasa → Desplegar a EC2
   ↓
7. Ejecutar example_client.py con URL de EC2
   (Verificar deployment)
   ↓
8. Ejecutar benchmark en producción
   ↓
9. ✅ Sistema validado y en producción
```

---

## 🔧 Troubleshooting de Tests

### Error: "Connection refused"

```bash
# Verificar que el API esté corriendo
curl http://localhost:5000/health

# Si no responde, iniciar API
cd backend/api
python api_service.py
```

### Error: "Model not loaded"

```bash
# Verificar archivos del modelo
ls -la backend/api/model_final.pth
ls -la backend/api/gestures_map.json

# Si faltan, copiarlos
cp backend/ml-service/model_final.pth backend/api/
cp backend/ml-service/gestures_map.json backend/api/
cp backend/ml-service/normalization_stats.pth backend/api/
```

### Performance Degradada

```bash
# Verificar uso de CPU
top

# Verificar si hay múltiples instancias
ps aux | grep api_service

# Reiniciar API
# Ctrl+C y luego:
python api_service.py
```

---

## 🔗 Ver También

- [Endpoints del API](./endpoints.md)
- [Deployment](./deployment.md)
- [README del API](./README.md)

---

**Última actualización**: Octubre 2025  
**Mantenido por**: Equipo Helen - 5ta Generación
