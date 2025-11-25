"""
Arquitectura de Red Neuronal LSTM para Reconocimiento de Gestos
Procesa secuencias temporales de landmarks de manos (21 puntos x 3 coordenadas = 63 features)
"""

import torch
import torch.nn as nn


class GestureNet(nn.Module):
    """
    Red Neuronal LSTM para clasificación de gestos basada en secuencias temporales
    
    Args:
        input_size (int): Dimensión de features por frame (default: 63 = 21 landmarks * 3 coords)
        hidden_size (int): Tamaño de la capa oculta LSTM (default: 128)
        num_layers (int): Número de capas LSTM apiladas (default: 2)
        output_size (int): Número de clases/gestos a clasificar (dinámico según gestures_map.json)
        dropout (float): Tasa de dropout entre capas LSTM (default: 0.3)
    """
    
    def __init__(self, input_size=126, hidden_size=128, num_layers=2, output_size=2, dropout=0.3):
        super(GestureNet, self).__init__()
        
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.output_size = output_size
        
        # Capa LSTM bidireccional para capturar patrones temporales
        # batch_first=True: entrada de forma (batch_size, seq_length, input_size)
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,  # Dropout entre capas LSTM
            bidirectional=True  # Procesa secuencia en ambas direcciones
        )
        
        # Capa de normalización para estabilizar el entrenamiento
        self.batch_norm = nn.BatchNorm1d(hidden_size * 2)  # *2 por bidireccional
        
        # Capas fully connected para clasificación
        self.fc = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size),  # *2 por bidireccional
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(dropout / 2),
            nn.Linear(hidden_size // 2, output_size)
        )
        
    def forward(self, x):
        """
        Forward pass de la red
        
        Args:
            x (torch.Tensor): Tensor de entrada con forma (batch_size, seq_length, input_size)
                            - batch_size: número de muestras en el batch
                            - seq_length: longitud de la secuencia (ej. 40 frames)
                            - input_size: features por frame (126)
        
        Returns:
            torch.Tensor: Logits de salida con forma (batch_size, output_size)
        """
        # LSTM procesa toda la secuencia
        # lstm_out: (batch_size, seq_length, hidden_size * 2)
        # hn: (num_layers * 2, batch_size, hidden_size) - estados finales
        # cn: estados de celda (no los usamos)
        lstm_out, (hn, cn) = self.lstm(x)
        
        # Tomamos el último hidden state de ambas direcciones
        # hn[-2]: última capa, dirección forward
        # hn[-1]: última capa, dirección backward
        # Concatenamos ambas direcciones
        hidden = torch.cat((hn[-2], hn[-1]), dim=1)  # (batch_size, hidden_size * 2)
        
        # Normalización por batch
        hidden = self.batch_norm(hidden)
        
        # Clasificación final
        output = self.fc(hidden)  # (batch_size, output_size)
        
        return output
    
    def get_model_info(self):
        """
        Retorna información del modelo para logging
        """
        total_params = sum(p.numel() for p in self.parameters())
        trainable_params = sum(p.numel() for p in self.parameters() if p.requires_grad)
        
        return {
            'input_size': self.input_size,
            'hidden_size': self.hidden_size,
            'num_layers': self.num_layers,
            'output_size': self.output_size,
            'total_params': total_params,
            'trainable_params': trainable_params,
            'bidirectional': True
        }
