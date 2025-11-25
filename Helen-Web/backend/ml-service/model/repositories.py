"""
Concrete Repository Implementations for Helen Gesture Model (SOLID Principles).

Each class has a single, well-defined responsibility.

All documentation and comments are in English for professional standards.
"""

from pathlib import Path
from typing import Dict, Tuple
import json
import numpy as np
import torch
from .interfaces import IDataLoader, IModelSaver, IGestureRepository


class FileDataLoader(IDataLoader):
    """
    Loads data from .npy files (Single Responsibility Principle).

    Responsible only for reading data from the file system.
    """

    def __init__(self, base_dir: Path):
        """
        Initialize the data loader with the base directory.

        Args:
            base_dir (Path): Directory containing X_data.npy and Y_labels.npy.
        """
        self.base_dir = Path(base_dir)
        self.x_data_path = self.base_dir / "X_data.npy"
        self.y_labels_path = self.base_dir / "Y_labels.npy"

    def load_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Load X_data.npy and Y_labels.npy from disk.

        Returns:
            tuple: (X_data, Y_labels) as numpy arrays.
        """
        if not self.data_exists():
            raise FileNotFoundError(
                f"No data found in {self.base_dir}. "
                "Run data_prep.py first."
            )
        X = np.load(self.x_data_path)
        Y = np.load(self.y_labels_path)
        return X, Y

    def data_exists(self) -> bool:
        """
        Check that both data files exist.

        Returns:
            bool: True if both files exist, False otherwise.
        """
        return self.x_data_path.exists() and self.y_labels_path.exists()


class TorchModelSaver(IModelSaver):
    """
    Saves and loads PyTorch models (Single Responsibility Principle).

    Handles only model and statistics persistence.
    """

    def save_model(self, model: torch.nn.Module, path: Path) -> None:
        """
        Save the model's state_dict to disk.

        Args:
            model (torch.nn.Module): The trained model.
            path (Path): Path to save the model.
        """
        torch.save(model.state_dict(), path)

    def load_model(self, model: torch.nn.Module, path: Path) -> torch.nn.Module:
        """
        Load the state_dict into an existing model instance.

        Args:
            model (torch.nn.Module): The model instance to load into.
            path (Path): Path to the saved model.

        Returns:
            torch.nn.Module: The loaded model.
        """
        model.load_state_dict(torch.load(path, map_location='cpu'))
        return model

    def save_normalization_stats(self, stats: Dict, path: Path) -> None:
        """
        Save normalization statistics (mean, std) to disk.

        Args:
            stats (dict): Normalization statistics.
            path (Path): Path to save the statistics.
        """
        torch.save(stats, path)


class JsonGestureRepository(IGestureRepository):
    """
    Manages the gesture mapping in JSON format (Single Responsibility Principle).

    Handles only CRUD operations for the gesture mapping.
    """

    def __init__(self, gestures_map_path: Path):
        """
        Initialize the repository with the path to the gestures map JSON file.

        Args:
            gestures_map_path (Path): Path to the gestures_map.json file.
        """
        self.gestures_map_path = Path(gestures_map_path)
        self._gestures_map = self._load()

    def _load(self) -> Dict[str, int]:
        """
        Internal method to load the gesture mapping from JSON.

        Returns:
            dict: Mapping of gesture names to IDs.
        """
        if self.gestures_map_path.exists():
            with open(self.gestures_map_path, 'r') as f:
                return json.load(f)
        return {}

    def load_gestures_map(self) -> Dict[str, int]:
        """
        Return the current gesture mapping.

        Returns:
            dict: Mapping of gesture names to IDs.
        """
        return self._gestures_map.copy()

    def save_gestures_map(self, gestures_map: Dict[str, int]) -> None:
        """
        Save the gesture mapping to JSON.

        Args:
            gestures_map (dict): Mapping of gesture names to IDs.
        """
        self._gestures_map = gestures_map
        with open(self.gestures_map_path, 'w') as f:
            json.dump(gestures_map, f, indent=2)

    def add_gesture(self, gesture_name: str) -> int:
        """
        Add a new gesture to the mapping and return its ID.

        Args:
            gesture_name (str): Name of the gesture to add.

        Returns:
            int: Assigned gesture ID.
        """
        if gesture_name in self._gestures_map:
            return self._gestures_map[gesture_name]
        new_id = len(self._gestures_map)
        self._gestures_map[gesture_name] = new_id
        self.save_gestures_map(self._gestures_map)
        return new_id

    def get_gesture_count(self) -> int:
        """
        Return the number of registered gestures.

        Returns:
            int: Number of gestures.
        """
        return len(self._gestures_map)

    def gesture_exists(self, gesture_name: str) -> bool:
        """
        Check if a gesture already exists in the mapping.

        Args:
            gesture_name (str): Name of the gesture to check.

        Returns:
            bool: True if gesture exists, False otherwise.
        """
        return gesture_name in self._gestures_map

    def get_gesture_id(self, gesture_name: str) -> int:
        """
        Get the ID of a gesture.

        Args:
            gesture_name (str): Name of the gesture.

        Returns:
            int: Gesture ID, or -1 if not found.
        """
        return self._gestures_map.get(gesture_name, -1)
