# ⚡ Helen v5.0 - Guía Rápida de Comandos

## 📋 Índice
- [Setup Inicial](#setup-inicial)
- [Gestión de Datos](#gestión-de-datos)
- [Entrenamiento del Modelo](#entrenamiento-del-modelo)
- [API y Producción](#api-y-producción)
- [Despliegue en la Nube](#despliegue-en-la-nube)
- [Solución de Problemas](#solución-de-problemas)

---

## 🚀 Setup Inicial

### Instalación desde Cero

```bash
# 1. Clonar proyecto
git clone <tu-repositorio>
cd Helen

# 2. Instalar Model-Helen
cd Model-Helen
python3.12 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 3. Instalar Api-Helen
cd Api-Helen
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### Verificar Instalación

```bash
cd Model-Helen
source venv/bin/activate
python -c "import torch; print(f'PyTorch: {torch.__version__}')"
python -c "import cv2; print(f'OpenCV: {cv2.__version__}')"
python -c "import mediapipe; print('MediaPipe: OK')"
```

---

## 📦 Gestión de Datos

### Crear Estructura de Dataset

```bash
mkdir -p dataset_gestos/inicio
mkdir -p dataset_gestos/clima
mkdir -p dataset_gestos/noticias
mkdir -p dataset_gestos/alarma
mkdir -p dataset_gestos/dispositivos
```

### Grabar Nuevos Gestos

**Opción A: Menú Interactivo (Recomendado)**
```bash
cd Model-Helen
source venv/bin/activate
python train_solid.py

# En el menú:
# → Opción 2: Agregar NUEVO gesto
# → Opción 3: Agregar MÁS VIDEOS a gesto existente
```

**Opción B: Línea de Comandos**
```bash
cd Model-Helen
source venv/bin/activate
python grabarVideo.py <nombre_gesto> <ruta_dataset>

# Ejemplo:
python grabarVideo.py hola ../dataset_gestos
```

**Durante la Grabación:**
- `s` → Iniciar grabación de un clip (3 segundos)
- `q` → Salir
- **Mínimo recomendado:** 15 videos por gesto
- **Óptimo:** 20-25 videos por gesto

### Procesar Datos (Pre-entrenamiento)

```bash
cd Model-Helen
source venv/bin/activate
python data_prep.py --dataset ../dataset_gestos --output . --seq-length 40
```

**Archivos Generados:**
- ✅ `X_data.npy` - Datos de entrenamiento (N, 40, 63)
- ✅ `Y_labels.npy` - Etiquetas (N,)
- ✅ `gestures_map.json` - Mapeo gesto↔ID

**Nota:** Este comando se ejecuta **automáticamente** al salir de `train_solid.py` después de grabar videos.

---

## 🧠 Entrenamiento del Modelo

### Entrenar con Menú Interactivo (Recomendado)

```bash
cd Model-Helen
source venv/bin/activate
python train_solid.py

# Seleccionar:
# → Opción 1: Entrenar modelo con gestos actuales
# → Ingresar épocas (default: 30)
# → Ingresar batch_size (default: 32)
```

### Entrenar con Parámetros Personalizados

```python
# En script personalizado
from train_solid import create_application

app = create_application(base_dir=".")

# Modificar parámetros en training_service
# Luego ejecutar:
app._handle_training()
```

### Monitorear Entrenamiento

Durante el entrenamiento verás:
```
🚀 --- INICIANDO ENTRENAMIENTO ---
Número de clases: 5
Dispositivo: cpu

🔄 Época 1/30 [████████░░░░░░░░░░░░░░] Loss: 1.2345 | Val Loss: 1.1234 | Val Acc: 75.50%
🔄 Época 2/30 [████████████░░░░░░░░░░] Loss: 0.9876 | Val Loss: 0.8765 | Val Acc: 82.30%
...
🎉 --- ENTRENAMIENTO COMPLETADO ---
✅ Mejor Accuracy: 95.60%
```

### Archivos Generados por Entrenamiento

```bash
Model-Helen/
├── model_final.pth               # ⭐ Modelo entrenado
├── normalization_stats.pth       # ⭐ Estadísticas de normalización
├── gestures_map.json             # ⭐ Mapeo de gestos
├── X_data.npy                    # Datos preprocesados
└── Y_labels.npy                  # Etiquetas
```

---

## 🌐 API y Producción

### Copiar Modelo a API

```bash
# Método 1: Manual
cp Model-Helen/model_final.pth Api-Helen/
cp Model-Helen/gestures_map.json Api-Helen/
cp Model-Helen/normalization_stats.pth Api-Helen/

# Método 2: Script (si está disponible)
python helen_util.py copy-model
```

### Iniciar API en Desarrollo

```bash
cd Api-Helen
source venv/bin/activate
python api_service.py

# API corriendo en: http://localhost:5000
```

### Iniciar API en Producción

```bash
cd Api-Helen
source venv/bin/activate

# Instalar Gunicorn
pip install gunicorn

# Iniciar con 4 workers
gunicorn -w 4 -b 0.0.0.0:5000 api_service:app
```

### Probar API

```bash
# Verificar estado
curl http://localhost:5000/

# Listar gestos disponibles
curl http://localhost:5000/gestures

# Health check
curl http://localhost:5000/health

# Hacer predicción (requiere secuencia real de 40x63)
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "sequence": [
      [0.5, 0.6, 0.1, ...],
      ...
    ]
  }'
```

### Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Info del servicio |
| GET | `/gestures` | Lista de gestos |
| GET | `/health` | Estado del API |
| POST | `/predict` | Predicción de gesto |

---

## ☁️ Despliegue en la Nube

### 1. Crear Instancia EC2

```bash
# Especificaciones Mínimas:
# • AMI: Ubuntu 24.04 LTS
# • Tipo: t2.small (2 vCPU, 2GB RAM)
# • Storage: 20GB gp3
# • Security Group:
#   - SSH (22) desde tu IP
#   - Custom TCP (5000) desde 0.0.0.0/0
```

### 2. Conectar y Configurar EC2

```bash
# Conectar via SSH
ssh -i tu-llave.pem ubuntu@<IP-PUBLICA>

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python 3.12
sudo apt install python3.12 python3.12-venv python3-pip -y

# Instalar dependencias del sistema
sudo apt install python3-dev build-essential -y
```

### 3. Subir Archivos a EC2

```bash
# Desde tu máquina local

# Subir carpeta Api-Helen
scp -i tu-llave.pem -r Api-Helen ubuntu@<IP-PUBLICA>:~

# Subir modelo entrenado
scp -i tu-llave.pem Model-Helen/model_final.pth ubuntu@<IP-PUBLICA>:~/Api-Helen/
scp -i tu-llave.pem Model-Helen/gestures_map.json ubuntu@<IP-PUBLICA>:~/Api-Helen/
scp -i tu-llave.pem Model-Helen/normalization_stats.pth ubuntu@<IP-PUBLICA>:~/Api-Helen/
```

### 4. Instalar Dependencias en EC2

```bash
# En EC2
cd ~/Api-Helen
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn
```

### 5. Probar API en EC2

```bash
# Probar localmente en EC2
python api_service.py

# En otra terminal, probar:
curl http://localhost:5000/

# Si funciona, proceder a crear servicio systemd
```

### 6. Crear Servicio Systemd

```bash
sudo nano /etc/systemd/system/helen-api.service
```

```ini
[Unit]
Description=Helen API Service - Reconocimiento LSM
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/Api-Helen
Environment="PATH=/home/ubuntu/Api-Helen/venv/bin"
ExecStart=/home/ubuntu/Api-Helen/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 --timeout 60 api_service:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Activar y iniciar servicio
sudo systemctl daemon-reload
sudo systemctl enable helen-api
sudo systemctl start helen-api

# Verificar estado
sudo systemctl status helen-api
```

### 7. Verificar Funcionamiento

```bash
# Desde EC2
curl http://localhost:5000/

# Desde tu máquina local
curl http://<IP-PUBLICA-EC2>:5000/
curl http://<IP-PUBLICA-EC2>:5000/gestures
```

### Gestión del Servicio en EC2

```bash
# Iniciar servicio
sudo systemctl start helen-api

# Detener servicio
sudo systemctl stop helen-api

# Reiniciar servicio
sudo systemctl restart helen-api

# Ver estado
sudo systemctl status helen-api

# Ver logs en tiempo real
sudo journalctl -u helen-api -f

# Ver últimas 100 líneas de logs
sudo journalctl -u helen-api -n 100

# Ver solo errores
sudo journalctl -u helen-api -p err
```

### Actualizar Modelo en Producción

```bash
# 1. Entrenar nuevo modelo localmente
cd Model-Helen
python train_solid.py

# 2. Subir a EC2
scp -i tu-llave.pem model_final.pth ubuntu@<IP-PUBLICA>:~/Api-Helen/
scp -i tu-llave.pem gestures_map.json ubuntu@<IP-PUBLICA>:~/Api-Helen/
scp -i tu-llave.pem normalization_stats.pth ubuntu@<IP-PUBLICA>:~/Api-Helen/

# 3. Reiniciar servicio
ssh -i tu-llave.pem ubuntu@<IP-PUBLICA> "sudo systemctl restart helen-api"
```

---

## 🧪 Testing y Verificación

### test_system.py - Verificación Completa del Sistema

**Propósito:** Verifica que el modelo y todos los componentes funcionen correctamente.

```bash
# Ejecutar todos los tests
python test_system.py
```

**Tests incluidos:**
1. ✅ **Test 1:** Arquitectura del modelo (forward pass, dimensiones)
2. ✅ **Test 2:** Preparación de datos (archivos .npy, gestures_map.json)
3. ✅ **Test 3:** Inferencia del modelo (predicción con datos reales)
4. ✅ **Test 4:** Estructura de API (archivos del modelo en Api-Helen)
5. ✅ **Test 5:** Mock request (simular petición HTTP)

**Salida esperada:**
```
🚀 INICIANDO TESTS DEL SISTEMA HELEN
================================================================================

🧪 TEST 1: Arquitectura del Modelo
================================================================================
✅ Arquitectura OK
  Input: torch.Size([4, 40, 63])
  Output: torch.Size([4, 5])
  Parámetros: 234,567

🧪 TEST 2: Preparación de Datos
================================================================================
✅ Archivos de datos encontrados
  X_data.npy: (150, 40, 63)
  Y_labels.npy: (150,)
  Gestos: inicio, clima, noticias, alarma, dispositivos

[... más tests ...]

📊 RESUMEN DE TESTS
================================================================================
  ✅ Arquitectura del Modelo
  ✅ Preparación de Datos
  ✅ Inferencia del Modelo
  ✅ Estructura de API
  ✅ Mock Request a API

  Total: 5/5 tests pasados

🎉 ¡Todos los tests pasaron! El sistema está listo.
```

---

### example_client.py - Cliente de Prueba para API

**Propósito:** Simula peticiones del frontend al API, útil para:
- Probar el API sin necesitar el frontend completo
- Ver ejemplos de cómo hacer peticiones correctamente
- Debugging y verificación de rendimiento
- Demos de capacidades del sistema

#### Uso Básico

```bash
# Demo básico (1 predicción)
python example_client.py --url http://localhost:5000 --demo basic

# Demo múltiple (10 predicciones para medir rendimiento)
python example_client.py --url http://localhost:5000 --demo multiple

# Demo de manejo de errores
python example_client.py --url http://localhost:5000 --demo errors

# Ejecutar todos los demos
python example_client.py --url http://localhost:5000 --demo all
```

#### Demo Básico - Salida

```
🔗 Conectando a: http://localhost:5000

================================================================================
🚀 DEMO: Uso Básico de la API
================================================================================

[1/4] Verificando conexión...
✅ Conexión establecida
  Estado: online
  Gestos disponibles: inicio, clima, noticias
  Modelo cargado: True
  Device: cpu

[2/4] Obteniendo lista de gestos...
✅ Gestos disponibles:
  • inicio (ID: 0)
  • clima (ID: 1)
  • noticias (ID: 2)

[3/4] Generando secuencia de prueba...
✅ Secuencia creada: 40 frames x 63 features
  Tamaño: ~10 KB

[4/4] Realizando predicción...
✅ Predicción exitosa (latencia: 45.32 ms)

📊 Resultado:
  🎯 Gesto predicho: clima
  📈 Confianza: 95.32%
  
  Todas las probabilidades:
    inicio    : 2.34%
    clima     : 95.32% ⭐
    noticias  : 2.34%

================================================================================
```

#### Demo Múltiple - Salida

```
================================================================================
🚀 DEMO: Múltiples Predicciones (Benchmark de Rendimiento)
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

#### Demo de Errores - Salida

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

#### Probar con API en EC2

```bash
# Probar API desplegada en la nube
python example_client.py --url http://<IP-PUBLICA-EC2>:5000 --demo all

# Solo verificar conexión
python example_client.py --url http://<IP-PUBLICA-EC2>:5000 --demo basic
```

---

### Uso Programático de example_client.py

También puedes usar el cliente en tus propios scripts:

```python
from example_client import HelenAPIClient
import numpy as np

# Crear cliente
client = HelenAPIClient(base_url="http://localhost:5000")

# Verificar conexión
if client.check_connection():
    print("API disponible!")
    
    # Obtener gestos
    gestures = client.get_gestures()
    print(f"Gestos disponibles: {gestures}")
    
    # Hacer predicción con secuencia real
    # (aquí irían tus datos de MediaPipe)
    sequence = np.random.rand(40, 63).tolist()
    result = client.predict(sequence)
    
    print(f"Gesto: {result['prediccion_gesto']}")
    print(f"Confianza: {result['probabilidad_maxima']:.2%}")
```

---

### Flujo de Testing Recomendado

```
1. Entrenar modelo localmente
   ↓
2. Ejecutar test_system.py (verificar que todo funciona)
   ↓
3. Copiar modelo a API
   ↓
4. Iniciar API localmente
   ↓
5. Ejecutar example_client.py --demo all (verificar API)
   ↓
6. Si todo pasa → Desplegar a EC2
   ↓
7. Ejecutar example_client.py con URL de EC2
```

### Configurar Backup Automático

```bash
# En EC2
mkdir -p ~/backups

# Editar crontab
crontab -e

# Agregar línea para backup semanal (Domingos 2am)
0 2 * * 0 tar -czf ~/backups/helen-$(date +\%Y\%m\%d).tar.gz ~/Api-Helen

# Agregar línea para limpiar backups antiguos (más de 30 días)
0 3 * * 0 find ~/backups -name "helen-*.tar.gz" -mtime +30 -delete
```

---

## 🔧 Solución de Problemas

### Error: "ModuleNotFoundError: No module named 'torch'"

```bash
cd Model-Helen  # o Api-Helen
source venv/bin/activate
pip install torch torchvision
```

### Error: "No such file or directory: X_data.npy"

```bash
# Ejecutar data_prep.py primero
cd Model-Helen
python data_prep.py --dataset ../dataset_gestos --output . --seq-length 40
```

### Error: "Modelo no cargado" en API

```bash
# Verificar que existan los archivos
ls Api-Helen/model_final.pth
ls Api-Helen/gestures_map.json
ls Api-Helen/normalization_stats.pth

# Si no existen, copiarlos:
cp Model-Helen/*.pth Api-Helen/
cp Model-Helen/gestures_map.json Api-Helen/
```

### API no responde en EC2

```bash
# 1. Verificar que el servicio esté corriendo
sudo systemctl status helen-api

# 2. Si no está corriendo, iniciarlo
sudo systemctl start helen-api

# 3. Ver logs para detectar errores
sudo journalctl -u helen-api -n 50

# 4. Verificar Security Group en AWS
# → Puerto 5000 debe estar abierto desde 0.0.0.0/0

# 5. Probar localmente en EC2
ssh ubuntu@<IP> "curl http://localhost:5000/"

# 6. Si funciona localmente pero no desde fuera:
# → Revisar Security Group en AWS Console
```

### Puerto 5000 ya en uso

```bash
# Ver qué proceso está usando el puerto
sudo lsof -i :5000

# Matar el proceso
sudo kill -9 <PID>

# O cambiar el puerto en api_service.py
# app.run(host='0.0.0.0', port=5001)  # Usar 5001
```

### Bajo rendimiento / predicciones lentas

```bash
# Verificar uso de GPU (si está disponible)
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"

# Si tienes GPU NVIDIA, instalar PyTorch con CUDA:
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### Reiniciar todo desde cero

```bash
# 1. Eliminar entornos virtuales
rm -rf Model-Helen/venv
rm -rf Api-Helen/venv

# 2. Eliminar archivos generados
rm Model-Helen/*.npy
rm Model-Helen/*.pth
rm Model-Helen/gestures_map.json

# 3. Reinstalar todo
cd Model-Helen
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

cd Api-Helen
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

---

## 📝 Workflows Comunes

### Workflow 1: Agregar Nuevo Gesto

```bash
# 1. Grabar videos (automático)
cd Model-Helen
python train_solid.py
# → Opción 2: Agregar nuevo gesto
# → Grabar 15-20 videos
# → Al salir: data_prep.py se ejecuta automáticamente

# 2. Entrenar modelo
python train_solid.py
# → Opción 1: Entrenar modelo

# 3. Copiar a API
cp model_final.pth ../Api-Helen/
cp gestures_map.json ../Api-Helen/
cp normalization_stats.pth ../Api-Helen/

# 4. Reiniciar API
cd ../Api-Helen
# Si local:
# Ctrl+C y luego: python api_service.py
# Si EC2:
ssh ubuntu@<IP> "sudo systemctl restart helen-api"
```

### Workflow 2: Mejorar Gesto Existente

```bash
# 1. Grabar más videos para el gesto
cd Model-Helen
python train_solid.py
# → Opción 3: Grabar MÁS VIDEOS para gesto existente
# → Seleccionar gesto de la lista
# → Grabar 10-15 videos adicionales
# → Al salir: data_prep.py se ejecuta automáticamente

# 2. Re-entrenar modelo
python train_solid.py
# → Opción 1: Entrenar modelo

# 3. Actualizar en producción
cp model_final.pth ../Api-Helen/
# ... (igual que Workflow 1)
```

### Workflow 3: Deploy Completo a EC2

```bash
# 1. Entrenar modelo localmente
cd Model-Helen
python train_solid.py

# 2. Subir todo a EC2
scp -i llave.pem -r Api-Helen ubuntu@<IP>:~
scp -i llave.pem Model-Helen/*.pth ubuntu@<IP>:~/Api-Helen/
scp -i llave.pem Model-Helen/gestures_map.json ubuntu@<IP>:~/Api-Helen/

# 3. Configurar servicio en EC2
ssh -i llave.pem ubuntu@<IP>
cd ~/Api-Helen
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
# ... (seguir pasos de "Despliegue en la Nube")

# 4. Verificar
curl http://<IP>:5000/gestures
```

---

## 🎯 Tips y Mejores Prácticas

### Grabación de Gestos

- ✅ Graba en diferentes condiciones de iluminación
- ✅ Varía el fondo
- ✅ Usa diferentes velocidades de ejecución
- ✅ Mantén la mano centrada en el frame
- ✅ Mínimo 15 videos, óptimo 20-25 por gesto

### Entrenamiento

- ✅ Empieza con 30 épocas
- ✅ Si validation accuracy no mejora, reduce learning rate
- ✅ Usa GPU si está disponible para entrenamiento más rápido
- ✅ Guarda checkpoints regularmente

### Producción

- ✅ Usa Gunicorn en producción, no Flask development server
- ✅ Configura logs para monitoreo
- ✅ Implementa backups automáticos
- ✅ Documenta cambios en gestures_map.json

---

## 📚 Referencias Rápidas

### Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `model_final.pth` | Modelo entrenado (5MB) |
| `gestures_map.json` | Mapeo gesto↔ID |
| `normalization_stats.pth` | Stats para normalización |
| `X_data.npy` | Datos de entrenamiento |
| `Y_labels.npy` | Etiquetas |

### Puertos

| Servicio | Puerto |
|----------|--------|
| API Flask (dev) | 5000 |
| API Flask (prod) | 5000 |
| SSH EC2 | 22 |

### Comandos Systemd

| Acción | Comando |
|--------|---------|
| Iniciar | `sudo systemctl start helen-api` |
| Detener | `sudo systemctl stop helen-api` |
| Reiniciar | `sudo systemctl restart helen-api` |
| Estado | `sudo systemctl status helen-api` |
| Logs | `sudo journalctl -u helen-api -f` |

---

**¿Necesitas más ayuda?** Consulta el README.md completo para explicaciones detalladas.
