#!/bin/bash
###############################################################################
# Helen - Raspberry Pi Kiosk Mode Startup Script
# Este script inicia Chromium en modo kiosko apuntando a la aplicación Helen
###############################################################################

# Esperar a que la red esté disponible
echo "🔌 Esperando conexión de red..."
while ! ping -c 1 -W 1 8.8.8.8 &> /dev/null; do
    sleep 1
done
echo "✅ Red disponible"

# Esperar 5 segundos adicionales para estabilidad
sleep 5

# URL de la aplicación Helen
HELEN_URL="https://13.58.208.156"

# Desactivar el protector de pantalla y administración de energía
echo "🔧 Configurando pantalla..."
xset s off         # Desactivar screen saver
xset -dpms         # Desactivar Energy Star
xset s noblank     # No apagar pantalla

# Ocultar cursor del mouse después de inactividad
unclutter -idle 0.5 -root &

# Iniciar Chromium en modo kiosko
echo "🚀 Iniciando Helen en modo kiosko..."
chromium-browser \
  --noerrdialogs \
  --disable-infobars \
  --disable-features=TranslateUI \
  --disable-suggestions-service \
  --disable-save-password-bubble \
  --disable-session-crashed-bubble \
  --disable-component-extensions-with-background-pages \
  --start-fullscreen \
  --kiosk \
  --ignore-certificate-errors \
  --allow-insecure-localhost \
  --unsafely-treat-insecure-origin-as-secure="$HELEN_URL" \
  --use-fake-ui-for-media-stream \
  --autoplay-policy=no-user-gesture-required \
  "$HELEN_URL" &

echo "✅ Helen iniciado en modo kiosko"
