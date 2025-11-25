"""
Live Model Testing Script for Helen Gesture Recognition

Opens the camera, detects gestures, and displays predictions with confidence level.
All documentation and comments are in professional English. No emojis.
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
    Class for real-time testing of the gesture recognition model.
    Handles camera input, gesture detection, and prediction display.
    """

    def __init__(self, model_path: Path, gestures_map_path: Path, norm_stats_path: Path):
        """
        Initialize the live gesture tester.

        Args:
            model_path (Path): Path to the trained model (.pth).
            gestures_map_path (Path): Path to the gesture mapping (gestures_map.json).
            norm_stats_path (Path): Path to normalization statistics (.pth).
        """
        self.model_path = Path(model_path)
        self.gestures_map_path = Path(gestures_map_path)
        self.norm_stats_path = Path(norm_stats_path)
        
        # Load gesture mapping
        with open(self.gestures_map_path, 'r') as f:
            self.gestures_map = json.load(f)

        # Invert mapping to get gesture name by ID
        self.id_to_gesture = {v: k for k, v in self.gestures_map.items()}

        # Load normalization statistics
        norm_stats = torch.load(self.norm_stats_path, map_location='cpu')
        self.mean = norm_stats['mean']
        self.std = norm_stats['std']

        # Load model
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = GestureNet(output_size=len(self.gestures_map)).to(self.device)
        self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
        self.model.eval()

        # Initialize MediaPipe
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils

        # Sequence buffer
        self.seq_length = 40
        self.frame_buffer = []

        # Timing control
        self.last_prediction_time = 0
        self.prediction_delay = 2.0  # seconds

        print(f"\n{'='*70}")
        print(f"Model loaded successfully.")
        print(f"Device: {self.device}")
        print(f"Available gestures: {list(self.gestures_map.keys())}")
        print(f"Prediction delay: {self.prediction_delay}s")
        print(f"{'='*70}\n")
    
    def extract_landmarks_from_frame(self, frame):
        """
        Extract hand landmarks from a frame using MediaPipe.

        Args:
            frame (np.ndarray): Input video frame.

        Returns:
            np.ndarray or None: Vector of 126 features, or None if no hands detected.
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
        Make a prediction given a sequence of hand landmarks.

        Args:
            sequence (np.ndarray): Array of shape (seq_length, 126).

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
        gesture_name = self.id_to_gesture.get(predicted_id, "Unknown")
        return gesture_name, confidence_value
    
    def run(self):
        """
        Run the main loop for live gesture testing.
        Opens the camera, processes frames, and displays predictions.
        """
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("Error: Could not open the camera.")
            return

        print("Camera started. Press 'q' to exit.\n")
        
        current_prediction = None
        current_confidence = 0.0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Failed to capture frame.")
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
                        print(f"Prediction: {gesture.upper()}")
                        print(f"Confidence: {confidence*100:.2f}%")
                        print(f"{'='*70}\n")
                        
                        self.last_prediction_time = current_time
            
            # Display prediction on frame
            if current_prediction:
                text = f"{current_prediction}: {current_confidence*100:.1f}%"
                cv2.putText(
                    frame, text, (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2
                )

            # Display frame buffer count
            buffer_text = f"Buffer: {len(self.frame_buffer)}/{self.seq_length}"
            cv2.putText(
                frame, buffer_text, (10, frame.shape[0] - 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2
            )

            # Display time remaining for next prediction
            if len(self.frame_buffer) == self.seq_length:
                time_remaining = max(0, self.prediction_delay - (current_time - self.last_prediction_time))
                timer_text = f"Next: {time_remaining:.1f}s"
                cv2.putText(
                    frame, timer_text, (10, frame.shape[0] - 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2
                )

            # Show frame
            cv2.imshow('Helen - Live Test (Press Q to exit)', frame)

            # Exit with 'q'
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("\nClosing live test...")
                break

        cap.release()
        cv2.destroyAllWindows()
        self.hands.close()


def main():
    """
    Main function to run the live gesture test.
    Sets default paths and checks for required files.
    """
    # Default paths (adjust as needed)
    model_path = Path("trained_models/model_final.pth")
    gestures_map_path = Path("data/gestures_map.json")
    norm_stats_path = Path("trained_models/normalization_stats.pth")

    # Check that required files exist
    if not model_path.exists():
        print(f"Error: Model not found at {model_path}")
        return

    if not gestures_map_path.exists():
        print(f"Error: gestures_map.json not found at {gestures_map_path}")
        return

    if not norm_stats_path.exists():
        print(f"Error: normalization_stats.pth not found at {norm_stats_path}")
        return

    # Create tester and run
    tester = LiveGestureTester(model_path, gestures_map_path, norm_stats_path)
    tester.run()


if __name__ == "__main__":
    main()
