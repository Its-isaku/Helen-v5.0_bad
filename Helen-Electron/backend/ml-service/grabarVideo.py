from pathlib import Path
import cv2
import os
import time
import sys

# --- Configuración del dataset ---
# El gesto y la ruta base se pasan como argumentos desde train.py
if len(sys.argv) < 3:
    print("❌ Error: Uso correcto: python grabarVideo.py <nombre_gesto> <ruta_dataset>")
    print("   Ejemplo: python grabarVideo.py hola ./dataset_gestos")
    sys.exit(1)

gesto = sys.argv[1].lower()  # nombre del gesto (desde línea de comandos)
ruta_base = Path(sys.argv[2])  # ruta al dataset (desde línea de comandos)
ruta_gesto = ruta_base / gesto

# Crear carpeta si no existe
ruta_gesto.mkdir(parents=True, exist_ok=True)

# Configurar cámara
cap = cv2.VideoCapture(0)
fps = 20.0
duracion = 3  # segundos
ancho, alto = int(cap.get(3)), int(cap.get(4))

print(f"\n🎥 Grabando videos del gesto '{gesto.upper()}'")
print(f"📁 Guardando en: {ruta_gesto}")
print("Presiona 's' para grabar un nuevo clip (3 segundos).")
print("Presiona 'q' para salir.\n")

contador = len(list(ruta_gesto.iterdir())) + 1  # continua numerando

while True:
    ret, frame = cap.read()
    if not ret:
        break

    cv2.imshow(f"Grabador de gesto '{gesto.upper()}'", frame)
    tecla = cv2.waitKey(1) & 0xFF

    if tecla == ord('s'):
        nombre_video = ruta_gesto / f"{gesto}_{contador}.mp4"
        print(f"🔴 Grabando video {contador}: {nombre_video}")
        out = cv2.VideoWriter(str(nombre_video), cv2.VideoWriter_fourcc(*'mp4v'), fps, (ancho, alto))
        
        inicio = time.time()
        while time.time() - inicio < duracion:
            ret, frame = cap.read()
            if not ret:
                break
            out.write(frame)
            cv2.imshow("Grabando...", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        out.release()
        print("✅ Clip guardado.\n")
        contador += 1

    elif tecla == ord('q'):
        print(f"\n✅ Grabación finalizada. Total de videos: {contador - 1}")
        break

cap.release()
cv2.destroyAllWindows()
