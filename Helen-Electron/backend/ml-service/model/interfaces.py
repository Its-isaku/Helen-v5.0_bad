"""
Interfaces y Abstracciones Base (SOLID - Interface Segregation & Dependency Inversion)
Define contratos que las implementaciones concretas deben seguir
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Tuple, Optional
import numpy as np
import torch


class IDataLoader(ABC):
    """
    Interface para carga de datos (Interface Segregation Principle)
    Cualquier implementación de carga de datos debe seguir este contrato
    """
    
    @abstractmethod
    def load_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Carga datos de entrenamiento
        
        Returns:
            Tuple[np.ndarray, np.ndarray]: (X_data, Y_labels)
        """
        pass
    
    @abstractmethod
    def data_exists(self) -> bool:
        """Verifica si existen datos disponibles"""
        pass


class IModelSaver(ABC):
    """
    Interface para persistencia de modelos (Interface Segregation Principle)
    Separa la responsabilidad de guardar/cargar del entrenamiento
    """
    
    @abstractmethod
    def save_model(self, model: torch.nn.Module, path: Path) -> None:
        """Guarda el modelo entrenado"""
        pass
    
    @abstractmethod
    def load_model(self, model: torch.nn.Module, path: Path) -> torch.nn.Module:
        """Carga un modelo existente"""
        pass
    
    @abstractmethod
    def save_normalization_stats(self, stats: Dict, path: Path) -> None:
        """Guarda estadísticas de normalización"""
        pass


class IGestureRepository(ABC):
    """
    Interface para gestión del mapeo de gestos (Single Responsibility Principle)
    Maneja únicamente el almacenamiento y recuperación del mapeo
    """
    
    @abstractmethod
    def load_gestures_map(self) -> Dict[str, int]:
        """Carga el mapeo de gestos desde almacenamiento"""
        pass
    
    @abstractmethod
    def save_gestures_map(self, gestures_map: Dict[str, int]) -> None:
        """Guarda el mapeo de gestos"""
        pass
    
    @abstractmethod
    def add_gesture(self, gesture_name: str) -> int:
        """Agrega un nuevo gesto y retorna su ID"""
        pass
    
    @abstractmethod
    def get_gesture_count(self) -> int:
        """Retorna el número de gestos registrados"""
        pass


class ITrainingStrategy(ABC):
    """
    Interface para estrategias de entrenamiento (Strategy Pattern + Open/Closed)
    Permite diferentes estrategias sin modificar el código existente
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
        Ejecuta el entrenamiento
        
        Returns:
            Dict con métricas finales
        """
        pass


class IUserInterface(ABC):
    """
    Interface para la interfaz de usuario (Dependency Inversion Principle)
    La lógica de negocio no depende de la implementación concreta de UI
    """
    
    @abstractmethod
    def show_menu(self) -> str:
        """Muestra el menú y retorna la opción seleccionada"""
        pass
    
    @abstractmethod
    def get_training_params(self) -> Dict[str, any]:
        """Obtiene parámetros de entrenamiento del usuario"""
        pass
    
    @abstractmethod
    def get_gesture_info(self) -> Tuple[str, str]:
        """Obtiene nombre y path del dataset para nuevo gesto"""
        pass
    
    @abstractmethod
    def show_message(self, message: str, message_type: str = "info") -> None:
        """Muestra un mensaje al usuario"""
        pass
    
    @abstractmethod
    def show_progress(self, current: int, total: int, metrics: Dict) -> None:
        """Muestra progreso del entrenamiento"""
        pass
    
    @abstractmethod
    def show_gestures(self, gestures_map: Dict[str, int]) -> None:
        """Muestra los gestos registrados"""
        pass
