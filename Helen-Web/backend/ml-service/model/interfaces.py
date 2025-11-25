"""
Base Interfaces and Abstractions for Helen Gesture Model (SOLID Principles).

Defines contracts that concrete implementations must follow, supporting Interface Segregation and Dependency Inversion.

All documentation and comments are in English for professional standards.
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Tuple, Optional
import numpy as np
import torch


class IDataLoader(ABC):
    """
    Interface for data loading (Interface Segregation Principle).

    Any data loading implementation must follow this contract.
    """

    @abstractmethod
    def load_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Load training data.

        Returns:
            tuple: (X_data, Y_labels) as numpy arrays.
        """
        pass

    @abstractmethod
    def data_exists(self) -> bool:
        """
        Check if training data is available.

        Returns:
            bool: True if data exists, False otherwise.
        """
        pass


class IModelSaver(ABC):
    """
    Interface for model persistence (Interface Segregation Principle).

    Separates the responsibility of saving/loading from training logic.
    """

    @abstractmethod
    def save_model(self, model: torch.nn.Module, path: Path) -> None:
        """
        Save a trained model to disk.

        Args:
            model (torch.nn.Module): The trained model.
            path (Path): Path to save the model.
        """
        pass

    @abstractmethod
    def load_model(self, model: torch.nn.Module, path: Path) -> torch.nn.Module:
        """
        Load a model from disk into an existing model instance.

        Args:
            model (torch.nn.Module): The model instance to load into.
            path (Path): Path to the saved model.

        Returns:
            torch.nn.Module: The loaded model.
        """
        pass

    @abstractmethod
    def save_normalization_stats(self, stats: Dict, path: Path) -> None:
        """
        Save normalization statistics (e.g., mean, std) to disk.

        Args:
            stats (dict): Normalization statistics.
            path (Path): Path to save the statistics.
        """
        pass


class IGestureRepository(ABC):
    """
    Interface for gesture mapping management (Single Responsibility Principle).

    Handles only the storage and retrieval of the gesture mapping.
    """

    @abstractmethod
    def load_gestures_map(self) -> Dict[str, int]:
        """
        Load the gesture mapping from storage.

        Returns:
            dict: Mapping of gesture names to IDs.
        """
        pass

    @abstractmethod
    def save_gestures_map(self, gestures_map: Dict[str, int]) -> None:
        """
        Save the gesture mapping to storage.

        Args:
            gestures_map (dict): Mapping of gesture names to IDs.
        """
        pass

    @abstractmethod
    def add_gesture(self, gesture_name: str) -> int:
        """
        Add a new gesture and return its ID.

        Args:
            gesture_name (str): Name of the gesture to add.

        Returns:
            int: Assigned gesture ID.
        """
        pass

    @abstractmethod
    def get_gesture_count(self) -> int:
        """
        Return the number of registered gestures.

        Returns:
            int: Number of gestures.
        """
        pass


class ITrainingStrategy(ABC):
    """
    Interface for training strategies (Strategy Pattern, Open/Closed Principle).

    Allows different training strategies without modifying existing code.
    """

    @abstractmethod
    def train(
        self,
        model: torch.nn.Module,
        train_loader: torch.utils.data.DataLoader,
        val_loader: torch.utils.data.DataLoader,
        epochs: int,
        device: torch.device
    ) -> Dict[str, float]:
        """
        Execute the training process.

        Args:
            model (torch.nn.Module): Model to train.
            train_loader (DataLoader): Training data loader.
            val_loader (DataLoader): Validation data loader.
            epochs (int): Number of training epochs.
            device (torch.device): Device to use for training.

        Returns:
            dict: Final training metrics.
        """
        pass


class IUserInterface(ABC):
    """
    Interface for the user interface (Dependency Inversion Principle).

    Business logic does not depend on the concrete UI implementation.
    """

    @abstractmethod
    def show_menu(self) -> str:
        """
        Display the main menu and return the selected option.

        Returns:
            str: Selected menu option.
        """
        pass

    @abstractmethod
    def get_training_params(self) -> Dict[str, any]:
        """
        Get training parameters from the user.

        Returns:
            dict: Training parameters.
        """
        pass

    @abstractmethod
    def get_gesture_info(self) -> Tuple[str, str]:
        """
        Get the name and dataset path for a new gesture from the user.

        Returns:
            tuple: (gesture_name, dataset_path)
        """
        pass

    @abstractmethod
    def show_message(self, message: str, message_type: str = "info") -> None:
        """
        Display a message to the user.

        Args:
            message (str): The message to display.
            message_type (str): Type of message (e.g., 'info', 'error').
        """
        pass

    @abstractmethod
    def show_progress(self, current: int, total: int, metrics: Dict) -> None:
        """
        Display training progress to the user.

        Args:
            current (int): Current epoch or step.
            total (int): Total epochs or steps.
            metrics (dict): Progress metrics.
        """
        pass

    @abstractmethod
    def show_gestures(self, gestures_map: Dict[str, int]) -> None:
        """
        Display the registered gestures to the user.

        Args:
            gestures_map (dict): Mapping of gesture names to IDs.
        """
        pass
