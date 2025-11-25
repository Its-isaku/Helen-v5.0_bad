
"""
Video Recording Utility for Helen Gesture Dataset Collection.

Records gesture videos using the webcam and saves them to a specified dataset directory.

Usage:
    python grabarVideo.py <gesture_name> <dataset_path>
    Example: python grabarVideo.py hello ./gesture_dataset

Arguments:
    gesture_name: Name of the gesture to record (used as folder and file prefix)
    dataset_path: Path to the base dataset directory

Notes:
    - All prompts and comments are in English for professional standards.
    - Each video clip is 3 seconds long and saved as .mp4.
    - Press 's' to record a new clip, 'q' to quit.
"""

from pathlib import Path
import cv2
import os
import time
import sys

###############################################################################
# Argument Parsing and Dataset Setup
###############################################################################

if len(sys.argv) < 3:
    print("Error: Usage: python grabarVideo.py <gesture_name> <dataset_path>")
    print("   Example: python grabarVideo.py hello ./gesture_dataset")
    sys.exit(1)

gesture = sys.argv[1].lower()  # Gesture name from command line
base_path = Path(sys.argv[2])  # Dataset path from command line
gesture_path = base_path / gesture

# Create gesture folder if it does not exist
gesture_path.mkdir(parents=True, exist_ok=True)

###############################################################################
# Camera Setup
###############################################################################

cap = cv2.VideoCapture(0)
fps = 20.0
duration = 3  # seconds
width, height = int(cap.get(3)), int(cap.get(4))

print(f"\nRecording videos for gesture '{gesture.upper()}'")
print(f"Saving to: {gesture_path}")
print("Press 's' to record a new 3-second clip.")
print("Press 'q' to quit.\n")

counter = len(list(gesture_path.iterdir())) + 1  # Continue numbering

###############################################################################
# Main Recording Loop
###############################################################################

while True:
    ret, frame = cap.read()
    if not ret:
        break

    cv2.imshow(f"Gesture Recorder '{gesture.upper()}'", frame)
    key = cv2.waitKey(1) & 0xFF

    if key == ord('s'):
        video_name = gesture_path / f"{gesture}_{counter}.mp4"
        print(f"🔴 Recording video {counter}: {video_name}")
        out = cv2.VideoWriter(str(video_name), cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))

        start_time = time.time()
        while time.time() - start_time < duration:
            ret, frame = cap.read()
            if not ret:
                break
            out.write(frame)
            cv2.imshow("Recording...", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        out.release()
        print("✅ Clip saved.\n")
        counter += 1

    elif key == ord('q'):
        print(f"\n✅ Recording finished. Total videos: {counter - 1}")
        break

cap.release()
cv2.destroyAllWindows()
