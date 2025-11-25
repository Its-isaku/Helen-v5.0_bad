"""
Paquete model - Arquitectura y entrenamiento del modelo
"""

from .interfaces import (
    IDataLoader,
    IModelSaver,
    IGestureRepository,
    ITrainingStrategy,
    IUserInterface
)

from .repositories import (
    FileDataLoader,
    TorchModelSaver,
    JsonGestureRepository
)

from .training_service import (
    ModelTrainingService,
    StandardTrainingStrategy
)

try:
    from .model import GestureNet
except ImportError:
    pass

__all__ = [
    'IDataLoader',
    'IModelSaver',
    'IGestureRepository',
    'ITrainingStrategy',
    'IUserInterface',
    'FileDataLoader',
    'TorchModelSaver',
    'JsonGestureRepository',
    'ModelTrainingService',
    'StandardTrainingStrategy',
    'GestureNet'
]
