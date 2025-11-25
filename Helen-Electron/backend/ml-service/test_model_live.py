"""
Script para Probar el Modelo en Tiempo Real
Abre la cámara, detecta gestos y muestra predicciones con nivel de confianza
"""

import cv2
import torch
import numpy as np
import mediapipe as mp
import json
import time
from pathlib import Path
from model.model import GestureNet


class LiveGestureTester:
    """
    Clase para probar el modelo de reconocimiento de gestos en tiempo real
    """
    
    def __init__(self, model_path: Path, gestures_map_path: Path, norm_stats_path: Path):
        """
        Args:
            model_path: Ruta al modelo entrenado (.pth)
            gestures_map_path: Ruta al mapeo de gestos (gestures_map.json)
            norm_stats_path: Ruta a las estadísticas de normalización (.pth)
        """
        self.model_path = Path(model_path)
        self.gestures_map_path = Path(gestures_map_path)
        self.norm_stats_path = Path(norm_stats_path)
        
        # Cargar mapeo de gestos
        with open(self.gestures_map_path, 'r') as f:
            self.gestures_map = json.load(f)
        
        # Invertir el mapeo para obtener nombre por ID
        self.id_to_gesture = {v: k for k, v in self.gestures_map.items()}
        
        # Cargar estadísticas de normalización
        norm_stats = torch.load(self.norm_stats_path, map_location='cpu')
        self.mean = norm_stats['mean']
        self.std = norm_stats['std']
        
        # Cargar modelo
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = GestureNet(output_size=len(self.gestures_map)).to(self.device)
        self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
        self.model.eval()
        
        # Inicializar MediaPipe
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Buffer para secuencias
        self.seq_length = 40
        self.frame_buffer = []
        
        # Control de tiempo
        self.last_prediction_time = 0
        self.prediction_delay = 2.0  # segundos
        
        print(f"\n{'='*70}")
        print(f"✅ Modelo cargado exitosamente")
        print(f"📊 Dispositivo: {self.device}")
        print(f"🎯 Gestos disponibles: {list(self.gestures_map.keys())}")
        print(f"⏱️  Delay entre predicciones: {self.prediction_delay}s")
        print(f"{'='*70}\n")
    
    def extract_landmarks_from_frame(self, frame):
        """
        Extrae landmarks de un frame usando MediaPipe
        
        Returns:
            np.array: Vector de 126 features o None si no detecta manos
        """
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(frame_rgb)
        
        if results.multi_hand_landmarks:
            # Preparar placeholders para left/right
            left_vec = np.zeros(63, dtype=np.float32)
            right_vec = np.zeros(63, dtype=np.float32)
            
            handedness = None
            if hasattr(results, 'multi_handedness') and results.multi_handedness:
                handedness = [h.classification[0].label for h in results.multi_handedness]
            
            # Iterar por las manos detectadas
            for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                points = np.array(
                    [[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark], 
                    dtype=np.float32
                ).flatten()
                
                assigned = False
                # Intentar asignar por handedness
                if handedness and idx < len(handedness):
                    label = handedness[idx].lower()
                    if 'left' in label:
                        left_vec = points
                        assigned = True
                    elif 'right' in label:
                        right_vec = points
                        assigned = True
                
                # Fallback: usar posición x
                if not assigned:
                    try:
                        wrist_x = points[0]
                        if wrist_x < 0.5:
                            left_vec = points
                        else:
                            right_vec = points
                    except Exception:
                        if np.all(left_vec == 0):
                            left_vec = points
                        else:
                            right_vec = points
            
            # Concatenar left + right
            combined = np.concatenate([left_vec, right_vec])
            return combined
        
        return None
    
    def predict(self, sequence):
        """
        Hace una predicción dado una secuencia de landmarks
        
        Args:
            sequence: np.array de shape (seq_length, 126)
            
        Returns:
            tuple: (gesture_name, confidence)
        """
        # Normalizar
        sequence_tensor = torch.FloatTensor(sequence).unsqueeze(0)  # (1, seq_length, 126)
        sequence_tensor = (sequence_tensor - self.mean) / self.std
        sequence_tensor = sequence_tensor.to(self.device)
        
        # Predecir
        with torch.no_grad():
            output = self.model(sequence_tensor)
            probabilities = torch.softmax(output, dim=1)
            confidence, predicted_class = torch.max(probabilities, 1)
        
        predicted_id = predicted_class.item()
        confidence_value = confidence.item()
        gesture_name = self.id_to_gesture.get(predicted_id, "Desconocido")
        
        return gesture_name, confidence_value
    
    def run(self):
        """
        Ejecuta el loop principal de testing en vivo
        """
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("❌ Error: No se pudo abrir la cámara")
            return
        
        print("🎥 Cámara iniciada. Presiona 'q' para salir.\n")
        
        current_prediction = None
        current_confidence = 0.0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Error al capturar frame")
                break
            
            # Extraer landmarks
            landmarks = self.extract_landmarks_from_frame(frame)
            
            if landmarks is not None:
                # Agregar al buffer
                self.frame_buffer.append(landmarks)
                
                # Mantener solo los últimos seq_length frames
                if len(self.frame_buffer) > self.seq_length:
                    self.frame_buffer.pop(0)
                
                # Si tenemos suficientes frames y ha pasado el delay
                current_time = time.time()
                if len(self.frame_buffer) == self.seq_length:
                    if current_time - self.last_prediction_time >= self.prediction_delay:
                        # Hacer predicción
                        sequence = np.array(self.frame_buffer)
                        gesture, confidence = self.predict(sequence)
                        
                        current_prediction = gesture
                        current_confidence = confidence
                        
                        # Mostrar en terminal
                        print(f"\n{'='*70}")
                        print(f"🎯 Predicción: {gesture.upper()}")
                        print(f"📊 Confianza: {confidence*100:.2f}%")
                        print(f"{'='*70}\n")
                        
                        self.last_prediction_time = current_time
            
            # Mostrar predicción en frame
            if current_prediction:
                text = f"{current_prediction}: {current_confidence*100:.1f}%"
                cv2.putText(
                    frame, text, (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2
                )
            
            # Mostrar contador de frames en buffer
            buffer_text = f"Buffer: {len(self.frame_buffer)}/{self.seq_length}"
            cv2.putText(
                frame, buffer_text, (10, frame.shape[0] - 20), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2
            )
            
            # Mostrar tiempo restante para próxima predicción
            if len(self.frame_buffer) == self.seq_length:
                time_remaining = max(0, self.prediction_delay - (current_time - self.last_prediction_time))
                timer_text = f"Proxima: {time_remaining:.1f}s"
                cv2.putText(
                    frame, timer_text, (10, frame.shape[0] - 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2
                )
            
            # Mostrar frame
            cv2.imshow('Helen - Test en Vivo (Presiona Q para salir)', frame)
            
            # Salir con 'q'
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("\n✅ Cerrando test en vivo...")
                break
        
        cap.release()
        cv2.destroyAllWindows()
        self.hands.close()


def main():
    """
    Función principal para ejecutar el test en vivo
    """
    # Rutas por defecto (ajustar según tu estructura)
    model_path = Path("trained_models/model_final.pth")
    gestures_map_path = Path("data/gestures_map.json")
    norm_stats_path = Path("trained_models/normalization_stats.pth")
    
    # Verificar que existan los archivos
    if not model_path.exists():
        print(f"❌ Error: No se encontró el modelo en {model_path}")
        return
    
    if not gestures_map_path.exists():
        print(f"❌ Error: No se encontró gestures_map.json en {gestures_map_path}")
        return
    
    if not norm_stats_path.exists():
        print(f"❌ Error: No se encontró normalization_stats.pth en {norm_stats_path}")
        return
    
    # Crear tester y ejecutar
    tester = LiveGestureTester(model_path, gestures_map_path, norm_stats_path)
    tester.run()


if __name__ == "__main__":
    main()
