# 🚀 Deployment - Guía de Despliegue

Guía completa para desplegar Helen API en producción local y en AWS EC2.

## 📋 Tabla de Contenidos

- [Producción Local](#producción-local)
- [Despliegue en AWS EC2](#despliegue-en-aws-ec2)
- [Configuración de Systemd](#configuración-de-systemd)
- [Monitoreo y Logs](#monitoreo-y-logs)
- [Backup y Recuperación](#backup-y-recuperación)
- [Troubleshooting](#troubleshooting)

---

## 🖥️ Producción Local

### Con Flask Development Server

**⚠️ Solo para desarrollo - NO usar en producción**

```bash
cd backend/api
source venv/bin/activate
python api_service.py
```

### Con Gunicorn (Recomendado para Producción)

```bash
cd backend/api
source venv/bin/activate

# Instalar Gunicorn
pip install gunicorn

# Iniciar con 4 workers
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 60 api_service:app

# Con logs
gunicorn -w 4 -b 0.0.0.0:5000 \
  --access-logfile access.log \
  --error-logfile error.log \
  api_service:app
```

**Parámetros de Gunicorn:**
- `-w`: Número de workers (recomendado: 2-4)
- `-b`: Bind address y puerto
- `--timeout`: Timeout para requests (segundos)
- `--workers`: Alias de `-w`

**Calcular número de workers:**
```
workers = (2 × CPU_cores) + 1
```

---

## ☁️ Despliegue en AWS EC2

### 1. Crear Instancia EC2

**Especificaciones Mínimas:**

| Recurso | Especificación |
|---------|----------------|
| AMI | Ubuntu 24.04 LTS |
| Tipo de Instancia | t2.small (2 vCPU, 2GB RAM) |
| Storage | 20GB gp3 |
| Security Group | Ver abajo |

**Configuración de Security Group:**

| Tipo | Protocolo | Puerto | Origen |
|------|-----------|--------|---------|
| SSH | TCP | 22 | Tu IP |
| Custom TCP | TCP | 5000 | 0.0.0.0/0 |

### 2. Conectar a EC2

```bash
# Descargar tu llave .pem desde AWS Console
chmod 400 tu-llave.pem

# Conectar
ssh -i tu-llave.pem ubuntu@<IP-PUBLICA>
```

### 3. Configurar Servidor EC2

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python 3.12
sudo apt install python3.12 python3.12-venv python3-pip -y

# Instalar dependencias del sistema
sudo apt install python3-dev build-essential -y

# Verificar instalación
python3.12 --version
```

### 4. Subir Archivos a EC2

**Desde tu máquina local:**

```bash
# Subir carpeta completa del API
scp -i tu-llave.pem -r backend/api ubuntu@<IP-PUBLICA>:~/Api-Helen

# Subir modelos entrenados
scp -i tu-llave.pem backend/ml-service/model_final.pth ubuntu@<IP-PUBLICA>:~/Api-Helen/
scp -i tu-llave.pem backend/ml-service/gestures_map.json ubuntu@<IP-PUBLICA>:~/Api-Helen/
scp -i tu-llave.pem backend/ml-service/normalization_stats.pth ubuntu@<IP-PUBLICA>:~/Api-Helen/
```

**Alternativa - Usando rsync:**

```bash
# Sincronizar carpeta completa
rsync -avz -e "ssh -i tu-llave.pem" \
  backend/api/ \
  ubuntu@<IP-PUBLICA>:~/Api-Helen/
```

### 5. Instalar Dependencias en EC2

```bash
# En EC2
cd ~/Api-Helen
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn
```

### 6. Probar API en EC2

```bash
# Probar localmente primero
python api_service.py

# En otra terminal SSH:
curl http://localhost:5000/health

# Si funciona, continuar con systemd
```

---

## ⚙️ Configuración de Systemd

### Crear Servicio Systemd

```bash
sudo nano /etc/systemd/system/helen-api.service
```

**Contenido del archivo:**

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
StandardOutput=append:/home/ubuntu/Api-Helen/logs/service.log
StandardError=append:/home/ubuntu/Api-Helen/logs/error.log

[Install]
WantedBy=multi-user.target
```

### Activar y Iniciar Servicio

```bash
# Crear directorio de logs
mkdir -p ~/Api-Helen/logs

# Recargar systemd
sudo systemctl daemon-reload

# Habilitar servicio (auto-start en boot)
sudo systemctl enable helen-api

# Iniciar servicio
sudo systemctl start helen-api

# Verificar estado
sudo systemctl status helen-api
```

**Salida esperada:**

```
● helen-api.service - Helen API Service - Reconocimiento LSM
     Loaded: loaded (/etc/systemd/system/helen-api.service; enabled)
     Active: active (running) since ...
   Main PID: 1234 (gunicorn)
      Tasks: 5
     Memory: 250.0M
```

### Comandos de Gestión del Servicio

```bash
# Iniciar
sudo systemctl start helen-api

# Detener
sudo systemctl stop helen-api

# Reiniciar
sudo systemctl restart helen-api

# Ver estado
sudo systemctl status helen-api

# Ver logs en tiempo real
sudo journalctl -u helen-api -f

# Ver últimas 50 líneas de logs
sudo journalctl -u helen-api -n 50

# Ver logs desde hoy
sudo journalctl -u helen-api --since today
```

---

## 🧪 Verificar Funcionamiento

### Desde EC2 (localhost)

```bash
curl http://localhost:5000/
curl http://localhost:5000/health
curl http://localhost:5000/gestures
```

### Desde tu Máquina Local

```bash
# Reemplazar <IP-PUBLICA-EC2> con la IP de tu instancia
curl http://<IP-PUBLICA-EC2>:5000/
curl http://<IP-PUBLICA-EC2>:5000/health
curl http://<IP-PUBLICA-EC2>:5000/gestures

# Test completo con example_client
python backend/api/example_client.py \
  --url http://<IP-PUBLICA-EC2>:5000 \
  --demo all
```

---

## 📊 Monitoreo y Logs

### Ver Logs del Servicio

```bash
# Logs en tiempo real
sudo journalctl -u helen-api -f

# Logs con timestamp
sudo journalctl -u helen-api -f --since "10 minutes ago"

# Filtrar por nivel
sudo journalctl -u helen-api -p err  # Solo errores

# Exportar logs
sudo journalctl -u helen-api > helen_logs_$(date +%Y%m%d).log
```

### Logs de la Aplicación

```bash
# Ver logs del servicio
tail -f ~/Api-Helen/logs/service.log

# Ver logs de error
tail -f ~/Api-Helen/logs/error.log

# Ver logs de Gunicorn (si están configurados)
tail -f ~/Api-Helen/access.log
tail -f ~/Api-Helen/error.log
```

### Monitoreo de Recursos

```bash
# CPU y Memoria
top

# Filtrar por proceso
top -p $(pgrep -f gunicorn)

# Uso de memoria
free -h

# Uso de disco
df -h
```

### Monitoreo del Servicio

```bash
# Script de monitoreo básico
cat > ~/monitor_helen.sh << 'EOF'
#!/bin/bash
while true; do
  clear
  echo "=== Helen API Monitor ==="
  echo "Time: $(date)"
  echo ""
  echo "Service Status:"
  sudo systemctl status helen-api --no-pager | head -n 3
  echo ""
  echo "API Health:"
  curl -s http://localhost:5000/health | python3 -m json.tool
  echo ""
  echo "Resource Usage:"
  ps aux | grep gunicorn | grep -v grep
  sleep 5
done
EOF

chmod +x ~/monitor_helen.sh
./monitor_helen.sh
```

---

## 💾 Backup y Recuperación

### Configurar Backup Automático

```bash
# Crear directorio de backups
mkdir -p ~/backups

# Crear script de backup
cat > ~/backup_helen.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="helen_backup_${DATE}.tar.gz"

# Crear backup
tar -czf ${BACKUP_DIR}/${BACKUP_FILE} \
  ~/Api-Helen/*.py \
  ~/Api-Helen/requirements.txt \
  ~/Api-Helen/*.pth \
  ~/Api-Helen/*.json

# Limpiar backups antiguos (más de 30 días)
find ${BACKUP_DIR} -name "helen_backup_*.tar.gz" -mtime +30 -delete

echo "Backup creado: ${BACKUP_FILE}"
EOF

chmod +x ~/backup_helen.sh
```

### Programar Backup Automático

```bash
# Editar crontab
crontab -e

# Agregar líneas:
# Backup semanal (Domingos 2am)
0 2 * * 0 ~/backup_helen.sh

# Limpiar backups antiguos (Domingos 3am)
0 3 * * 0 find ~/backups -name "helen-*.tar.gz" -mtime +30 -delete
```

### Restaurar desde Backup

```bash
# Listar backups disponibles
ls -lh ~/backups/

# Restaurar backup
tar -xzf ~/backups/helen_backup_YYYYMMDD_HHMMSS.tar.gz -C ~

# Reiniciar servicio
sudo systemctl restart helen-api
```

---

## 🔧 Actualización del Modelo

### Actualizar Modelo en Producción

```bash
# 1. Desde tu máquina local, subir nuevo modelo
scp -i tu-llave.pem backend/ml-service/model_final.pth \
  ubuntu@<IP-EC2>:~/Api-Helen/model_final.pth.new

# 2. En EC2, hacer backup del modelo actual
ssh -i tu-llave.pem ubuntu@<IP-EC2>
cp ~/Api-Helen/model_final.pth ~/Api-Helen/model_final.pth.backup

# 3. Reemplazar con nuevo modelo
mv ~/Api-Helen/model_final.pth.new ~/Api-Helen/model_final.pth

# 4. Reiniciar servicio
sudo systemctl restart helen-api

# 5. Verificar
curl http://localhost:5000/health
```

### Script de Actualización Automática

```bash
cat > ~/update_model.sh << 'EOF'
#!/bin/bash
set -e

MODEL_FILE="$1"

if [ -z "$MODEL_FILE" ]; then
  echo "Uso: $0 <ruta_al_nuevo_modelo.pth>"
  exit 1
fi

# Backup del modelo actual
cp ~/Api-Helen/model_final.pth ~/Api-Helen/model_final.pth.backup_$(date +%Y%m%d_%H%M%S)

# Copiar nuevo modelo
cp "$MODEL_FILE" ~/Api-Helen/model_final.pth

# Reiniciar servicio
sudo systemctl restart helen-api

# Verificar
sleep 5
if curl -s http://localhost:5000/health | grep -q "healthy"; then
  echo "✅ Modelo actualizado exitosamente"
else
  echo "❌ Error al actualizar modelo, restaurando backup..."
  cp ~/Api-Helen/model_final.pth.backup ~/Api-Helen/model_final.pth
  sudo systemctl restart helen-api
  exit 1
fi
EOF

chmod +x ~/update_model.sh
```

---

## 🐛 Troubleshooting

### API No Responde

```bash
# 1. Verificar estado del servicio
sudo systemctl status helen-api

# 2. Si no está running:
sudo systemctl start helen-api

# 3. Ver logs de error
sudo journalctl -u helen-api -n 50

# 4. Verificar puerto
sudo netstat -tlnp | grep 5000

# 5. Verificar Security Group en AWS
# → Puerto 5000 debe estar abierto desde 0.0.0.0/0
```

### Error: "Model not loaded"

```bash
# Verificar archivos
ls -la ~/Api-Helen/model_final.pth
ls -la ~/Api-Helen/gestures_map.json
ls -la ~/Api-Helen/normalization_stats.pth

# Si faltan, copiarlos
scp -i tu-llave.pem backend/ml-service/*.pth ubuntu@<IP>:~/Api-Helen/
scp -i tu-llave.pem backend/ml-service/*.json ubuntu@<IP>:~/Api-Helen/

# Reiniciar servicio
sudo systemctl restart helen-api
```

### Puerto 5000 Ya en Uso

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :5000

# Matar proceso
sudo kill -9 <PID>

# O cambiar puerto en el servicio systemd
sudo nano /etc/systemd/system/helen-api.service
# Cambiar: -b 0.0.0.0:5001

sudo systemctl daemon-reload
sudo systemctl restart helen-api
```

### Servicio Se Detiene Solo

```bash
# Ver logs para encontrar el error
sudo journalctl -u helen-api --since "1 hour ago"

# Causas comunes:
# 1. Memoria insuficiente
free -h

# 2. Timeout muy corto
# Aumentar en el servicio systemd:
sudo nano /etc/systemd/system/helen-api.service
# Cambiar: --timeout 120

# 3. Worker crashes
# Ver logs de Gunicorn en ~/Api-Helen/logs/
```

### Alto Uso de Memoria

```bash
# Ver uso por proceso
ps aux --sort=-%mem | head -n 10

# Reducir número de workers
sudo nano /etc/systemd/system/helen-api.service
# Cambiar: -w 2  (en vez de 4)

sudo systemctl daemon-reload
sudo systemctl restart helen-api
```

### Conexión Rechazada desde Exterior

```bash
# 1. Verificar que el servicio esté escuchando en 0.0.0.0
sudo netstat -tlnp | grep 5000

# 2. Verificar Security Group en AWS Console
# → Debe tener regla para puerto 5000 desde 0.0.0.0/0

# 3. Verificar firewall de Ubuntu (ufw)
sudo ufw status
sudo ufw allow 5000/tcp
```

---

## 📋 Checklist de Deployment

### Pre-Deployment
- [ ] Modelo entrenado y testeado localmente
- [ ] `test_system.py` pasa exitosamente
- [ ] `example_client.py` funciona localmente
- [ ] Requirements.txt actualizado

### Durante Deployment
- [ ] Instancia EC2 creada y configurada
- [ ] Security Group configurado correctamente
- [ ] Archivos subidos a EC2
- [ ] Dependencias instaladas
- [ ] Servicio systemd configurado

### Post-Deployment
- [ ] API responde desde exterior
- [ ] Health check pasa
- [ ] Tests con example_client pasan
- [ ] Logs configurados
- [ ] Backup automático configurado
- [ ] Monitoreo activo

---

## 🔗 Ver También

- [Testing del API](./testing.md)
- [Endpoints](./endpoints.md)
- [README del API](./README.md)
- [Setup del API](../../../setup/API_SETUP.md)

---

**Última actualización**: Octubre 2025  
**Mantenido por**: Equipo Helen - 5ta Generación
