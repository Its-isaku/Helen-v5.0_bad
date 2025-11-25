
"""
LSTM Neural Network Architecture for Helen Gesture Recognition.

Processes temporal sequences of hand landmarks (21 points x 3 coordinates x 2 hands = 126 features).

Optimized Configuration (Random Search, Val Accuracy: 99.5%):
    - Hidden Size: 128
    - Num Layers: 3
    - Dropout: 0.35
    - Learning Rate: 0.0005 (recommended)
    - Batch Size: 24 (recommended)

All documentation and comments are in English for professional standards.
"""

import torch
import torch.nn as nn



###############################################################################
# GestureNet Model Definition
###############################################################################

class GestureNet(nn.Module):
    """
    LSTM neural network for gesture classification based on temporal sequences.

    Args:
        input_size (int): Feature dimension per frame (default: 126 = 42 landmarks * 3 coords).
        hidden_size (int): LSTM hidden layer size (default: 128, optimized).
        num_layers (int): Number of stacked LSTM layers (default: 3, optimized).
        output_size (int): Number of gesture classes to classify (dynamic from gestures_map.json).
        dropout (float): Dropout rate between LSTM layers (default: 0.35, optimized).
    """

    def __init__(self, input_size=126, hidden_size=128, num_layers=3, output_size=2, dropout=0.35):
        super(GestureNet, self).__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.output_size = output_size
        # Bidirectional LSTM layer for temporal pattern extraction
        # batch_first=True: input shape (batch_size, seq_length, input_size)
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=True
        )
        # Batch normalization for training stability
        self.batch_norm = nn.BatchNorm1d(hidden_size * 2)  # *2 for bidirectional
        # Fully connected layers for classification
        self.fc = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(dropout / 2),
            nn.Linear(hidden_size // 2, output_size)
        )

    def forward(self, x):
        """
        Forward pass of the network.

        Args:
            x (torch.Tensor): Input tensor of shape (batch_size, seq_length, input_size)
        Returns:
            torch.Tensor: Output logits of shape (batch_size, output_size)
        """
        # LSTM processes the entire sequence
        lstm_out, (hn, cn) = self.lstm(x)
        # Take the last hidden state from both directions
        hidden = torch.cat((hn[-2], hn[-1]), dim=1)  # (batch_size, hidden_size * 2)
        hidden = self.batch_norm(hidden)
        output = self.fc(hidden)
        return output

    def get_model_info(self):
        """
        Return model information for logging.

        Returns:
            dict: Model configuration and parameter counts.
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



###############################################################################
# Main Entrypoint: Model Test
###############################################################################

if __name__ == "__main__":
    """
    Example test for GestureNet model.
    """
    print("🧪 Testing GestureNet...")
    # Create example model with 5 gesture classes
    model = GestureNet(output_size=5)
    # Print model info
    info = model.get_model_info()
    print("\n📊 Model Info:")
    for key, value in info.items():
        print(f"  {key}: {value}")
    # Test with synthetic data
    batch_size = 4
    seq_length = 40
    input_size = 126
    x_test = torch.randn(batch_size, seq_length, input_size)
    print(f"\n🔢 Input shape: {x_test.shape}")
    # Forward pass
    model.eval()
    with torch.no_grad():
        output = model(x_test)
    print(f"\n✅ Output shape: {output.shape}")
    print(f"📈 Output logits (sample):\n{output[0]}")
    # Softmax for probabilities
    probs = torch.softmax(output, dim=1)
    print(f"\n🎯 Probabilities (sample):\n{probs[0]}")
    predictions = torch.argmax(output, dim=1)
    print(f"\n🏆 Predictions: {predictions}")
    print("\n✅ Model is working correctly!")
