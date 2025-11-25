"""
Script de Prueba del Sistema Helen
Verifica que el modelo y API funcionen correctamente
"""

import torch
import numpy as np
import json
from pathlib import Path
import sys

# Agregar paths
# Agregar paths (usar nombres reales de carpetas del repo)
sys.path.append('ml-service')
sys.path.append('api')

from model import GestureNet


def test_model_architecture():
    """Test 1: Verificar que la arquitectura del modelo funcione"""
    print("\n" + "="*70)
    print("🧪 TEST 1: Arquitectura del Modelo")
    print("="*70)
    
    try:
        # Crear modelo de prueba
        model = GestureNet(output_size=5)
        
        # Datos sintéticos
        batch_size = 4
        seq_length = 40
        input_size = 126
        
        x_test = torch.randn(batch_size, seq_length, input_size)
        
        # Forward pass
        model.eval()
        with torch.no_grad():
            output = model(x_test)
        
        # Verificaciones
        assert output.shape == (batch_size, 5), f"Shape incorrecto: {output.shape}"
        
        # Info del modelo
        info = model.get_model_info()
        
        print(f"✅ Arquitectura OK")
        print(f"  Input: {x_test.shape}")
        print(f"  Output: {output.shape}")
        print(f"  Parámetros: {info['total_params']:,}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_data_preparation():
    """Test 2: Verificar preparación de datos"""
    print("\n" + "="*70)
    print("🧪 TEST 2: Preparación de Datos")
    print("="*70)
    
    try:
        x_path = Path('ml-service/data/X_data.npy')
        y_path = Path('ml-service/data/Y_labels.npy')
        gestures_path = Path('ml-service/data/gestures_map.json')
        
        # Verificar existencia de archivos
        if not x_path.exists():
            print("⚠️  X_data.npy no encontrado (ejecuta data_prep.py primero)")
            return False
        
        # Cargar datos
        X = np.load(x_path)
        Y = np.load(y_path)
        
        with open(gestures_path, 'r') as f:
            gestures_map = json.load(f)
        
        print(f"✅ Datos cargados correctamente")
        print(f"  X shape: {X.shape}")
        print(f"  Y shape: {Y.shape}")
        print(f"  Gestos: {list(gestures_map.keys())}")
        print(f"  Clases: {len(gestures_map)}")
        
        # Verificar consistencia
        assert X.shape[0] == Y.shape[0], "Inconsistencia entre X e Y"
        assert X.shape[1] == 40, f"Longitud de secuencia incorrecta: {X.shape[1]}"
        assert X.shape[2] == 126, f"Número de features incorrecto: {X.shape[2]}"
        
        print(f"✅ Validaciones de datos OK")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_model_inference():
    """Test 3: Verificar inferencia del modelo"""
    print("\n" + "="*70)
    print("🧪 TEST 3: Inferencia del Modelo")
    print("="*70)
    
    try:
        model_path = Path('ml-service/trained_models/model_final.pth')
        gestures_path = Path('ml-service/data/gestures_map.json')
        
        if not model_path.exists():
            print("⚠️  model_final.pth no encontrado (entrena el modelo primero)")
            return False
        
        # Cargar mapeo
        with open(gestures_path, 'r') as f:
            gestures_map = json.load(f)
        
        n_classes = len(gestures_map)
        
        # Cargar modelo
        model = GestureNet(output_size=n_classes)
        model.load_state_dict(torch.load(model_path, map_location='cpu'))
        model.eval()
        
        # Crear datos de prueba
        x_test = torch.randn(1, 40, 126)  # 1 secuencia
        
        # Inferencia
        with torch.no_grad():
            logits = model(x_test)
            probs = torch.softmax(logits, dim=1)
            pred = torch.argmax(probs, dim=1).item()
        
        # Mapeo inverso
        gestures_inv = {v: k for k, v in gestures_map.items()}
        predicted_gesture = gestures_inv[pred]
        
        print(f"✅ Inferencia OK")
        print(f"  Logits shape: {logits.shape}")
        print(f"  Predicción: {predicted_gesture} (ID: {pred})")
        print(f"  Confianza: {probs[0, pred].item():.4f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_api_structure():
    """Test 4: Verificar estructura de API"""
    print("\n" + "="*70)
    print("🧪 TEST 4: Estructura de API")
    print("="*70)
    
    try:
        required_files = [
            'api/model.py',
            'api/api_service.py',
            'api/requirements.txt'
        ]
        
        missing = []
        for file in required_files:
            if not Path(file).exists():
                missing.append(file)
        
        if missing:
            print(f"❌ Archivos faltantes:")
            for f in missing:
                print(f"  - {f}")
            return False
        
        print(f"✅ Estructura de API OK")
        print(f"  ✓ model.py")
        print(f"  ✓ api_service.py")
        print(f"  ✓ requirements.txt")
        
        # Verificar archivos del modelo
        model_files = [
            'api/model_final.pth',
            'api/gestures_map.json',
            'api/normalization_stats.pth'
        ]
        
        print(f"\n  Archivos del modelo:")
        for file in model_files:
            exists = Path(file).exists()
            symbol = "✓" if exists else "✗"
            print(f"  {symbol} {Path(file).name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_api_mock_request():
    """Test 5: Simular request a la API"""
    print("\n" + "="*70)
    print("🧪 TEST 5: Mock Request a API")
    print("="*70)
    
    try:
        # Simular secuencia de entrada
        sequence = np.random.rand(40, 126).tolist()
        
        request_json = {
            "sequence": sequence
        }
        
        # Validar estructura
        assert isinstance(request_json['sequence'], list)
        assert len(request_json['sequence']) == 40
        assert len(request_json['sequence'][0]) == 126
        
        print(f"✅ Estructura de request válida")
        print(f"  Formato: JSON")
        print(f"  Secuencia: 40 frames x 126 features")
        print(f"  Tamaño estimado: {len(str(request_json))} bytes")

        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def run_all_tests():
    """Ejecutar todos los tests"""
    print("\n" + "="*70)
    print("🚀 INICIANDO TESTS DEL SISTEMA HELEN")
    print("="*70)
    
    tests = [
        ("Arquitectura del Modelo", test_model_architecture),
        ("Preparación de Datos", test_data_preparation),
        ("Inferencia del Modelo", test_model_inference),
        ("Estructura de API", test_api_structure),
        ("Mock Request a API", test_api_mock_request)
    ]
    
    results = []
    
    for name, test_func in tests:
        result = test_func()
        results.append((name, result))
    
    # Resumen
    print("\n" + "="*70)
    print("📊 RESUMEN DE TESTS")
    print("="*70)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        symbol = "✅" if result else "❌"
        print(f"  {symbol} {name}")
    
    print(f"\n  Total: {passed}/{total} tests pasados")
    
    if passed == total:
        print("\n🎉 ¡Todos los tests pasaron! El sistema está listo.")
    else:
        print("\n⚠️  Algunos tests fallaron. Revisa los mensajes arriba.")
    
    print("="*70 + "\n")
    
    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
