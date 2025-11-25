# 🍓 Configuración de Raspberry Pi para Helen - Modo Kiosko

## 📋 Requisitos Previos
- Raspberry Pi con Raspberry Pi OS (32-bit o 64-bit)
- Conexión a Internet
- Acceso SSH o teclado/monitor conectado

## 🚀 Instalación Paso a Paso

### 1️⃣ Instalar Dependencias

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar Chromium y utilidades
sudo apt install -y chromium-browser unclutter xdotool

# Habilitar la cámara
sudo raspi-config
# Ir a: Interface Options > Camera > Enable
```

### 2️⃣ Copiar Script de Kiosko

```bash
# Crear directorio para Helen
mkdir -p ~/helen

# Copiar el script (puedes usar scp desde tu Mac)
# Desde tu Mac:
scp /Users/isaku/Desktop/Helen/Helen_v5.0.2/deployment/raspberry-pi-kiosk.sh pi@<IP_DE_TU_PI>:~/helen/

# O crear el archivo directamente en la Pi:
nano ~/helen/kiosk.sh
# (Pegar el contenido del script)
```

### 3️⃣ Dar Permisos de Ejecución

```bash
chmod +x ~/helen/kiosk.sh
```

### 4️⃣ Configurar Autostart

```bash
# Crear directorio autostart si no existe
mkdir -p ~/.config/lxsession/LXDE-pi

# Editar archivo autostart
nano ~/.config/lxsession/LXDE-pi/autostart
```

**Agregar estas líneas al archivo:**

```bash
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash

# Helen Kiosk Mode
@bash /home/pi/helen/kiosk.sh
```

### 5️⃣ Configurar Permisos de Cámara

```bash
# Agregar usuario pi al grupo video
sudo usermod -a -G video pi

# Verificar permisos
groups pi
```

### 6️⃣ Configuración Adicional (Opcional pero Recomendado)

#### **A) Evitar que se apague la pantalla**

```bash
# Editar configuración de LightDM
sudo nano /etc/lightdm/lightdm.conf
```

Buscar la sección `[Seat:*]` y agregar/modificar:

```ini
[Seat:*]
xserver-command=X -s 0 -dpms
```

#### **B) Ocultar cursor del mouse**

Ya está incluido en el script con `unclutter`

#### **C) Rotación de pantalla (si es necesario)**

```bash
# Editar config.txt
sudo nano /boot/config.txt

# Agregar al final:
# display_rotate=0  # Normal
# display_rotate=1  # 90 grados
# display_rotate=2  # 180 grados
# display_rotate=3  # 270 grados
```

### 7️⃣ Reiniciar Raspberry Pi

```bash
sudo reboot
```

## ✅ Verificación

Después del reinicio, la Raspberry Pi debería:
1. ✅ Iniciar automáticamente
2. ✅ Esperar conexión de red
3. ✅ Abrir Chromium en pantalla completa
4. ✅ Cargar Helen en `https://13.58.208.156`
5. ✅ Aceptar automáticamente el certificado SSL
6. ✅ Dar permisos a la cámara
7. ✅ Iniciar detección de gestos

## 🔧 Solución de Problemas

### La pantalla se apaga después de un tiempo

```bash
# Editar configuración del entorno de escritorio
nano ~/.config/lxsession/LXDE-pi/autostart

# Agregar:
@xset s off
@xset -dpms
@xset s noblank
```

### El navegador no se abre en fullscreen

Verificar que el script tiene permisos de ejecución:
```bash
ls -l ~/helen/kiosk.sh
chmod +x ~/helen/kiosk.sh
```

### No aparece la cámara

```bash
# Verificar que la cámara está habilitada
vcgencmd get_camera

# Debería mostrar:
# supported=1 detected=1
```

### Chromium muestra avisos de certificado

El script ya incluye `--ignore-certificate-errors`, pero si persiste:

```bash
# Editar el script y verificar que incluye:
--ignore-certificate-errors \
--allow-insecure-localhost \
```

### Reiniciar solo la aplicación (sin reiniciar la Pi)

```bash
# Matar Chromium
pkill chromium

# Ejecutar el script manualmente
~/helen/kiosk.sh
```

## 🎯 Comandos Útiles

```bash
# Ver logs del sistema
journalctl -xe

# Ver procesos de Chromium
ps aux | grep chromium

# Reiniciar interfaz gráfica
sudo systemctl restart lightdm

# Verificar autostart
cat ~/.config/lxsession/LXDE-pi/autostart
```

## 🔄 Actualizar la Aplicación

Cuando actualices la aplicación en el servidor EC2, simplemente reinicia el navegador en la Raspberry Pi:

```bash
pkill chromium
~/helen/kiosk.sh
```

O reinicia completamente:

```bash
sudo reboot
```

## 📱 Acceso Remoto

Para hacer cambios sin teclado/monitor:

```bash
# Desde tu Mac, conectarte por SSH
ssh pi@<IP_DE_TU_PI>

# Si necesitas ver la interfaz gráfica
# Instalar VNC:
sudo apt install -y realvnc-vnc-server
sudo raspi-config
# Interface Options > VNC > Enable
```

## 🎨 Personalización

### Cambiar la URL de Helen

Editar el script:
```bash
nano ~/helen/kiosk.sh

# Cambiar la línea:
HELEN_URL="https://13.58.208.156"
```

### Agregar una página de carga personalizada

Puedes crear una página HTML local que se muestre mientras carga:

```bash
nano ~/helen/loading.html
```

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Iniciando Helen...</title>
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .loading {
            text-align: center;
        }
        h1 { font-size: 3em; }
        .spinner {
            border: 8px solid rgba(255,255,255,0.3);
            border-top: 8px solid white;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
    <meta http-equiv="refresh" content="5;url=https://13.58.208.156">
</head>
<body>
    <div class="loading">
        <h1>🏠 Helen</h1>
        <div class="spinner"></div>
        <p>Iniciando sistema...</p>
    </div>
</body>
</html>
```

Luego modificar el script para mostrar primero esta página.

## 🎉 ¡Listo!

Tu Raspberry Pi ahora funciona como un kiosko dedicado para Helen, iniciando automáticamente al encender.
