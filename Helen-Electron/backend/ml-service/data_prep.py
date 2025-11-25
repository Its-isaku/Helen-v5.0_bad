"""
Módulo de Preparación de Datos para Entrenamiento
Procesa videos de gestos y extrae secuencias de landmarks estandarizadas
"""

from pathlib import Path
import cv2
import mediapipe as mp
import numpy as np
import json
from tqdm import tqdm


class DataPreparator:
    """
    Prepara datos de videos de gestos para entrenamiento
    - Extrae landmarks con MediaPipe
    - Estandariza longitud de secuencias (padding/truncate)
    - Genera mapeo de gestos dinámico
    """
    
    def __init__(self, dataset_path, seq_length=40, min_detection_confidence=0.5):
        """
        Args:
            dataset_path (str/Path): Ruta al directorio con carpetas de gestos
            seq_length (int): Longitud fija de secuencias (frames)
            min_detection_confidence (float): Confianza mínima de MediaPipe
        """
        self.dataset_path = Path(dataset_path)
        self.seq_length = seq_length
        self.min_detection_confidence = min_detection_confidence
        
        # Inicializar MediaPipe Hands
        self.mp_hands = mp.solutions.hands
        # Configurar MediaPipe para detectar hasta 2 manos (queremos usar SIEMPRE 2 manos)
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=min_detection_confidence
        )
        
        # Almacenar datos procesados
        self.X_data = []  # Secuencias de landmarks
        self.Y_labels = []  # Etiquetas numéricas
        self.gestures_map = {}  # {nombre_gesto: id_numerico}
        
    def scan_dataset(self):
        """
        Escanea el directorio dataset_gestos y crea el mapeo de gestos
        Estructura esperada:
        dataset_gestos/
        ├── inicio/
        │   ├── inicio_1.mp4
        │   ├── inicio_2.mp4
        ├── clima/
        │   ├── clima_1.mp4
        """
        if not self.dataset_path.exists():
            raise FileNotFoundError(f"Dataset no encontrado: {self.dataset_path}")
        
        gesture_folders = [f for f in self.dataset_path.iterdir() if f.is_dir()]
        
        if not gesture_folders:
            raise ValueError(f"No se encontraron carpetas de gestos en {self.dataset_path}")
        
        # Crear mapeo automático (ordenado alfabéticamente para consistencia)
        gesture_folders.sort()
        self.gestures_map = {folder.name: idx for idx, folder in enumerate(gesture_folders)}
        
        print(f"\n📁 Gestos encontrados: {len(self.gestures_map)}")
        for gesture, idx in self.gestures_map.items():
            videos = list((self.dataset_path / gesture).glob("*.mp4"))
            print(f"  {idx}: {gesture} ({len(videos)} videos)")
        
        return self.gestures_map
    
    def extract_landmarks_from_video(self, video_path):
        """
        Extrae landmarks de un video frame por frame
        
        Args:
            video_path (Path): Ruta al video
            
        Returns:
            np.array: Array de landmarks con forma (n_frames, 63) o None si falla
        """
        cap = cv2.VideoCapture(str(video_path))
        landmarks_sequence = []
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convertir a RGB para MediaPipe
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.hands.process(frame_rgb)
            
            # Extraer landmarks SIEMPRE como vector combinado de 2 manos (left, right)
            # Por cada frame construiremos un vector de 126 features: [handA(63), handB(63)]
            # Si falta alguna mano se rellenará con ceros para mantener consistencia.
            if results.multi_hand_landmarks:
                # Preparar placeholders para left/right según MediaPipe (si está disponible)
                left_vec = np.zeros(63, dtype=np.float32)
                right_vec = np.zeros(63, dtype=np.float32)

                # Si MediaPipe devuelve información de handedness, la usamos para asignar
                handedness = None
                if hasattr(results, 'multi_handedness') and results.multi_handedness:
                    handedness = [h.classification[0].label for h in results.multi_handedness]

                # Iterar por las manos detectadas y asignar a left/right
                for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                    points = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark], dtype=np.float32).flatten()

                    assigned = False
                    # Intentar asignar por handedness si está disponible
                    if handedness and idx < len(handedness):
                        label = handedness[idx].lower()
                        if 'left' in label:
                            left_vec = points
                            assigned = True
                        elif 'right' in label:
                            right_vec = points
                            assigned = True

                    # Si no se asignó por handedness, usar posición horizontal (x del primer landmark)
                    if not assigned:
                        try:
                            wrist_x = points[0]  # x del primer landmark (wrist)
                            # mano con menor x es la izquierda en la imagen
                            if wrist_x < 0.5:
                                left_vec = points
                            else:
                                right_vec = points
                        except Exception:
                            # Fallback simple: si left está vacío poner ahí
                            if np.all(left_vec == 0):
                                left_vec = points
                            else:
                                right_vec = points

                # Concatenar left + right (orden fijo) -> 126 features
                combined = np.concatenate([left_vec, right_vec])
                landmarks_sequence.append(combined)
            
        cap.release()
        
        if len(landmarks_sequence) == 0:
            return None
        
        return np.array(landmarks_sequence)
    
    def standardize_sequence(self, sequence):
        """
        Estandariza la longitud de la secuencia mediante padding o truncamiento
        
        Args:
            sequence (np.array): Secuencia original con forma (n_frames, 63)
            
        Returns:
            np.array: Secuencia estandarizada con forma (seq_length, 63)
        """
        n_frames = sequence.shape[0]
        
        if n_frames == self.seq_length:
            # Ya tiene la longitud correcta
            return sequence
        
        elif n_frames > self.seq_length:
            # Truncar: tomar frames uniformemente distribuidos
            indices = np.linspace(0, n_frames - 1, self.seq_length, dtype=int)
            return sequence[indices]
        
        else:
            # Padding: repetir el último frame
            padding_needed = self.seq_length - n_frames
            last_frame = sequence[-1:]
            padding = np.repeat(last_frame, padding_needed, axis=0)
            return np.vstack([sequence, padding])
    
    def process_dataset(self):
        """
        Procesa todos los videos del dataset y genera X_data, Y_labels
        """
        print(f"\n🔄 Procesando dataset...")
        
        # Escanear gestos
        self.scan_dataset()
        
        # Procesar cada gesto
        for gesture_name, label in self.gestures_map.items():
            gesture_folder = self.dataset_path / gesture_name
            video_files = list(gesture_folder.glob("*.mp4"))
            
            print(f"\n📹 Procesando '{gesture_name}' ({len(video_files)} videos)...")
            
            for video_path in tqdm(video_files, desc=f"  {gesture_name}"):
                # Extraer landmarks
                sequence = self.extract_landmarks_from_video(video_path)
                
                if sequence is None:
                    print(f"  ⚠️  Sin landmarks detectados: {video_path.name}")
                    continue
                
                # Estandarizar longitud
                standardized_seq = self.standardize_sequence(sequence)
                
                # Guardar
                self.X_data.append(standardized_seq)
                self.Y_labels.append(label)
        
        # Convertir a numpy arrays
        self.X_data = np.array(self.X_data)
        self.Y_labels = np.array(self.Y_labels)
        
        print(f"\n✅ Procesamiento completo!")
        print(f"  📊 Shape de X: {self.X_data.shape}")
        print(f"  📊 Shape de Y: {self.Y_labels.shape}")
        print(f"  🎯 Distribución de clases:")
        
        for gesture, label in self.gestures_map.items():
            count = np.sum(self.Y_labels == label)
            print(f"    {label}: {gesture} = {count} muestras")
        
        return self.X_data, self.Y_labels
    
    def save_data(self, output_dir):
        """
        Guarda los datos procesados y el mapeo de gestos
        
        Args:
            output_dir (str/Path): Directorio de salida
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Guardar datos
        np.save(output_dir / "X_data.npy", self.X_data)
        np.save(output_dir / "Y_labels.npy", self.Y_labels)
        
        # Guardar mapeo de gestos
        with open(output_dir / "gestures_map.json", 'w') as f:
            json.dump(self.gestures_map, f, indent=2)
        
        print(f"\n💾 Datos guardados en: {output_dir}")
        print(f"  ✓ X_data.npy")
        print(f"  ✓ Y_labels.npy")
        print(f"  ✓ gestures_map.json")
    
    def __del__(self):
        """Liberar recursos de MediaPipe al finalizar"""
        if hasattr(self, 'hands'):
            self.hands.close()


def load_and_process_data(dataset_path, output_dir, seq_length=40):
    """
    Función conveniente para cargar y procesar datos
    
    Args:
        dataset_path (str): Ruta al dataset
        output_dir (str): Ruta de salida
        seq_length (int): Longitud de secuencias
        
    Returns:
        tuple: (X_data, Y_labels, gestures_map)
    """
    preparator = DataPreparator(dataset_path, seq_length=seq_length)
    X_data, Y_labels = preparator.process_dataset()
    preparator.save_data(output_dir)
    
    return X_data, Y_labels, preparator.gestures_map


if __name__ == "__main__":
    # Ejemplo de uso
    import argparse
    
    parser = argparse.ArgumentParser(description='Preparar datos de gestos')
    parser.add_argument('--dataset', type=str, required=True,
                      help='Ruta al directorio dataset_gestos')
    parser.add_argument('--output', type=str, default='.',
                      help='Directorio de salida (default: directorio actual)')
    parser.add_argument('--seq-length', type=int, default=40,
                      help='Longitud de secuencias (default: 40)')
    
    args = parser.parse_args()
    
    print("🚀 Iniciando preparación de datos...")
    load_and_process_data(args.dataset, args.output, args.seq_length)
    print("\n✅ Proceso completado!")
