# 🧠 ML Service Setup Guide

Guía completa para configurar el servicio de Machine Learning del proyecto Helen.

## 📋 Pre-requisitos

- ✅ [Development Environment Setup](./DEVELOPMENT_ENVIRONMENT.md)
- ✅ Python 3.10+ instalado
- ✅ PyTorch instalado
- ✅ Dataset de gestos disponible

---

## 🏗️ Estructura del Proyecto ML

```
backend/ml-service/
├── data_prep.py           # Preparación de datos
├── train_solid.py         # Script de entrenamiento
├── requirements.txt       # Dependencias Python
├── model/                 # Arquitectura del modelo
│   ├── __init__.py
│   ├── solid_classifier.py
│   └── layers.py
├── data/                  # Datos procesados
│   ├── processed/
│   │   ├── train/
│   │   ├── val/
│   │   └── test/
│   └── augmented/
├── trained_models/        # Modelos entrenados
│   ├── best_model.pth
│   ├── checkpoint_epoch_10.pth
│   └── model_config.json
├── logs/                  # Logs de entrenamiento
│   └── training_YYYYMMDD_HHMMSS.log
├── utils/                 # Utilidades
│   ├── __init__.py
│   ├── preprocessing.py
│   ├── augmentation.py
│   └── metrics.py
└── notebooks/            # Jupyter notebooks
    ├── data_exploration.ipynb
    └── model_analysis.ipynb
```

---

## 📦 Instalación

### 1. Navegar al directorio ML

```bash
cd backend/ml-service
```

### 2. Crear entorno virtual

**Linux/macOS**:
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows**:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Instalar dependencias

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 📝 Dependencias (requirements.txt)

```txt
# Deep Learning
torch==2.1.0
torchvision==0.16.0
torchaudio==2.1.0

# Data Science
numpy==1.24.3
pandas==2.1.4
scikit-learn==1.3.2

# Image Processing
opencv-python==4.8.1.78
mediapipe==0.10.8
Pillow==10.1.0

# Visualization
matplotlib==3.8.2
seaborn==0.13.0
tensorboard==2.15.1

# Utilities
tqdm==4.66.1
pyyaml==6.0.1
loguru==0.7.2

# Jupyter
jupyter==1.0.0
ipywidgets==8.1.1

# Testing
pytest==7.4.3
```

### Instalación de PyTorch

**CPU only**:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

**GPU (CUDA 11.8)**:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**GPU (CUDA 12.1)**:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### Verificar instalación de PyTorch

```python
import torch

print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda if torch.cuda.is_available() else 'N/A'}")
print(f"Device: {torch.device('cuda' if torch.cuda.is_available() else 'cpu')}")
```

---

## 📊 Preparación de Datos

### 1. Estructura del Dataset

El dataset debe tener esta estructura:

```
dataset_gestos/
├── A/
│   ├── img_001.jpg
│   ├── img_002.jpg
│   └── ...
├── B/
│   ├── img_001.jpg
│   └── ...
├── C/
└── ...
```

Cada carpeta representa una clase (gesto).

### 2. Ejecutar Preparación de Datos

```bash
python data_prep.py --dataset ../dataset_gestos --output data/processed
```

**Opciones disponibles**:

```bash
python data_prep.py --help

# Opciones:
#   --dataset PATH      Ruta al dataset original
#   --output PATH       Ruta para datos procesados
#   --split 0.7 0.15    División train/val/test
#   --augment          Aplicar data augmentation
#   --normalize        Normalizar landmarks
#   --visualize        Visualizar muestras
```

### 3. Script data_prep.py (ejemplo básico)

```python
import argparse
import cv2
import mediapipe as mp
import numpy as np
from pathlib import Path
from tqdm import tqdm
import json

class DataPreparator:
    """Preparador de datos para entrenamiento"""
    
    def __init__(self, dataset_path, output_path):
        self.dataset_path = Path(dataset_path)
        self.output_path = Path(output_path)
        
        # Inicializar MediaPipe
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=True,
            max_num_hands=1,
            min_detection_confidence=0.5
        )
    
    def extract_landmarks(self, image_path):
        """Extraer landmarks de una imagen"""
        # Leer imagen
        image = cv2.imread(str(image_path))
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Detectar manos
        results = self.hands.process(image_rgb)
        
        if results.multi_hand_landmarks:
            landmarks = []
            for hand_landmarks in results.multi_hand_landmarks:
                for landmark in hand_landmarks.landmark:
                    landmarks.extend([landmark.x, landmark.y, landmark.z])
            return np.array(landmarks)
        
        return None
    
    def process_dataset(self, split_ratios=(0.7, 0.15, 0.15)):
        """Procesar todo el dataset"""
        
        # Crear directorios de salida
        for split in ['train', 'val', 'test']:
            (self.output_path / split).mkdir(parents=True, exist_ok=True)
        
        # Procesar cada clase
        classes = [d for d in self.dataset_path.iterdir() if d.is_dir()]
        
        all_data = {
            'train': {'landmarks': [], 'labels': []},
            'val': {'landmarks': [], 'labels': []},
            'test': {'landmarks': [], 'labels': []}
        }
        
        class_names = []
        
        for class_idx, class_dir in enumerate(tqdm(classes, desc="Procesando clases")):
            class_name = class_dir.name
            class_names.append(class_name)
            
            # Obtener todas las imágenes
            images = list(class_dir.glob('*.jpg')) + list(class_dir.glob('*.png'))
            
            # Extraer landmarks
            landmarks_list = []
            for img_path in tqdm(images, desc=f"  {class_name}", leave=False):
                landmarks = self.extract_landmarks(img_path)
                if landmarks is not None:
                    landmarks_list.append(landmarks)
            
            # Dividir en train/val/test
            n_samples = len(landmarks_list)
            n_train = int(n_samples * split_ratios[0])
            n_val = int(n_samples * split_ratios[1])
            
            train_data = landmarks_list[:n_train]
            val_data = landmarks_list[n_train:n_train+n_val]
            test_data = landmarks_list[n_train+n_val:]
            
            # Agregar a los conjuntos
            all_data['train']['landmarks'].extend(train_data)
            all_data['train']['labels'].extend([class_idx] * len(train_data))
            
            all_data['val']['landmarks'].extend(val_data)
            all_data['val']['labels'].extend([class_idx] * len(val_data))
            
            all_data['test']['landmarks'].extend(test_data)
            all_data['test']['labels'].extend([class_idx] * len(test_data))
        
        # Guardar datos procesados
        for split in ['train', 'val', 'test']:
            np.save(
                self.output_path / split / 'landmarks.npy',
                np.array(all_data[split]['landmarks'])
            )
            np.save(
                self.output_path / split / 'labels.npy',
                np.array(all_data[split]['labels'])
            )
        
        # Guardar nombres de clases
        with open(self.output_path / 'class_names.json', 'w') as f:
            json.dump(class_names, f)
        
        print(f"\n✅ Dataset procesado:")
        print(f"   Train: {len(all_data['train']['labels'])} muestras")
        print(f"   Val:   {len(all_data['val']['labels'])} muestras")
        print(f"   Test:  {len(all_data['test']['labels'])} muestras")
        print(f"   Clases: {len(class_names)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--dataset', required=True, help='Ruta al dataset')
    parser.add_argument('--output', default='data/processed', help='Ruta de salida')
    args = parser.parse_args()
    
    preparator = DataPreparator(args.dataset, args.output)
    preparator.process_dataset()
```

---

## 🧠 Arquitectura del Modelo

### Archivo: `model/solid_classifier.py`

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class GestureClassifier(nn.Module):
    """Red neuronal para clasificación de gestos"""
    
    def __init__(self, input_size=63, num_classes=26, dropout=0.3):
        """
        Args:
            input_size: 21 landmarks * 3 coordenadas = 63
            num_classes: Número de gestos a clasificar
            dropout: Tasa de dropout para regularización
        """
        super(GestureClassifier, self).__init__()
        
        # Capas fully connected
        self.fc1 = nn.Linear(input_size, 256)
        self.bn1 = nn.BatchNorm1d(256)
        self.dropout1 = nn.Dropout(dropout)
        
        self.fc2 = nn.Linear(256, 512)
        self.bn2 = nn.BatchNorm1d(512)
        self.dropout2 = nn.Dropout(dropout)
        
        self.fc3 = nn.Linear(512, 256)
        self.bn3 = nn.BatchNorm1d(256)
        self.dropout3 = nn.Dropout(dropout)
        
        self.fc4 = nn.Linear(256, 128)
        self.bn4 = nn.BatchNorm1d(128)
        self.dropout4 = nn.Dropout(dropout)
        
        self.fc5 = nn.Linear(128, num_classes)
    
    def forward(self, x):
        """Forward pass"""
        # Layer 1
        x = self.fc1(x)
        x = self.bn1(x)
        x = F.relu(x)
        x = self.dropout1(x)
        
        # Layer 2
        x = self.fc2(x)
        x = self.bn2(x)
        x = F.relu(x)
        x = self.dropout2(x)
        
        # Layer 3
        x = self.fc3(x)
        x = self.bn3(x)
        x = F.relu(x)
        x = self.dropout3(x)
        
        # Layer 4
        x = self.fc4(x)
        x = self.bn4(x)
        x = F.relu(x)
        x = self.dropout4(x)
        
        # Output layer
        x = self.fc5(x)
        
        return x
```

---

## 🚀 Entrenamiento del Modelo

### Script: train_solid.py (ejemplo completo)

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
from pathlib import Path
import json
from tqdm import tqdm
from loguru import logger
import time

from model.solid_classifier import GestureClassifier

class GestureDataset(Dataset):
    """Dataset personalizado para gestos"""
    
    def __init__(self, landmarks_path, labels_path):
        self.landmarks = np.load(landmarks_path)
        self.labels = np.load(labels_path)
    
    def __len__(self):
        return len(self.labels)
    
    def __getitem__(self, idx):
        landmark = torch.FloatTensor(self.landmarks[idx])
        label = torch.LongTensor([self.labels[idx]])[0]
        return landmark, label

class Trainer:
    """Entrenador del modelo"""
    
    def __init__(self, data_dir='data/processed', device='cuda'):
        self.data_dir = Path(data_dir)
        self.device = torch.device(device if torch.cuda.is_available() else 'cpu')
        
        # Cargar datasets
        self.train_dataset = GestureDataset(
            self.data_dir / 'train' / 'landmarks.npy',
            self.data_dir / 'train' / 'labels.npy'
        )
        self.val_dataset = GestureDataset(
            self.data_dir / 'val' / 'landmarks.npy',
            self.data_dir / 'val' / 'labels.npy'
        )
        
        # Cargar nombres de clases
        with open(self.data_dir / 'class_names.json', 'r') as f:
            self.class_names = json.load(f)
        
        # DataLoaders
        self.train_loader = DataLoader(
            self.train_dataset,
            batch_size=32,
            shuffle=True,
            num_workers=4
        )
        self.val_loader = DataLoader(
            self.val_dataset,
            batch_size=32,
            shuffle=False,
            num_workers=4
        )
        
        # Modelo
        self.model = GestureClassifier(
            input_size=63,
            num_classes=len(self.class_names)
        ).to(self.device)
        
        # Loss y optimizer
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.001)
        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer,
            mode='min',
            factor=0.5,
            patience=5,
            verbose=True
        )
        
        logger.info(f"Dispositivo: {self.device}")
        logger.info(f"Train samples: {len(self.train_dataset)}")
        logger.info(f"Val samples: {len(self.val_dataset)}")
        logger.info(f"Clases: {len(self.class_names)}")
    
    def train_epoch(self):
        """Entrenar una época"""
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0
        
        pbar = tqdm(self.train_loader, desc="Training")
        for landmarks, labels in pbar:
            landmarks = landmarks.to(self.device)
            labels = labels.to(self.device)
            
            # Forward
            outputs = self.model(landmarks)
            loss = self.criterion(outputs, labels)
            
            # Backward
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()
            
            # Métricas
            total_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            # Actualizar progress bar
            pbar.set_postfix({
                'loss': f'{loss.item():.4f}',
                'acc': f'{100.*correct/total:.2f}%'
            })
        
        avg_loss = total_loss / len(self.train_loader)
        accuracy = 100. * correct / total
        
        return avg_loss, accuracy
    
    def validate(self):
        """Validar modelo"""
        self.model.eval()
        total_loss = 0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for landmarks, labels in tqdm(self.val_loader, desc="Validation"):
                landmarks = landmarks.to(self.device)
                labels = labels.to(self.device)
                
                outputs = self.model(landmarks)
                loss = self.criterion(outputs, labels)
                
                total_loss += loss.item()
                _, predicted = outputs.max(1)
                total += labels.size(0)
                correct += predicted.eq(labels).sum().item()
        
        avg_loss = total_loss / len(self.val_loader)
        accuracy = 100. * correct / total
        
        return avg_loss, accuracy
    
    def train(self, epochs=50):
        """Entrenar modelo"""
        best_val_acc = 0
        
        for epoch in range(epochs):
            logger.info(f"\nEpoch {epoch+1}/{epochs}")
            
            # Train
            train_loss, train_acc = self.train_epoch()
            logger.info(f"Train - Loss: {train_loss:.4f}, Acc: {train_acc:.2f}%")
            
            # Validate
            val_loss, val_acc = self.validate()
            logger.info(f"Val   - Loss: {val_loss:.4f}, Acc: {val_acc:.2f}%")
            
            # Learning rate scheduling
            self.scheduler.step(val_loss)
            
            # Guardar mejor modelo
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                self.save_model('trained_models/best_model.pth')
                logger.info(f"✅ Mejor modelo guardado! (Val Acc: {val_acc:.2f}%)")
            
            # Guardar checkpoint cada 10 epochs
            if (epoch + 1) % 10 == 0:
                self.save_model(f'trained_models/checkpoint_epoch_{epoch+1}.pth')
        
        logger.info(f"\n🎉 Entrenamiento completado!")
        logger.info(f"Mejor Val Accuracy: {best_val_acc:.2f}%")
    
    def save_model(self, path):
        """Guardar modelo"""
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'class_names': self.class_names,
            'num_classes': len(self.class_names)
        }, path)

if __name__ == "__main__":
    # Configurar logging
    logger.add("logs/training_{time}.log")
    
    # Entrenar
    trainer = Trainer(
        data_dir='data/processed',
        device='cuda'  # o 'cpu'
    )
    
    trainer.train(epochs=50)
```

### Ejecutar Entrenamiento

```bash
# Con GPU
python train_solid.py

# Solo CPU
python train_solid.py --device cpu

# Personalizado
python train_solid.py --epochs 100 --batch-size 64 --lr 0.0001
```

---

## 📊 Monitoreo con TensorBoard

### Agregar TensorBoard al entrenamiento

```python
from torch.utils.tensorboard import SummaryWriter

# En el init del Trainer
self.writer = SummaryWriter('runs/experiment_1')

# Durante el entrenamiento
self.writer.add_scalar('Loss/train', train_loss, epoch)
self.writer.add_scalar('Loss/val', val_loss, epoch)
self.writer.add_scalar('Accuracy/train', train_acc, epoch)
self.writer.add_scalar('Accuracy/val', val_acc, epoch)
```

### Visualizar en TensorBoard

```bash
tensorboard --logdir=runs
```

Abrir en navegador: http://localhost:6006

---

## 🧪 Evaluación del Modelo

### Script de evaluación

```python
import torch
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

def evaluate_model(model_path, test_loader, class_names, device='cpu'):
    """Evaluar modelo en conjunto de test"""
    
    # Cargar modelo
    checkpoint = torch.load(model_path, map_location=device)
    model = GestureClassifier(input_size=63, num_classes=len(class_names))
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()
    
    # Predicciones
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for landmarks, labels in test_loader:
            landmarks = landmarks.to(device)
            outputs = model(landmarks)
            _, predicted = outputs.max(1)
            
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.numpy())
    
    # Matriz de confusión
    cm = confusion_matrix(all_labels, all_preds)
    
    plt.figure(figsize=(12, 10))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=class_names,
                yticklabels=class_names)
    plt.title('Matriz de Confusión')
    plt.ylabel('Verdadero')
    plt.xlabel('Predicho')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png')
    
    # Reporte de clasificación
    print(classification_report(all_labels, all_preds, 
                                target_names=class_names))
```

---

## ✅ Checklist de Setup ML

- [ ] Entorno virtual creado
- [ ] PyTorch instalado correctamente
- [ ] Dataset preparado y procesado
- [ ] Modelo definido
- [ ] Script de entrenamiento funciona
- [ ] Modelo entrenado guardado
- [ ] Evaluación completada
- [ ] Logs y métricas guardados

---

**Siguiente paso**: [Docker Setup](./DOCKER_SETUP.md) para containerización.

---

**Última actualización**: Octubre 2025  
**Mantenido por**: Equipo Helen - 5ta Generación
