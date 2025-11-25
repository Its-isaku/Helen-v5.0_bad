
"""
Data Preparation Module for Helen Gesture Model Training.

Processes gesture videos and extracts standardized landmark sequences for model training.

Dependencies:
    - cv2: Video processing
    - mediapipe: Hand landmark extraction
    - numpy: Array operations
    - tqdm: Progress bars
    - pathlib, json: File and data management

Notes:
    - All documentation and comments are in English for professional standards.
    - This script is used to prepare datasets for gesture recognition model training.
"""

from pathlib import Path
import cv2
import mediapipe as mp
import numpy as np
import json
from tqdm import tqdm



###############################################################################
# Data Preparation Class
###############################################################################

class DataPreparator:
    """
    Prepares gesture video data for model training.

    - Extracts hand landmarks using MediaPipe
    - Standardizes sequence length (padding/truncation)
    - Generates dynamic gesture mapping
    """

    def __init__(self, dataset_path, seq_length=40, min_detection_confidence=0.5):
        """
        Initialize the data preparator.

        Args:
            dataset_path (str or Path): Path to the directory containing gesture folders.
            seq_length (int): Fixed sequence length (frames).
            min_detection_confidence (float): Minimum MediaPipe detection confidence.
        """
        self.dataset_path = Path(dataset_path)
        self.seq_length = seq_length
        self.min_detection_confidence = min_detection_confidence
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=min_detection_confidence
        )
        self.X_data = []  # Sequences of landmarks
        self.Y_labels = []  # Numeric labels
        self.gestures_map = {}  # {gesture_name: numeric_id}

    def scan_dataset(self):
        """
        Scan the dataset directory and create the gesture mapping.

        Expected structure:
            dataset_gestos/
                gesture1/
                    video1.mp4
                    ...
                gesture2/
                    ...

        Returns:
            dict: Mapping of gesture names to numeric IDs.
        """
        if not self.dataset_path.exists():
            raise FileNotFoundError(f"Dataset not found: {self.dataset_path}")
        gesture_folders = [f for f in self.dataset_path.iterdir() if f.is_dir()]
        if not gesture_folders:
            raise ValueError(f"No gesture folders found in {self.dataset_path}")
        gesture_folders.sort()
        self.gestures_map = {folder.name: idx for idx, folder in enumerate(gesture_folders)}
        print(f"\nGestures found: {len(self.gestures_map)}")
        for gesture, idx in self.gestures_map.items():
            videos = list((self.dataset_path / gesture).glob("*.mp4"))
            print(f"  {idx}: {gesture} ({len(videos)} videos)")
        return self.gestures_map

    def extract_landmarks_from_video(self, video_path):
        """
        Extract hand landmarks from a video frame by frame.

        Args:
            video_path (Path): Path to the video file.

        Returns:
            np.array: Array of landmarks with shape (n_frames, 126) or None if failed.
        """
        cap = cv2.VideoCapture(str(video_path))
        landmarks_sequence = []
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.hands.process(frame_rgb)
            # Always extract as combined vector of 2 hands (left, right)
            # Each frame: 126 features [handA(63), handB(63)]
            # If a hand is missing, fill with zeros for consistency
            if results.multi_hand_landmarks:
                left_vec = np.zeros(63, dtype=np.float32)
                right_vec = np.zeros(63, dtype=np.float32)
                handedness = None
                if hasattr(results, 'multi_handedness') and results.multi_handedness:
                    handedness = [h.classification[0].label for h in results.multi_handedness]
                for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                    points = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark], dtype=np.float32).flatten()
                    assigned = False
                    if handedness and idx < len(handedness):
                        label = handedness[idx].lower()
                        if 'left' in label:
                            left_vec = points
                            assigned = True
                        elif 'right' in label:
                            right_vec = points
                            assigned = True
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
                combined = np.concatenate([left_vec, right_vec])
                landmarks_sequence.append(combined)
        cap.release()
        if len(landmarks_sequence) == 0:
            return None
        return np.array(landmarks_sequence)

    def standardize_sequence(self, sequence):
        """
        Standardize the sequence length by padding or truncation.

        Args:
            sequence (np.array): Original sequence with shape (n_frames, 63)

        Returns:
            np.array: Standardized sequence with shape (seq_length, 63)
        """
        n_frames = sequence.shape[0]
        if n_frames == self.seq_length:
            return sequence
        elif n_frames > self.seq_length:
            indices = np.linspace(0, n_frames - 1, self.seq_length, dtype=int)
            return sequence[indices]
        else:
            padding_needed = self.seq_length - n_frames
            last_frame = sequence[-1:]
            padding = np.repeat(last_frame, padding_needed, axis=0)
            return np.vstack([sequence, padding])

    def process_dataset(self):
        """
        Process all videos in the dataset and generate X_data, Y_labels.

        Returns:
            tuple: (X_data, Y_labels)
        """
        print(f"\nProcessing dataset...")
        self.scan_dataset()
        for gesture_name, label in self.gestures_map.items():
            gesture_folder = self.dataset_path / gesture_name
            video_files = list(gesture_folder.glob("*.mp4"))
            print(f"\nProcessing '{gesture_name}' ({len(video_files)} videos)...")
            for video_path in tqdm(video_files, desc=f"  {gesture_name}"):
                sequence = self.extract_landmarks_from_video(video_path)
                if sequence is None:
                    print(f"No landmarks detected: {video_path.name}")
                    continue
                standardized_seq = self.standardize_sequence(sequence)
                self.X_data.append(standardized_seq)
                self.Y_labels.append(label)
        self.X_data = np.array(self.X_data)
        self.Y_labels = np.array(self.Y_labels)
        print(f"\n Processing complete!")
        print(f"   X shape: {self.X_data.shape}")
        print(f"   Y shape: {self.Y_labels.shape}")
        print(f"   Class distribution:")
        for gesture, label in self.gestures_map.items():
            count = np.sum(self.Y_labels == label)
            print(f"    {label}: {gesture} = {count} samples")
        return self.X_data, self.Y_labels

    def save_data(self, output_dir):
        """
        Save processed data and gesture mapping.

        Args:
            output_dir (str or Path): Output directory.
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        np.save(output_dir / "X_data.npy", self.X_data)
        np.save(output_dir / "Y_labels.npy", self.Y_labels)
        with open(output_dir / "gestures_map.json", 'w') as f:
            json.dump(self.gestures_map, f, indent=2)
        print(f"\nData saved in: {output_dir}")
        print(f"  ✓ X_data.npy")
        print(f"  ✓ Y_labels.npy")
        print(f"  ✓ gestures_map.json")

    def __del__(self):
        """
        Release MediaPipe resources on deletion.
        """
        if hasattr(self, 'hands'):
            self.hands.close()



###############################################################################
# Convenience Function
###############################################################################

def load_and_process_data(dataset_path, output_dir, seq_length=40):
    """
    Convenience function to load and process gesture data.

    Args:
        dataset_path (str): Path to the dataset.
        output_dir (str): Output directory.
        seq_length (int): Sequence length.

    Returns:
        tuple: (X_data, Y_labels, gestures_map)
    """
    preparator = DataPreparator(dataset_path, seq_length=seq_length)
    X_data, Y_labels = preparator.process_dataset()
    preparator.save_data(output_dir)
    return X_data, Y_labels, preparator.gestures_map



###############################################################################
# Main Entrypoint
###############################################################################

if __name__ == "__main__":
    """
    Example usage for preparing gesture data from the command line.
    """
    import argparse
    parser = argparse.ArgumentParser(description='Prepare gesture data for Helen model training')
    parser.add_argument('--dataset', type=str, required=True,
                        help='Path to the gesture dataset directory')
    parser.add_argument('--output', type=str, default='.',
                        help='Output directory (default: current directory)')
    parser.add_argument('--seq-length', type=int, default=40,
                        help='Sequence length (default: 40)')
    args = parser.parse_args()
    print("Starting data preparation...")
    load_and_process_data(args.dataset, args.output, args.seq_length)
    print("\nProcess completed!")
