"""
Training Service Module (SOLID - Single Responsibility & Dependency Inversion)

Orchestrates model training without depending on concrete implementations.
All documentation and comments are in professional English.
"""

from pathlib import Path
from typing import Dict, Optional
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split
import numpy as np

from .interfaces import IDataLoader, IModelSaver, IGestureRepository, ITrainingStrategy
from .model import GestureNet


class StandardTrainingStrategy(ITrainingStrategy):
    """
    Standard training strategy using the Strategy Pattern.

    Allows changing the training strategy without modifying the main code.
    Optimized parameters (Random Search - 99.5% accuracy):
        - Learning Rate: 0.0005
    """

    def __init__(self, learning_rate: float = 0.0005):
        """
        Initialize the training strategy.

        Args:
            learning_rate (float): Learning rate for the optimizer.
        """
        self.learning_rate = learning_rate

    def train(
        self,
        model: torch.nn.Module,
        train_loader: DataLoader,
        val_loader: DataLoader,
        epochs: int,
        device: torch.device
    ) -> Dict[str, float]:
        """
        Execute standard training using the Adam optimizer.

        Args:
            model (torch.nn.Module): The model to train.
            train_loader (DataLoader): DataLoader for training data.
            val_loader (DataLoader): DataLoader for validation data.
            epochs (int): Number of training epochs.
            device (torch.device): Device to use for training.

        Yields:
            dict: Progress metrics for each epoch.

        Returns:
            dict: Final metrics including best validation accuracy, final losses, and accuracies.
        """
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=self.learning_rate)

        best_val_acc = 0.0
        metrics = {
            'best_val_acc': 0.0,
            'final_train_loss': 0.0,
            'final_train_acc': 0.0,
            'final_val_loss': 0.0,
            'final_val_acc': 0.0
        }

        for epoch in range(epochs):
            # Training phase
            model.train()
            train_loss = 0.0
            train_correct = 0
            train_total = 0

            for batch_x, batch_y in train_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)

                optimizer.zero_grad()
                outputs = model(batch_x)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()

                train_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                train_total += batch_y.size(0)
                train_correct += (predicted == batch_y).sum().item()

            train_loss /= len(train_loader)
            train_acc = train_correct / train_total

            # Validation phase
            model.eval()
            val_loss = 0.0
            val_correct = 0
            val_total = 0

            with torch.no_grad():
                for batch_x, batch_y in val_loader:
                    batch_x, batch_y = batch_x.to(device), batch_y.to(device)

                    outputs = model(batch_x)
                    loss = criterion(outputs, batch_y)

                    val_loss += loss.item()
                    _, predicted = torch.max(outputs.data, 1)
                    val_total += batch_y.size(0)
                    val_correct += (predicted == batch_y).sum().item()

            val_loss /= len(val_loader)
            val_acc = val_correct / val_total

            # Update best accuracy
            if val_acc > best_val_acc:
                best_val_acc = val_acc

            # Store metrics
            metrics['best_val_acc'] = best_val_acc
            metrics['final_train_loss'] = train_loss
            metrics['final_train_acc'] = train_acc
            metrics['final_val_loss'] = val_loss
            metrics['final_val_acc'] = val_acc

            # Yield progress for reporting (generator pattern)
            yield {
                'epoch': epoch + 1,
                'total_epochs': epochs,
                'train_loss': train_loss,
                'train_acc': train_acc,
                'val_loss': val_loss,
                'val_acc': val_acc,
                'best_val_acc': best_val_acc
            }

        return metrics


class ModelTrainingService:
    """
    Model Training Service (SOLID - Single Responsibility & Dependency Inversion).

    Responsibilities:
        - Prepare data for training
        - Coordinate the training process
        - Manage saving of the best model

    Does NOT:
        - Display UI
        - Read/write files directly (delegates to repositories)
    """

    def __init__(
        self,
        data_loader: IDataLoader,
        model_saver: IModelSaver,
        gesture_repo: IGestureRepository,
        training_strategy: ITrainingStrategy,
        device: Optional[torch.device] = None
    ):
        """
        Constructor with Dependency Injection (Dependency Inversion Principle).
        Depends on interfaces, not concrete implementations.

        Args:
            data_loader (IDataLoader): Data loader interface.
            model_saver (IModelSaver): Model saver interface.
            gesture_repo (IGestureRepository): Gesture repository interface.
            training_strategy (ITrainingStrategy): Training strategy interface.
            device (torch.device, optional): Device to use for training.
        """
        self.data_loader = data_loader
        self.model_saver = model_saver
        self.gesture_repo = gesture_repo
        self.training_strategy = training_strategy
        self.device = device or torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    def prepare_data(
        self,
        validation_split: float = 0.2,
        batch_size: int = 16
    ) -> tuple:
        """
        Prepare data for model training.

        Args:
            validation_split (float): Fraction of data to use for validation.
            batch_size (int): Batch size for DataLoaders.

        Returns:
            tuple: (train_loader, val_loader, n_classes, norm_stats)
                - train_loader (DataLoader): Training data loader
                - val_loader (DataLoader): Validation data loader
                - n_classes (int): Number of gesture classes
                - norm_stats (dict): Normalization statistics (mean, std)
        """
        # Load data using the repository
        X, Y = self.data_loader.load_training_data()

        # Convert to tensors
        X_tensor = torch.FloatTensor(X)
        Y_tensor = torch.LongTensor(Y)

        # Normalization
        mean = X_tensor.mean(dim=(0, 1), keepdim=True)
        std = X_tensor.std(dim=(0, 1), keepdim=True) + 1e-8
        X_tensor = (X_tensor - mean) / std

        # Normalization statistics to save
        norm_stats = {'mean': mean, 'std': std}

        # Split train/validation
        X_train, X_val, Y_train, Y_val = train_test_split(
            X_tensor, Y_tensor,
            test_size=validation_split,
            random_state=42,
            stratify=Y_tensor
        )

        # Create DataLoaders
        train_dataset = TensorDataset(X_train, Y_train)
        val_dataset = TensorDataset(X_val, Y_val)

        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

        # Get number of classes
        n_classes = self.gesture_repo.get_gesture_count()

        return train_loader, val_loader, n_classes, norm_stats

    def train_model(
        self,
        epochs: int = 50,
        batch_size: int = 24,  # Optimized (Random Search)
        validation_split: float = 0.2,
        model_save_path: Optional[Path] = None,
        norm_stats_path: Optional[Path] = None
    ):
        """
        Execute the model training process.

        Args:
            epochs (int): Number of training epochs.
            batch_size (int): Batch size for training.
            validation_split (float): Fraction of data for validation.
            model_save_path (Path, optional): Path to save the trained model.
            norm_stats_path (Path, optional): Path to save normalization statistics.

        Yields:
            dict: Progress for each epoch.

        Returns:
            dict: Final training metrics.
        """
        # Prepare data
        train_loader, val_loader, n_classes, norm_stats = self.prepare_data(
            validation_split, batch_size
        )

        # Create model
        model = GestureNet(output_size=n_classes).to(self.device)

        # Variables to save the best model
        best_val_acc = 0.0
        best_model_state = None

        # Train using the strategy
        for progress in self.training_strategy.train(
            model, train_loader, val_loader, epochs, self.device
        ):
            # Save best model
            if progress['val_acc'] > best_val_acc:
                best_val_acc = progress['val_acc']
                best_model_state = model.state_dict().copy()

            # Yield progress for UI
            yield progress

        # Restore best model
        if best_model_state is not None:
            model.load_state_dict(best_model_state)

        # Save model and statistics
        if model_save_path:
            self.model_saver.save_model(model, model_save_path)

        if norm_stats_path:
            self.model_saver.save_normalization_stats(norm_stats, norm_stats_path)

        # Return final metrics
        return {
            'best_val_acc': best_val_acc,
            'n_classes': n_classes,
            'model_info': model.get_model_info()
        }

    def get_training_info(self) -> Dict:
        """
        Get information about the current training state.

        Returns:
            dict: Information about data existence, gesture count, gesture map, and device.
        """
        return {
            'data_exists': self.data_loader.data_exists(),
            'n_gestures': self.gesture_repo.get_gesture_count(),
            'gestures_map': self.gesture_repo.load_gestures_map(),
            'device': str(self.device)
        }
